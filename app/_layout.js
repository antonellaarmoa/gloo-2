import { Slot, usePathname, useRouter } from 'expo-router';
import * as Font from 'expo-font';
import React, { useEffect, useState } from 'react';
import * as Network from 'expo-network';
import { Modal, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotificationProvider } from '../context/NotificationContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, useUser, useAuth } from '@clerk/clerk-expo';
import { AdminHistoryProvider } from '../context/AdminHistoryContext';

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
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      const state = await Network.getNetworkStateAsync();
      setIsOffline(!state.isConnected || !state.isInternetReachable);
    };
    checkConnection();
    const interval = setInterval(checkConnection, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Modal de sin conexión */}
      <Modal visible={isOffline} transparent animationType="fade">
        <View style={styles.offlineOverlay}>
          <View style={styles.offlineModal}>
            <Text style={styles.offlineTitle}>Ups</Text>
            <Text style={styles.offlineText}>Parece que no tienes conexión a internet.</Text>
          </View>
        </View>
      </Modal>
      <ClerkProvider publishableKey="pk_test_Y29taWMtbGVtbWluZy0xMi5jbGVyay5hY2NvdW50cy5kZXYk">
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
              <NotificationProvider>
                <AdminHistoryProvider>
                  <RootLayoutWithRedirect />
                </AdminHistoryProvider>
              </NotificationProvider>
            </SafeAreaProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ClerkProvider>
    </>
  );
}

const styles = StyleSheet.create({
  offlineOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  offlineModal: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  offlineTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f97316',
    marginBottom: 10,
  },
  offlineText: {
    fontSize: 17,
    color: '#334155',
    textAlign: 'center',
  },
});
