import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function AdminIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(admin)/(tabs)/notifications');
  }, [router]);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#f97316" />
    </View>
  );
} 