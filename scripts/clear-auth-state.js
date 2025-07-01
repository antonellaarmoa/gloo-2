import AsyncStorage from '@react-native-async-storage/async-storage';

// Script para limpiar el estado de autenticación y resolver conflictos de sesión
export const clearAuthState = async () => {
  try {
    console.log('🧹 Limpiando estado de autenticación...');
    
    // Limpiar datos de Clerk (si existen)
    const clerkKeys = [
      '__clerk_client_jwt',
      '__clerk_session',
      '__clerk_user',
      '__clerk_organization',
      '__clerk_organization_membership',
    ];
    
    for (const key of clerkKeys) {
      try {
        await AsyncStorage.removeItem(key);
        console.log(`✅ Removido: ${key}`);
      } catch (error) {
        console.log(`⚠️ No se pudo remover ${key}:`, error.message);
      }
    }
    
    // Limpiar datos de la app relacionados con autenticación
    const appKeys = [
      'hasSeenOnboarding',
      '@gloo:userSession',
      '@gloo:authState',
    ];
    
    for (const key of appKeys) {
      try {
        await AsyncStorage.removeItem(key);
        console.log(`✅ Removido: ${key}`);
      } catch (error) {
        console.log(`⚠️ No se pudo remover ${key}:`, error.message);
      }
    }
    
    console.log('✅ Estado de autenticación limpiado exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error limpiando estado de autenticación:', error);
    return false;
  }
};

// Función para verificar el estado de autenticación
export const checkAuthState = async () => {
  try {
    console.log('🔍 Verificando estado de autenticación...');
    
    const keys = await AsyncStorage.getAllKeys();
    const authKeys = keys.filter(key => 
      key.includes('clerk') || 
      key.includes('auth') || 
      key.includes('session') ||
      key.includes('user')
    );
    
    console.log('📋 Claves de autenticación encontradas:', authKeys);
    
    for (const key of authKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        console.log(`${key}:`, value ? '✅ Tiene valor' : '❌ Sin valor');
      } catch (error) {
        console.log(`${key}: ❌ Error leyendo`);
      }
    }
    
    return authKeys;
  } catch (error) {
    console.error('❌ Error verificando estado de autenticación:', error);
    return [];
  }
};

// Función para resetear completamente la app
export const resetApp = async () => {
  try {
    console.log('🔄 Reseteando aplicación completamente...');
    
    // Limpiar estado de autenticación
    await clearAuthState();
    
    // Limpiar todos los datos de la app
    const allKeys = await AsyncStorage.getAllKeys();
    const glooKeys = allKeys.filter(key => key.startsWith('@gloo:'));
    
    for (const key of glooKeys) {
      try {
        await AsyncStorage.removeItem(key);
        console.log(`✅ Removido: ${key}`);
      } catch (error) {
        console.log(`⚠️ No se pudo remover ${key}:`, error.message);
      }
    }
    
    console.log('✅ Aplicación reseteada exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error reseteando aplicación:', error);
    return false;
  }
}; 