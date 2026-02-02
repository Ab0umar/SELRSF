import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect } from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { getKhazinaItems, getBaitItems, getInstapayItems, getSulfItems, getQardItems } from "@/lib/hybrid-storage";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  // Auto-sync data every 5 minutes
  useEffect(() => {
    const syncData = async () => {
      try {
        await Promise.all([
          getKhazinaItems(),
          getSulfItems(),
          getQardItems(),
          getBaitItems(),
          getInstapayItems(),
        ]);
      } catch (error) {
        console.error('Auto-sync error:', error);
      }
    };

    // Sync immediately on app load
    syncData();

    // Then sync every 5 minutes
    const interval = setInterval(syncData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    > 
      <Tabs.Screen
        name="index"
        options={{
          title: "الرئيسية",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="arrow.down" color={color} />,
        }}
      />
      <Tabs.Screen
        name="khazina"
        options={{
          title: "الخزينة",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="wallet.pass.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="sulf"
        options={{
          title: "السلف",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="hand.raised.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="qard"
        options={{
          title: "القرض",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="banknote.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="instapay"
        options={{
          title: "انستا",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="creditcard" color={color} />,
        }}
      />
      <Tabs.Screen
        name="bait"
        options={{
          title: "البيت",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="building.2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "الإعدادات",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
        }}
      />
       
    </Tabs>
  );
}
