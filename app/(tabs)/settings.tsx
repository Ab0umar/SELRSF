import {
  Text,
  View,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { LoginModal } from "@/components/login-modal";
import { useColors } from "@/hooks/use-colors";
import { 
  getStorageMode, 
  setStorageMode, 
  getApiUrl, 
  setApiUrl,
  getLastSync,
  isApiAvailable 
} from "@/lib/hybrid-storage";
import { getToken, clearToken, setApiBaseUrl, initializeApiUrl } from "@/lib/api-client";
import { useServerSync } from "@/hooks/use-server-sync";

const AUTO_SYNC_KEY = "auto_sync_enabled";

export default function SettingsScreen() {
  const colors = useColors();
  const serverSync = useServerSync();
  const [isApiMode, setIsApiMode] = useState(false);
  const [serverUrl, setServerUrl] = useState("http://192.168.1.100:3000");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
    initializeApiUrl().catch(console.error);
  }, []);

  const loadSettings = async () => {
    try {
      const mode = await getStorageMode();
      const url = await getApiUrl();
      const token = await getToken();
      const sync = await getLastSync();
      const autoSync = await AsyncStorage.getItem(AUTO_SYNC_KEY);
      
      setIsApiMode(mode === 'api');
      setServerUrl(url);
      setIsLoggedIn(!!token);
      if (sync) {
        setLastSync(typeof sync === 'string' ? sync : sync.toISOString());
      }
      setAutoSyncEnabled(autoSync !== "false");
      
      // Check connection
      if (mode === 'api' && token) {
        const connected = await isApiAvailable();
        setIsConnected(connected);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleToggleApiMode = async (value: boolean) => {
    if (value && !isLoggedIn) {
      Alert.alert(
        "تسجيل الدخول مطلوب",
        "يجب تسجيل الدخول أولاً لتفعيل وضع API",
        [{ text: "حسناً" }]
      );
      return;
    }
    
    setIsApiMode(value);
    await setStorageMode(value ? 'api' : 'offline');
    
    if (value) {
      const connected = await isApiAvailable();
      setIsConnected(connected);
      if (!connected) {
        Alert.alert(
          "تحذير",
          "لا يمكن الاتصال بالسيرفر. تأكد من أن السيرفر يعمل والـ URL صحيح."
        );
      }
    }
  };

  const handleSaveUrl = async () => {
    if (!serverUrl.trim()) {
      Alert.alert("خطأ", "يرجى إدخال عنوان السيرفر");
      return;
    }
    
    try {
      await setApiUrl(serverUrl);
      setApiBaseUrl(serverUrl);
      Alert.alert("تم", "تم حفظ عنوان السيرفر بنجاح");
      
      // Check connection with new URL
      if (isApiMode && isLoggedIn) {
        const connected = await isApiAvailable();
        setIsConnected(connected);
      }
    } catch (error) {
      Alert.alert("خطأ", "فشل في حفظ عنوان السيرفر");
    }
  };

  const handleLogin = () => {
    setIsLoginModalVisible(true);
  };

  const handleLoginSuccess = async () => {
    setIsLoginModalVisible(false);
    setIsLoggedIn(true);
    
    // Enable API mode after successful login
    setIsApiMode(true);
    await setStorageMode('api');
    
    const connected = await isApiAvailable();
    setIsConnected(connected);
    
    Alert.alert("نجح", "تم تسجيل الدخول بنجاح");
  };

  const handleLogout = async () => {
    Alert.alert(
      "تأكيد تسجيل الخروج",
      "هل تريد تسجيل الخروج؟ سيتم التبديل إلى الوضع المحلي.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "تسجيل الخروج",
          style: "destructive",
          onPress: async () => {
            await clearToken();
            setIsLoggedIn(false);
            setIsApiMode(false);
            setIsConnected(false);
            await setStorageMode('offline');
            Alert.alert("تم", "تم تسجيل الخروج بنجاح");
          },
        },
      ]
    );
  };

  const handleTestConnection = async () => {
    try {
      const connected = await isApiAvailable();
      setIsConnected(connected);
      
      if (connected) {
        Alert.alert("نجح", "الاتصال بالسيرفر ناجح ✅");
      } else {
        Alert.alert(
          "فشل",
          "لا يمكن الاتصال بالسيرفر. تأكد من:\n• السيرفر يعمل\n• الـ URL صحيح\n• الشبكة متصلة"
        );
      }
    } catch (error) {
      Alert.alert("خطأ", "فشل في اختبار الاتصال");
    }
  };

  const toggleAutoSync = async (value: boolean) => {
    try {
      await AsyncStorage.setItem(AUTO_SYNC_KEY, value.toString());
      setAutoSyncEnabled(value);
    } catch (error) {
      Alert.alert("خطأ", "فشل في حفظ الإعداد");
    }
  };

  const clearAllSyncFiles = () => {
    Alert.alert(
      "تأكيد",
      "هل تريد مسح جميع ملفات المزامنة المحفوظة؟",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "مسح",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                "khazina_sync_file",
                "sulf_sync_file",
                "qard_sync_file",
              ]);
              Alert.alert("تم", "تم مسح جميع ملفات المزامنة");
            } catch (error) {
              Alert.alert("خطأ", "فشل في مسح الملفات");
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="items-center mb-6">
          <Text className="text-3xl font-bold text-foreground">SELRS</Text>
          <Text className="text-muted">الإعدادات</Text>
        </View>

        {/* API Configuration Section */}
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <Text className="text-lg font-bold text-foreground mb-4">إعدادات الاتصال</Text>
          
          {/* API Mode Toggle */}
          <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-border">
            <View className="flex-1">
              <Text className="text-foreground font-semibold">وضع API</Text>
              <Text className="text-muted text-sm">
                {isApiMode ? "متصل بقاعدة البيانات" : "وضع محلي (offline)"}
              </Text>
            </View>
            <Switch
              value={isApiMode}
              onValueChange={handleToggleApiMode}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isApiMode ? colors.background : colors.muted}
            />
          </View>

          {/* Connection Status */}
          {isApiMode && (
            <View className="flex-row items-center mb-4 pb-4 border-b border-border">
              <View
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: isConnected ? '#22C55E' : '#EF4444' }}
              />
              <Text className="text-foreground">
                {isConnected ? "متصل ✅" : "غير متصل ❌"}
              </Text>
            </View>
          )}

          {/* Server URL */}
          <View className="mb-4">
            <Text className="text-foreground font-semibold mb-2">عنوان السيرفر</Text>
            <TextInput
              placeholder="http://192.168.1.100:3000"
              value={serverUrl}
              onChangeText={setServerUrl}
              className="bg-background p-3 rounded-lg text-foreground border border-border mb-2"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={handleSaveUrl}
                className="flex-1 bg-primary p-3 rounded-lg"
              >
                <Text className="text-center text-white font-bold">حفظ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleTestConnection}
                className="flex-1 bg-success p-3 rounded-lg"
              >
                <Text className="text-center text-white font-bold">اختبار الاتصال</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login/Logout */}
          <View>
            {isLoggedIn ? (
              <View>
                <View className="flex-row items-center mb-3">
                  <Text className="text-success font-semibold">✓ مسجل الدخول</Text>
                </View>
                <TouchableOpacity
                  onPress={handleLogout}
                  className="bg-error p-3 rounded-lg"
                >
                  <Text className="text-center text-white font-bold">تسجيل الخروج</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleLogin}
                className="bg-primary p-3 rounded-lg"
              >
                <Text className="text-center text-white font-bold">تسجيل الدخول</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Auto-Sync Toggle */}
        <View className="bg-surface p-4 rounded-lg mb-4 border border-border">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-1">
              <Text className="text-foreground font-bold text-lg">المزامنة التلقائية</Text>
              <Text className="text-muted text-sm mt-1">
                استيراد البيانات تلقائياً عند فتح التطبيق (للوضع المحلي)
              </Text>
            </View>
            <Switch
              value={autoSyncEnabled}
              onValueChange={toggleAutoSync}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={autoSyncEnabled ? "#ffffff" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Server Sync Status */}
        <View className="bg-surface p-4 rounded-lg mb-4 border border-border">
          <Text className="text-lg font-bold text-foreground mb-3">حالة المزامنة مع السيرفر</Text>
          
          {/* Sync Status */}
          <View className="flex-row items-center mb-3">
            <View
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: serverSync.isSyncing ? '#F59E0B' : '#22C55E' }}
            />
            <Text className="text-foreground">
              {serverSync.isSyncing ? "جاري المزامنة..." : "المزامنة تعمل ✅"}
            </Text>
          </View>

          {/* Last Sync Time */}
          {serverSync.lastSyncTime > 0 && (
            <Text className="text-muted text-sm mb-3">
              آخر مزامنة: {new Date(serverSync.lastSyncTime).toLocaleString('ar-EG')}
            </Text>
          )}

          {/* Sync Buttons */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => serverSync.toggleSync(!serverSync.enabled)}
              className={`flex-1 p-3 rounded-lg ${serverSync.enabled ? 'bg-error' : 'bg-success'}`}
            >
              <Text className="text-center text-white font-bold">
                {serverSync.enabled ? "إيقاف" : "تشغيل"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => serverSync.syncNow()}
              className="flex-1 bg-primary p-3 rounded-lg"
              disabled={serverSync.isSyncing}
            >
              <Text className="text-center text-white font-bold">
                {serverSync.isSyncing ? "جاري..." : "مزامنة الآن"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Clear Sync Files */}
        <TouchableOpacity
          onPress={clearAllSyncFiles}
          className="bg-error p-4 rounded-lg mb-4"
        >
          <Text className="text-white text-center font-bold">
            مسح ملفات المزامنة المحفوظة
          </Text>
        </TouchableOpacity>

        {/* App Info */}
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <Text className="text-lg font-bold text-foreground mb-2">معلومات التطبيق</Text>
          <Text className="text-muted text-sm mb-1">الإصدار: 1.0.0</Text>
          <Text className="text-muted text-sm mb-1">التطبيق: SELRS</Text>
          <Text className="text-muted text-sm">نظام محاسبة الخزينة والسلف والقروض</Text>
        </View>

        {/* Help Text */}
        <View className="p-4 bg-warning/10 rounded-lg border border-warning">
          <Text className="text-warning font-semibold mb-2">💡 ملاحظة</Text>
          <Text className="text-foreground text-sm">
            • الوضع المحلي: البيانات تُحفظ على الجهاز فقط{'\n'}
            • وضع API: البيانات تُحفظ في قاعدة البيانات المركزية{'\n'}
            • يجب تسجيل الدخول لاستخدام وضع API{'\n'}
            • تأكد من تشغيل السيرفر على الكمبيوتر
          </Text>
        </View>
      </ScrollView>

      {/* Login Modal */}
      <LoginModal
        visible={isLoginModalVisible}
        onCancel={() => setIsLoginModalVisible(false)}
        onSuccess={handleLoginSuccess}
      />
    </ScreenContainer>
  );
}
