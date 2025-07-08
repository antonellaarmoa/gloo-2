import { Slot, usePathname, useRouter } from 'expo-router';
import * as Font from 'expo-font';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotificationProvider } from '../context/NotificationContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, useUser, useAuth } from '@clerk/clerk-expo';

const queryClient = new QueryClient();

function RootLayoutWithRedirect() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontError, setFontError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    Font.loadAsync({
      'DynaPuff': require('../assets/fonts/DynaPuff.ttf'),
      'Inter': require('../assets/fonts/Inter.ttf'),
    })
      .then(() => {
        if (isMounted) setFontsLoaded(true);
      })
      .catch((err) => {
        console.error('Error loading fonts:', err);
        if (isMounted) setFontError(err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded && userLoaded) {
      setIsReady(true);
    }
  }, [fontsLoaded, userLoaded]);

  useEffect(() => {
    if (!isReady || !fontsLoaded || !userLoaded) return;
    
    // Agregar un pequeño delay para asegurar que todo esté listo
    const timer = setTimeout(() => {
      if (pathname === '/' && isSignedIn) {
        if (user && user.publicMetadata?.role === 'admin') {
          router.replace('/(admin)/(tabs)/notifications');
        } else {
          router.replace('/(tabs)/home');
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isReady, fontsLoaded, userLoaded, user, pathname, router, isSignedIn]);

  if (fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ color: 'red', fontSize: 16, marginBottom: 8 }}>Error cargando fuentes</Text>
        <Text>{fontError.message || String(fontError)}</Text>
      </View>
    );
  }

  if (!fontsLoaded || !userLoaded || !isReady || (pathname === '/' && isSignedIn)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={{ marginTop: 16 }}>Cargando...</Text>
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey="pk_test_Y29taWMtbGVtbWluZy0xMi5jbGVyay5hY2NvdW50cy5kZXYk">
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <NotificationProvider>
              <RootLayoutWithRedirect />
            </NotificationProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
