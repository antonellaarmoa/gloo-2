import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { TouchableOpacity, Modal, View, Text, StyleSheet, Alert } from 'react-native';
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
      style={{ marginRight: 18 }}
    >
      <Ionicons name="log-out-outline" size={26} color="#f97316" />
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
            <Text style={styles.modalTitle}>¿Cerrar sesión?</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de que quieres cerrar sesión? Tendrás que volver a iniciar sesión para acceder al panel de administración.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.logoutButton]}
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
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
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
    borderRadius: 12,
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
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
}); 