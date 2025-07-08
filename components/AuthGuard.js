import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter, usePathname } from 'expo-router';

export default function AuthGuard({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);

  // SIEMPRE declara los hooks antes de cualquier return condicional
  useEffect(() => {
    if (!isLoaded || !userLoaded) return; // Esperar a que todo esté cargado
    if (hasRedirected.current) return;

    const doRedirect = (to) => {
      hasRedirected.current = true;
      setTimeout(() => {
        router.replace(to);
      }, 50);
    };

    // Si es admin y está en tabs, redirigir inmediatamente
    if (isSignedIn && user?.publicMetadata?.role === 'admin' && pathname.startsWith('/(tabs)')) {
      doRedirect('/(admin)/notifications');
      return;
    }

    // Permitir acceso guest solo a /home
    if (!isSignedIn) {
      if (pathname.startsWith('/(tabs)') && !pathname.endsWith('/home')) {
        doRedirect('/(auth)/sign-in');
      }
      return;
    }

    if (user?.publicMetadata?.role === 'admin') {
      if (pathname === '/(admin)' || !pathname.startsWith('/(admin)')) {
        doRedirect('/(admin)/notifications');
      }
      return;
    }

    if (user?.publicMetadata?.role !== 'admin') {
      if (pathname.startsWith('/(admin)')) {
        doRedirect('/(tabs)/home');
      }
      return;
    }
  }, [isLoaded, userLoaded, isSignedIn, user, pathname, router]);

  // Si es admin y está en tabs, mostrar loader mientras redirige
  if (isSignedIn && user?.publicMetadata?.role === 'admin' && pathname.startsWith('/(tabs)')) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f97316' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 10, fontSize: 16 }}>
          Redirigiendo a admin...
        </Text>
      </View>
    );
  }

  if (!isLoaded || !userLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f97316' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 10, fontSize: 16 }}>
          Verificando autenticación...
        </Text>
      </View>
    );
  }

  return children;
} 