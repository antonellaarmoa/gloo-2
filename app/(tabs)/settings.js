import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  SafeAreaView,
  Alert,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const { isSignedIn, signOut } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    autoSave: true,
    dataSync: true,
    soundEffects: true,
    hapticFeedback: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  // Cargar configuración
  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('@gloo:appSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  // Guardar configuración
  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('@gloo:appSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.log('Error saving settings:', error);
    }
  };

  // Cambiar configuración
  const toggleSetting = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  // Limpiar datos locales
  const clearLocalData = () => {
    Alert.alert(
      'Limpiar Datos',
      '¿Estás seguro de que quieres eliminar todos los datos locales? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const glooKeys = keys.filter(key => key.startsWith('@gloo:'));
              await AsyncStorage.multiRemove(glooKeys);
              Alert.alert('Éxito', 'Datos locales eliminados');
            } catch (error) {
              Alert.alert('Error', 'No se pudieron eliminar los datos');
            }
          }
        }
      ]
    );
  };

  // Cerrar sesión
  const handleSignOut = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: () => {
            signOut();
            router.replace('/(auth)/sign-in');
          }
        }
      ]
    );
  };

  // Renderizar opción de configuración
  const renderSettingItem = (icon, title, subtitle, type = 'switch', value = null, onPress = null) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={20} color="#666" />
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {type === 'switch' ? (
          <Switch
            value={settings[value]}
            onValueChange={() => toggleSetting(value)}
            trackColor={{ false: '#e0e0e0', true: '#F9690E' }}
            thumbColor={settings[value] ? '#fff' : '#f4f3f4'}
          />
        ) : (
          <TouchableOpacity onPress={onPress}>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Notificaciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificaciones</Text>
          {renderSettingItem(
            'notifications-outline',
            'Notificaciones Push',
            'Recibe notificaciones de nuevas recetas y likes',
            'switch',
            'notifications'
          )}
          {renderSettingItem(
            'volume-high-outline',
            'Efectos de Sonido',
            'Reproducir sonidos al interactuar',
            'switch',
            'soundEffects'
          )}
        </View>

        {/* Apariencia */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apariencia</Text>
          {renderSettingItem(
            'moon-outline',
            'Modo Oscuro',
            'Cambiar a tema oscuro',
            'switch',
            'darkMode'
          )}
        </View>

        {/* Datos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos</Text>
          {renderSettingItem(
            'cloud-upload-outline',
            'Sincronización Automática',
            'Sincronizar datos con el servidor',
            'switch',
            'dataSync'
          )}
          {renderSettingItem(
            'save-outline',
            'Guardado Automático',
            'Guardar cambios automáticamente',
            'switch',
            'autoSave'
          )}
          {renderSettingItem(
            'trash-outline',
            'Limpiar Datos Locales',
            'Eliminar todos los datos guardados',
            'button',
            null,
            clearLocalData
          )}
        </View>

        {/* Accesibilidad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accesibilidad</Text>
          {renderSettingItem(
            'phone-portrait-outline',
            'Vibración',
            'Vibración al tocar botones',
            'switch',
            'hapticFeedback'
          )}
        </View>

        {/* Información */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          {renderSettingItem(
            'information-circle-outline',
            'Acerca de Gloo',
            'Versión 1.0.0',
            'button',
            null,
            () => Alert.alert('Gloo', 'Versión 1.0.0\n\nUna app para compartir y descubrir recetas deliciosas.')
          )}
          {renderSettingItem(
            'document-text-outline',
            'Términos y Condiciones',
            'Leer términos de uso',
            'button',
            null,
            () => Linking.openURL('https://gloo-app.com/terms')
          )}
          {renderSettingItem(
            'shield-checkmark-outline',
            'Política de Privacidad',
            'Leer política de privacidad',
            'button',
            null,
            () => Linking.openURL('https://gloo-app.com/privacy')
          )}
        </View>

        {/* Cuenta */}
        {isSignedIn && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cuenta</Text>
            {renderSettingItem(
              'log-out-outline',
              'Cerrar Sesión',
              'Salir de tu cuenta',
              'button',
              null,
              handleSignOut
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  settingRight: {
    marginLeft: 16,
  },
}); 