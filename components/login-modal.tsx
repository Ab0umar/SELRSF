import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { login } from '@/lib/api-client';

interface LoginModalProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export function LoginModal({ visible, onSuccess, onCancel }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('خطأ', 'الرجاء إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      Alert.alert('نجح', 'تم تسجيل الدخول بنجاح');
      setUsername('');
      setPassword('');
      onSuccess();
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-surface rounded-2xl p-6 w-full max-w-sm">
          <Text className="text-2xl font-bold text-foreground mb-6 text-center">
            تسجيل الدخول
          </Text>

          <View className="mb-4">
            <Text className="text-sm text-muted mb-2">اسم المستخدم</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
              value={username}
              onChangeText={setUsername}
              placeholder="admin"
              placeholderTextColor="#9BA1A6"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm text-muted mb-2">كلمة المرور</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#9BA1A6"
              secureTextEntry
              editable={!loading}
            />
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-primary rounded-lg py-3 items-center"
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold">دخول</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-surface border border-border rounded-lg py-3 items-center"
              onPress={onCancel}
              disabled={loading}
            >
              <Text className="text-foreground font-semibold">إلغاء</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-muted text-center mt-4">
            الاتصال بالسيرفر: 41.199.252.107
          </Text>
        </View>
      </View>
    </Modal>
  );
}
