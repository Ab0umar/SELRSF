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
import * as DocumentPicker from "expo-document-picker";

import { ScreenContainer } from "@/components/screen-container";
import { generateQardPDF } from "@/lib/pdf-generator";
import { parseQardExcel } from "@/lib/excel-import";
import {
  getQardItems,
  createQardItem,
  updateQardItem,
  deleteQardItem,
  clearQardItems,
  type QardItem,
} from "@/lib/hybrid-storage";
import { serverSyncService } from "@/lib/server-sync-service";
import { useToast } from "@/lib/toast-context";

const SYNC_FILE_KEY = "qard_sync_file";
const AUTO_SYNC_KEY = "auto_sync_enabled";

export default function QardScreen() {
  const { showToast } = useToast();
  const [syncFilePath, setSyncFilePath] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [items, setItems] = useState<QardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<QardItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    loadSyncFile();
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getQardItems();
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
      const rows = await parseQardExcel(filePath);
      
      if (rows.length === 0) return;
      
      for (const row of rows) {
        await createQardItem({
          name: row.name,
          date: row.date,
          amount: row.amount,
          payment: 0,
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
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        await AsyncStorage.setItem(SYNC_FILE_KEY, fileUri);
        setSyncFilePath(fileUri);
        Alert.alert("تم", "تم حفظ مسار الملف بنجاح");
      }
    } catch (error) {
      Alert.alert("خطأ", "فشل في اختيار الملف");
    }
  };

  const importFromFile = async () => {
    if (!syncFilePath) {
      Alert.alert("خطأ", "يرجى اختيار ملف المزامنة أولاً");
      return;
    }

    setIsImporting(true);
    try {
      const rows = await parseQardExcel(syncFilePath);
      
      if (rows.length === 0) {
        Alert.alert("تنبيه", "لم يتم العثور على بيانات في الملف");
        return;
      }
      
      // Clear existing data before importing
      await clearQardItems();
      
      for (const row of rows) {
        await createQardItem({
          name: row.name,
          date: row.date,
          amount: row.amount,
          payment: 0,
          notes: row.notes,
        });
      }
      
      await loadData();
      Alert.alert("نجح", `تم استيراد ${rows.length} سجل`);
    } catch (error: any) {
      console.error("Import error:", error);
      Alert.alert("خطأ", error.message || "فشل في استيراد البيانات");
    } finally {
      setIsImporting(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormDate("");
    setFormAmount("");
    setFormNotes("");
    setEditingItem(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalVisible(true);
  };

  const openEditModal = (item: QardItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormDate(item.date);
    setFormAmount(item.amount.toString());
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
        amount: parseFloat(formAmount) || 0,
        payment: 0,  // Default payment to 0
        notes: formNotes || '',
      };

      if (editingItem) {
        await updateQardItem(editingItem.id, data);
      } else {
        await createQardItem(data);
      }

      // Add to server sync queue
      await serverSyncService.addPendingItem("qard", data);

      await loadData();
      setIsModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert("خطأ", "فشل في حفظ البيانات");
    }
  };

  const handleDelete = (item: QardItem) => {
    Alert.alert("تأكيد الحذف", `هل تريد حذف قرض ${item.name}؟`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteQardItem(item.id);
            await loadData();
          } catch (error) {
            Alert.alert("خطأ", "فشل في حذف القرض");
          }
        },
      },
    ]);
  };

  const handleExportPDF = async () => {
    try {
      await generateQardPDF(items);
    } catch (error) {
      Alert.alert("خطأ", "فشل في تصدير PDF");
    }
  };

  // Filter items based on search query
  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.date.toLowerCase().includes(query) ||
      item.notes?.toLowerCase().includes(query) ||
      item.amount.toString().includes(query)
    );
  });

  const totalAmount = filteredItems.reduce((sum, item) => sum + item.amount, 0);
  const totalPaid = filteredItems.reduce((sum, item) => sum + item.payment, 0);
  const totalRemaining = totalAmount - totalPaid;

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1" />
          <View className="items-center flex-1">
            <Text className="text-3xl font-bold text-foreground">SELRS</Text>
            <Text className="text-muted">القرض</Text>
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

        {/* Sync File Selection */}
        <TouchableOpacity
          onPress={selectSyncFile}
          className="bg-surface p-4 rounded-lg mb-4 border border-border"
        >
          <Text className="text-center text-foreground font-semibold">
            {syncFilePath ? "✓ تم اختيار ملف المزامنة" : "اختيار ملف المزامنة"}
          </Text>
        </TouchableOpacity>

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
            <Text className="text-xs text-muted mb-1">إجمالي القروض</Text>
            <Text className="text-lg font-bold text-warning">
              {totalAmount.toLocaleString()}
            </Text>
          </View>
          <View className="flex-1 bg-surface p-3 rounded-lg border-l-4 border-success">
            <Text className="text-xs text-muted mb-1">المسدد</Text>
            <Text className="text-lg font-bold text-success">
              {totalPaid.toLocaleString()}
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
            <Text className="text-center text-white font-bold">+ إضافة قرض</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleExportPDF}
            className="bg-success p-4 rounded-lg"
          >
            <Text className="text-center text-white font-bold">PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={importFromFile}
            disabled={isImporting || !syncFilePath}
            className={`p-4 rounded-lg ${
              isImporting || !syncFilePath ? "bg-muted" : "bg-warning"
            }`}
          >
            <Text className="text-center text-white font-bold">
              {isImporting ? "..." : "↻"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Items Count */}
        <Text className="text-center text-muted mb-4">
          عدد القروض: {filteredItems.length}
          {searchQuery && ` (من أصل ${items.length})`}
        </Text>

        {/* Items List */}
        {isLoading ? (
          <Text className="text-center text-muted">جاري التحميل...</Text>
        ) : filteredItems.length === 0 ? (
          <Text className="text-center text-muted">
            {searchQuery ? "لا توجد نتائج للبحث" : "لا توجد قروض"}
          </Text>
        ) : (
          <FlatList
            data={filteredItems}
            scrollEnabled={false}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View className="bg-surface p-4 rounded-lg mb-2">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-foreground font-bold text-lg">{item.name}</Text>
                    <Text className="text-muted text-sm">{item.date}</Text>
                    {item.notes && (
                      <Text className="text-muted text-sm mt-1">{item.notes}</Text>
                    )}
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => openEditModal(item)}
                      className="bg-primary px-3 py-1 rounded"
                    >
                      <Text className="text-white text-xs">تعديل</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item)}
                      className="bg-error px-3 py-1 rounded"
                    >
                      <Text className="text-white text-xs">حذف</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text className="text-primary font-bold text-lg">
                  {item.amount.toLocaleString()} جنيه
                </Text>
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
              {editingItem ? "تعديل قرض" : "إضافة قرض"}
            </Text>

            <TextInput
              placeholder="الاسم"
              value={formName}
              onChangeText={setFormName}
              className="bg-surface p-3 rounded-lg mb-3 text-foreground"
              placeholderTextColor="#9BA1A6"
            />

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
