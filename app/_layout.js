import { Slot } from 'expo-router';
import * as Font from 'expo-font';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotificationProvider } from '../context/NotificationContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProvider } from '@clerk/clerk-expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const CLERK_PUBLISHABLE_KEY = 'pk_test_Y29taWMtbGVtbWluZy0xMi5jbGVyay5hY2NvdW50cy5kZXYk';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      'DynaPuff': require('../assets/fonts/DynaPuff.ttf'),
      'Inter': require('../assets/fonts/Inter.ttf'),
    }).then(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Cargando fuentes...</Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <NotificationProvider>
              <Slot />
            </NotificationProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </ClerkProvider>
    </QueryClientProvider>
  );
}
