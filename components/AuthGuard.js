import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter, usePathname } from 'expo-router';

export default function AuthGuard({ children, requireAuth = true }) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const hasRedirected = useRef(false);
  const redirectTimeout = useRef(null);

  useEffect(() => {
    // Limpiar timeout anterior si existe
    if (redirectTimeout.current) {
      clearTimeout(redirectTimeout.current);
    }

    const checkAuth = async () => {
      if (!isLoaded) {
        return; // Wait for Clerk to load
      }

      // Prevent multiple redirects
      if (hasRedirected.current) {
        setIsChecking(false);
        return;
      }

      // Usar timeout para evitar redirecciones inmediatas
      redirectTimeout.current = setTimeout(() => {
        if (requireAuth && !isSignedIn) {
          hasRedirected.current = true;
          // Solo redirigir si no estamos ya en una página de auth
          if (!pathname.includes('/(auth)')) {
            console.log('AuthGuard: Redirecting to sign-in');
            router.replace('/(auth)/sign-in');
          }
          return;
        }

        if (!requireAuth && isSignedIn) {
          hasRedirected.current = true;
          // Solo redirigir si no estamos ya en una página de tabs
          if (!pathname.includes('/(tabs)')) {
            console.log('AuthGuard: Redirecting to home');
            router.replace('/(tabs)/home');
          }
          return;
        }

        setIsChecking(false);
      }, 100); // Pequeño delay para evitar redirecciones inmediatas
    };

    checkAuth();

    return () => {
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
      }
    };
  }, [isLoaded, isSignedIn, requireAuth, pathname]);

  // Show loading while checking authentication
  if (!isLoaded || isChecking) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#f97316' 
      }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 10, fontSize: 16 }}>
          Verificando autenticación...
        </Text>
      </View>
    );
  }

  return children;
} 