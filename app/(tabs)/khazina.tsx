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
import { generateKhazinaPDF } from "@/lib/pdf-generator";
import { parseKhazinaExcel } from "@/lib/excel-import";
import {
  getKhazinaItems,
  createKhazinaItem,
  updateKhazinaItem,
  deleteKhazinaItem,
  clearKhazinaItems,
  type KhazinaItem,
} from "@/lib/hybrid-storage";
import { serverSyncService } from "@/lib/server-sync-service";
import { useToast } from "@/lib/toast-context";

const SYNC_FILE_KEY = "khazina_sync_file";
const AUTO_SYNC_KEY = "khazina_auto_sync_enabled";

export default function KhazinaScreen() {
  const { showToast } = useToast();
  const [syncFilePath, setSyncFilePath] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [items, setItems] = useState<KhazinaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Form state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<KhazinaItem | null>(null);
  const [formDate, setFormDate] = useState("");
  const [formRevenue, setFormRevenue] = useState("");
  const [formExpense, setFormExpense] = useState("");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    loadSyncFile();
    loadData();
  }, [selectedYear]);

  useEffect(() => {
    // Auto-select 2026 on first load
    setSelectedYear(2026);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getKhazinaItems();
      const filteredData = data.filter((item) => {
        // Parse DD-MM-YYYY format
        const [day, month, year] = item.date.split('-').map(Number);
        return year === selectedYear;
      });
      setItems(filteredData);
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
      const rows = await parseKhazinaExcel(filePath);

      if (rows.length === 0) return;

      for (const row of rows) {
        // Parse DD-MM-YYYY format
        const [day, month, yearStr] = (row.date || '').split('-').map(Number);
        await createKhazinaItem({
          date: row.date,
          income: row.income || 0,
          expense: row.expense || 0,
          notes: row.notes || '',
          year: yearStr,
          total: (row.income || 0) - (row.expense || 0),
          balance: 0,
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
      const rows = await parseKhazinaExcel(syncFilePath);

      if (rows.length === 0) {
        Alert.alert("تنبيه", "لم يتم العثور على بيانات في الملف");
        return;
      }

      // Clear existing data before importing
      await clearKhazinaItems(selectedYear);

      for (const row of rows) {
        // Parse DD-MM-YYYY format
        const [day, month, yearStr] = (row.date || '').split('-').map(Number);
        await createKhazinaItem({
          date: row.date,
          income: row.income || 0,
          expense: row.expense || 0,
          notes: row.notes || '',
          year: yearStr,
          total: (row.income || 0) - (row.expense || 0),
          balance: 0,
        });
      }

      await loadData();
      Alert.alert("نجح", `تم استيراد ${rows.length} سجل`);
    } catch (error: any) {
      Alert.alert("خطأ", error.message || "فشل في استيراد البيانات");
    } finally {
      setIsImporting(false);
    }
  };

  const handleAddItem = async () => {
    if (!formDate || !formRevenue || !formExpense) {
      Alert.alert("خطأ", "يرجى ملء جميع الحقول المطلوبة");
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
      
      const [day, month, yearStr] = formattedDate.split('-').map(Number);
      const income = parseFloat(formRevenue) || 0;
      const expense = parseFloat(formExpense) || 0;
      const itemData = {
        date: formattedDate,
        income: income,
        expense: expense,
        notes: formNotes,
        year: yearStr,
        total: income - expense,
        balance: 0,
      };
      if (editingItem) {
        await updateKhazinaItem(editingItem.id, itemData);
      } else {
        await createKhazinaItem(itemData);
      }

      // Add to server sync queue
      await serverSyncService.addPendingItem("khazina", itemData);

      resetForm();
      setIsModalVisible(false);
      await loadData();
    } catch (error) {
      Alert.alert("خطأ", "فشل في حفظ البيانات");
    }
  };

  const handleDeleteItem = (id: string) => {
    Alert.alert("تأكيد", "هل تريد حذف هذا السجل؟", [
      { text: "إلغاء", onPress: () => {} },
      {
        text: "حذف",
        onPress: async () => {
          try {
            await deleteKhazinaItem(id);
            await loadData();
          } catch (error) {
            Alert.alert("خطأ", "فشل في حذف السجل");
          }
        },
      },
    ]);
  };

  const handleEditItem = (item: KhazinaItem) => {
    setEditingItem(item);
    setFormDate(item.date);
    setFormRevenue(item.income.toString());
    setFormExpense(item.expense.toString());
    setFormNotes(item.notes);
    setIsModalVisible(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormDate("");
    setFormRevenue("");
    setFormExpense("");
    setFormNotes("");
  };

  const generatePDF = async () => {
    try {
      await generateKhazinaPDF(items, selectedYear);
      Alert.alert("نجح", "تم إنشاء ملف PDF بنجاح");
    } catch (error) {
      Alert.alert("خطأ", "فشل في إنشاء ملف PDF");
    }
  };

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.date.toLowerCase().includes(query) ||
      item.notes.toLowerCase().includes(query) ||
item.income.toString().includes(query) ||
            item.expense.toString().includes(query)
    );
  });

  const totalRevenue = filteredItems.reduce((sum, item) => sum + item.income, 0);
  const totalExpense = filteredItems.reduce((sum, item) => sum + item.expense, 0);
  const totalBalance = totalRevenue - totalExpense;

  const years = [2026, 2025, 2024].reverse();

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1" />
            <View className="items-center flex-1 gap-2">
              <Text className="text-3xl font-bold text-foreground">الخزينة</Text>
              <Text className="text-sm text-muted">إدارة الخزينة والمعاملات</Text>
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

          {/* Year Selector */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">اختر السنة:</Text>
            <View className="flex-row gap-2 justify-between flex-row-reverse">
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  onPress={() => setSelectedYear(year)}
                  className={`flex-1 py-4 rounded-lg items-center justify-center ${
                    selectedYear === year ? "bg-primary" : "bg-surface border border-border"
                  }`}
                >
                  <Text
                    className={`text-2xl font-bold ${
                      selectedYear === year ? "text-background" : "text-foreground"
                    }`}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Search Bar */}
          <TextInput
            placeholder="🔍 بحث (التاريخ، المبلغ، ملاحظات...)"
            placeholderTextColor="#9BA1A6"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="bg-surface border border-border rounded-lg p-3 text-foreground"
          />

          {/* Summary Cards */}
          <View className="flex-row gap-2">
            <View className="flex-1 bg-surface p-3 rounded-lg border-l-4 border-warning">
              <Text className="text-xs text-muted mb-1">الإيرادات</Text>
              <Text className="text-lg font-bold text-warning">
                {totalRevenue.toLocaleString()}
              </Text>
            </View>
            <View className="flex-1 bg-surface p-3 rounded-lg border-l-4 border-error">
              <Text className="text-xs text-muted mb-1">المصروفات</Text>
              <Text className="text-lg font-bold text-error">
                {totalExpense.toLocaleString()}
              </Text>
            </View>
            <View className="flex-1 bg-surface p-3 rounded-lg border-l-4 border-success">
              <Text className="text-xs text-muted mb-1">الرصيد</Text>
              <Text className="text-lg font-bold text-success">
                {totalBalance.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => {
                resetForm();
                setIsModalVisible(true);
              }}
              className="flex-1 bg-primary rounded-lg p-3"
            >
              <Text className="text-center text-background font-semibold">+ إضافة معاملة</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={generatePDF} className="flex-1 bg-success rounded-lg p-3">
              <Text className="text-center text-background font-semibold">PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={selectSyncFile} className="flex-1 bg-warning rounded-lg p-3">
              <Text className="text-center text-background font-semibold">ملف</Text>
            </TouchableOpacity>
          </View>

          {/* Sync File Status */}
          {syncFilePath && (
            <View className="bg-surface border border-border rounded-lg p-3">
              <Text className="text-xs text-muted mb-2">ملف المزامنة المحفوظ</Text>
              <TouchableOpacity onPress={importFromFile} disabled={isImporting}>
                <Text className="text-primary font-semibold">
                  {isImporting ? "جاري الاستيراد..." : "استيراد من الملف"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Items Count */}
          <Text className="text-center text-sm text-muted">
            عدد المعاملات: {filteredItems.length}
            {searchQuery && ` (من أصل ${items.length})`}
          </Text>

          {/* Items List */}
          {isLoading ? (
            <Text className="text-center text-muted">جاري التحميل...</Text>
          ) : filteredItems.length === 0 ? (
            <Text className="text-center text-muted">
              {searchQuery ? "لا توجد نتائج للبحث" : "لا توجد معاملات"}
            </Text>
          ) : (
            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View className="bg-surface border border-border rounded-lg p-4 mb-2">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-sm text-muted">{item.date}</Text>
                      {item.notes && <Text className="text-xs text-muted mt-1">{item.notes}</Text>}
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity onPress={() => handleEditItem(item)}>
                        <Text className="text-primary font-semibold">تعديل</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
                        <Text className="text-error font-semibold">حذف</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-success font-semibold">إيراد: {item.income.toLocaleString()}</Text>
                    <Text className="text-error font-semibold">مصروف: {item.expense.toLocaleString()}</Text>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-2xl p-4 gap-4">
            <Text className="text-xl font-bold text-foreground">
              {editingItem ? "تعديل المعاملة" : "إضافة معاملة جديدة"}
            </Text>

            <TextInput
              placeholder="التاريخ (DD-MM-YYYY)"
              placeholderTextColor="#999"
              value={formDate}
              onChangeText={setFormDate}
              className="bg-surface border border-border rounded-lg p-3 text-foreground"
            />

            <TextInput
              placeholder="الإيراد"
              placeholderTextColor="#999"
              value={formRevenue}
              onChangeText={setFormRevenue}
              keyboardType="decimal-pad"
              className="bg-surface border border-border rounded-lg p-3 text-foreground"
            />

            <TextInput
              placeholder="المصروف"
              placeholderTextColor="#999"
              value={formExpense}
              onChangeText={setFormExpense}
              keyboardType="decimal-pad"
              className="bg-surface border border-border rounded-lg p-3 text-foreground"
            />

            <TextInput
              placeholder="ملاحظات"
              placeholderTextColor="#999"
              value={formNotes}
              onChangeText={setFormNotes}
              multiline
              className="bg-surface border border-border rounded-lg p-3 text-foreground"
            />

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  setIsModalVisible(false);
                }}
                className="flex-1 bg-surface border border-border rounded-lg p-3"
              >
                <Text className="text-center text-foreground font-semibold">إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddItem} className="flex-1 bg-primary rounded-lg p-3">
                <Text className="text-center text-background font-semibold">حفظ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
