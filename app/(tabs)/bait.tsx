import {
  Text,
  View,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { parseBaitExcel } from "@/lib/excel-import";
import * as DocumentPicker from "expo-document-picker";
import {
  getBaitItems,
  createBaitItem,
  updateBaitItem,
  deleteBaitItem,
  clearBaitItems,
  type BaitItem,
} from "@/lib/hybrid-storage";
import { serverSyncService } from "@/lib/server-sync-service";
import { useToast } from "@/lib/toast-context";

const SYNC_FILE_KEY = "bait_sync_file";
const AUTO_SYNC_KEY = "bait_auto_sync_enabled";

export default function BaitScreen() {
  const { showToast } = useToast();
  const [items, setItems] = useState<BaitItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<BaitItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formAdvance, setFormAdvance] = useState("");
  const [formPayment, setFormPayment] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [syncFilePath, setSyncFilePath] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getBaitItems();
      setItems(data);
    } catch (error) {
      console.error("Failed to load data:", error);
      showToast('فشل تحديث البيانات', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSyncFile = async () => {
    try {
      const path = await AsyncStorage.getItem(SYNC_FILE_KEY);
      if (path) {
        setSyncFilePath(path);
        const autoSyncEnabled = await AsyncStorage.getItem(AUTO_SYNC_KEY);
        if (autoSyncEnabled !== "false" && path) {
          setTimeout(() => {
            autoImportFromFile(path);
          }, 500);
        }
      }
    } catch (error) {
      console.error("Failed to load sync file path:", error);
    }
  };

  const autoImportFromFile = async (filePath: string) => {
    try {
      const rows = await parseBaitExcel(filePath);
      
      if (rows.length === 0) return;
      
      for (const row of rows) {
        await createBaitItem({
          name: row.name,
          date: row.date,
          advance: row.advance || 0,
          payment: row.payment || 0,
          notes: row.notes,
        });
      }
      
      await loadData();
    } catch (error) {
      console.error("Auto-sync error:", error);
    }
  };

  const selectSyncFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
      });
      
      if (result.assets && result.assets.length > 0) {
        const filePath = result.assets[0].uri;
        setSyncFilePath(filePath);
        await AsyncStorage.setItem(SYNC_FILE_KEY, filePath);
        await AsyncStorage.setItem(AUTO_SYNC_KEY, "true");
      }
    } catch (error) {
      console.error("Error selecting file:", error);
    }
  };

  const importFromFile = async () => {
    if (!syncFilePath) return;
    setIsImporting(true);
    try {
      await autoImportFromFile(syncFilePath);
      showToast("تم استيراد البيانات بنجاح", "success");
    } catch (error: any) {
      showToast(error.message || "فشل الاستيراد", "error");
    } finally {
      setIsImporting(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormAdvance("");
    setFormPayment("");
    setFormDate("");
    setFormNotes("");
    setEditingItem(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalVisible(true);
  };

  const openEditModal = (item: BaitItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormAdvance(item.advance.toString());
    setFormPayment(item.payment.toString());
    setFormDate(item.date);
    setFormNotes(item.notes || "");
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    if (!formName || !formDate) {
      Alert.alert("خطأ", "يرجى إدخال الاسم والتاريخ");
      return;
    }

    try {
      // Convert YYYY-M-D to DD-MM-YYYY format
      const parts = formDate.split('-').map(Number);
      let formattedDate: string;
      if (parts.length === 3) {
        if (parts[0] > 1000) {
          // YYYY-M-D format
          const [year, month, day] = parts;
          formattedDate = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
        } else {
          // Already DD-MM-YYYY or similar
          formattedDate = formDate;
        }
      } else {
        formattedDate = formDate;
      }
      
      const data = {
        name: formName,
        date: formattedDate,
        advance: parseFloat(formAdvance) || 0,
        payment: parseFloat(formPayment) || 0,
        notes: formNotes || '',
      };

      if (editingItem) {
        await updateBaitItem(editingItem.id, data);
      } else {
        await createBaitItem(data);
      }

      // Add to server sync queue
      await serverSyncService.addPendingItem("bait", data);

      await loadData();
      setIsModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert("خطأ", "فشل في حفظ البيانات");
    }
  };

  const handleDelete = (item: BaitItem) => {
    Alert.alert("تأكيد الحذف", `هل تريد حذف ${item.name}؟`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteBaitItem(item.id);
            await loadData();
          } catch (error) {
            Alert.alert("خطأ", "فشل في حذف البيان");
          }
        },
      },
    ]);
  };

  // Filter items based on search query
  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.date.toLowerCase().includes(query) ||
      item.notes?.toLowerCase().includes(query) ||
      item.advance.toString().includes(query) ||
      item.payment.toString().includes(query)
    );
  });

  const totalAdvance = filteredItems.reduce((sum, item) => sum + item.advance, 0);
  const totalPayment = filteredItems.reduce((sum, item) => sum + item.payment, 0);
  const totalRemaining = totalAdvance - totalPayment;

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1" />
          <View className="items-center flex-1">
            <Text className="text-3xl font-bold text-foreground">SELRS</Text>
            <Text className="text-muted">البيت</Text>
          </View>
          <View className="flex-1 items-end">
            <TouchableOpacity
              onPress={loadData}
              className="bg-primary p-2 rounded-full"
              style={{ opacity: isLoading ? 0.5 : 1 }}
              disabled={isLoading}
            >
              <Text className="text-background text-xl">↻</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Input */}
        <View className="mb-4">
          <TextInput
            placeholder="🔍 بحث (الاسم، التاريخ، المبلغ...)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="bg-surface p-4 rounded-lg text-foreground border border-border"
            placeholderTextColor="#9BA1A6"
          />
        </View>

        {/* Summary Cards */}
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1 bg-surface p-3 rounded-lg border-l-4 border-warning">
            <Text className="text-xs text-muted mb-1">معاه</Text>
            <Text className="text-lg font-bold text-warning">
              {totalAdvance.toLocaleString()}
            </Text>
          </View>
          <View className="flex-1 bg-surface p-3 rounded-lg border-l-4 border-success">
            <Text className="text-xs text-muted mb-1">منه</Text>
            <Text className="text-lg font-bold text-success">
              {totalPayment.toLocaleString()}
            </Text>
          </View>
          <View className="flex-1 bg-surface p-3 rounded-lg border-l-4 border-error">
            <Text className="text-xs text-muted mb-1">المتبقي</Text>
            <Text className="text-lg font-bold text-error">
              {totalRemaining.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-2 mb-4">
          <TouchableOpacity
            onPress={openAddModal}
            className="flex-1 bg-primary p-4 rounded-lg"
          >
            <Text className="text-center text-white font-bold">+ إضافة بيان</Text>
          </TouchableOpacity>
        </View>

        {/* Items List */}
        {isLoading ? (
          <Text className="text-center text-muted py-8">جاري التحميل...</Text>
        ) : filteredItems.length === 0 ? (
          <Text className="text-center text-muted py-8">لا توجد معاملات</Text>
        ) : (
          <FlatList
            scrollEnabled={false}
            data={filteredItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="bg-surface border border-border rounded-lg p-4 mb-3">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-foreground">
                      {item.name}
                    </Text>
                    <Text className="text-sm text-muted mt-1">
                      {item.date}
                    </Text>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => openEditModal(item)}
                      className="bg-blue-500 px-3 py-1 rounded"
                    >
                      <Text className="text-white text-sm">تعديل</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item)}
                      className="bg-red-500 px-3 py-1 rounded"
                    >
                      <Text className="text-white text-sm">حذف</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View className="gap-1 mt-3">
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">معاه:</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      {item.advance.toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">منه:</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      {item.payment.toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">المتبقي:</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      {(item.advance - item.payment).toLocaleString()}
                    </Text>
                  </View>
                  {item.notes && (
                    <View className="mt-2 pt-2 border-t border-border">
                      <Text className="text-sm text-muted">
                        ملاحظات: {item.notes}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          />
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-6">
            <Text className="text-2xl font-bold text-foreground mb-4">
              {editingItem ? "تعديل " : "إضافة "}
            </Text>
            
            <TextInput
              placeholder="التاريخ (DD-MM-YYYY)"
              value={formDate}
              onChangeText={setFormDate}
              className="bg-surface p-3 rounded-lg mb-3 text-foreground"
              placeholderTextColor="#9BA1A6"
            />

            <TextInput
              placeholder="المبلغ"
              value={formAmount}
              onChangeText={setFormAmount}
              keyboardType="numeric"
              className="bg-surface p-3 rounded-lg mb-3 text-foreground"
              placeholderTextColor="#9BA1A6"
            />

            <TextInput
              placeholder="ملاحظات"
              value={formNotes}
              onChangeText={setFormNotes}
              multiline
              numberOfLines={3}
              className="bg-surface p-3 rounded-lg mb-4 text-foreground"
              placeholderTextColor="#9BA1A6"
            />

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                className="flex-1 bg-surface p-4 rounded-lg"
              >
                <Text className="text-center text-foreground font-bold">إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                className="flex-1 bg-primary p-4 rounded-lg"
              >
                <Text className="text-center text-white font-bold">حفظ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
