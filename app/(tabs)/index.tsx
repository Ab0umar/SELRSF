import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { getKhazinaItems } from "@/lib/hybrid-storage";

export default function QuickAccessScreen() {
  const router = useRouter();
  const [totals, setTotals] = useState({
    monthlyIncome: 0,
    monthlyExpense: 0,
    monthlyBalance: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const items = await getKhazinaItems();
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Filter items for current month
      const monthlyItems = items.filter((item) => {
        // Convert DD-MM-YYYY to YYYY-MM-DD for parsing
        const [day, month, year] = item.date.split('-').map(Number);
        const itemDate = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
      });

      const monthlyIncome = monthlyItems.reduce((sum, item) => sum + item.income, 0);
      const monthlyExpense = monthlyItems.reduce((sum, item) => sum + item.expense, 0);
      const monthlyBalance = monthlyIncome - monthlyExpense;

      setTotals({
        monthlyIncome,
        monthlyExpense,
        monthlyBalance,
      });
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateTo = (tab: string) => {
    router.push(`/(tabs)/${tab}` as any);
  };

  const MenuCard = ({ title, description, icon, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      className="bg-surface border border-border rounded-lg p-4 mb-3 flex-row justify-between items-center active:opacity-70"
    >
      <View className="flex-1">
        <View className="flex-row items-center gap-2 mb-1">
          <Text className="text-xl">{icon}</Text>
          <Text className="text-lg font-bold text-foreground">{title}</Text>
        </View>
        <Text className="text-sm text-muted">{description}</Text>
      </View>
      <Text className="text-2xl text-muted">→</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="items-center mb-6">
          <Text className="text-3xl font-bold text-foreground">SELRS</Text>
          <Text className="text-sm text-muted mt-1">عيون الشروق للخدمات الطبيه</Text>
        </View>

        {/* Quick Access Title */}
        <Text className="text-2xl font-bold text-foreground mb-4">الرئيسيه</Text>

        {/* Menu Cards */}
        <MenuCard
          title="الخزينة"
          description="إدارة الخزينة والمعاملات"
          icon="💰"
          onPress={() => navigateTo("khazina")}
        />

        <MenuCard
          title="السلف"
          description="سلف الموظفين"
          icon="📋"
          onPress={() => navigateTo("sulf")}
        />

        <MenuCard
          title="القروض"
          description="صندوق القرض"
          icon="📊"
          onPress={() => navigateTo("qard")}
        />

        <MenuCard
          title="انستا"
          description="دفع اون لاين"
          icon="💳"
          onPress={() => navigateTo("instapay")}
        />

        <MenuCard
          title="البيت"
          description="خزينة البيت"
          icon="🏠"
          onPress={() => navigateTo("bait")}
        />

        <MenuCard
          title="الإعدادات"
          description="تخصيص التطبيق"
          icon="⚙️"
          onPress={() => navigateTo("settings")}
        />

        {/* Monthly Summary - Khazina Only */}
        <Text className="text-xl font-bold text-foreground mt-8 mb-4">ملخص الشهر الحالي - الخزينة</Text>

        <View className="bg-surface border border-border rounded-lg p-4">
          <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-border">
            <Text className="text-muted">الإيرادات</Text>
            <Text className="text-lg font-bold text-success">
              {totals.monthlyIncome.toLocaleString()}
            </Text>
          </View>

          <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-border">
            <Text className="text-muted">المصروفات</Text>
            <Text className="text-lg font-bold text-error">
              {totals.monthlyExpense.toLocaleString()}
            </Text>
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-muted">الرصيد</Text>
            <Text className="text-lg font-bold text-warning">
              {totals.monthlyBalance.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Refresh Button */}
        <TouchableOpacity
          onPress={loadData}
          className="bg-primary p-3 rounded-lg mt-6 active:opacity-80"
        >
          <Text className="text-center text-white font-bold">🔄 تحديث البيانات</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
