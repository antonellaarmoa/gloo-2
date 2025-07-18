import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { TouchableOpacity, Modal, View, Text, StyleSheet, Alert, Image } from 'react-native';
import { useState } from 'react';

export default function AdminTabsLayout() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    setShowLogoutModal(false);
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'No se pudo cerrar sesión');
    }
  };

  const logoutButton = () => (
    <TouchableOpacity
      onPress={() => setShowLogoutModal(true)}
      style={{ marginRight: 18, flexDirection: 'row', alignItems: 'center' }}
    >
      <Ionicons name="log-out-outline" size={26} color="#f97316" />
      <Text style={{ color: '#f97316', fontWeight: '600', fontSize: 16, marginLeft: 6, fontFamily: 'Inter' }}>Cerrar sesión</Text>
    </TouchableOpacity>
  );

  return (
    <>
      <Tabs>
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Notificaciones',
            headerShown: true,
            headerRight: logoutButton,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="notifications-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="archive"
          options={{
            title: 'Historial',
            headerShown: true,
            headerRight: logoutButton,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="time-outline" size={24} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Modal de confirmación de logout */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="log-out-outline" size={48} color="#f97316" style={styles.modalIcon} />
            {/* Círculo de fondo para la imagen del personaje enojado */}
            <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: '#142E8B', alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
              <Image source={require('../../../assets/glooenojado.png')} style={{ width: 100, height: 100 }} />
            </View>
            <Text style={[styles.modalTitle, { fontSize: 24, marginBottom: 18, textAlign: 'center' }]}>¿Cerrar sesión?</Text>
            <Text style={[styles.modalMessage, { fontSize: 17, lineHeight: 25, marginBottom: 32, textAlign: 'center' }]}>¿Estás seguro de que quieres cerrar sesión? Tendrás que volver a iniciar sesión para acceder al panel de administración.</Text>
            <View style={[styles.modalButtons, { gap: 18, marginTop: 8 }]}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { minWidth: 120, paddingVertical: 16 }]}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.logoutButton, { minWidth: 140, paddingVertical: 16 }]}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutButtonText}>Sí, cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    maxWidth: 340,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 12,
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  modalMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontFamily: 'Inter',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  logoutButton: {
    backgroundColor: '#f97316',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
}); 