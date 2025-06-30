import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import LogoutModal from './LogoutModal';

export default function MenuModal({ visible, onClose }) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = async () => {
    setShowLogout(false);
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  setTimeout(() => router.push('/account-details'), 200);
                }}
              >
                <Text style={styles.option}>Account Details</Text>
              </TouchableOpacity>

              <View style={styles.separator} />

              <TouchableOpacity
                onPress={() => {
                  onClose();
                  setTimeout(() => router.push('/faqc'), 200);
                }}
              >
                <Text style={styles.option}>FAQ Center</Text>
              </TouchableOpacity>

              <View style={styles.separator} />

              <TouchableOpacity
                onPress={() => setShowLogout(true)}
              >
                <Text style={[styles.option, { color: '#E2773C', fontWeight: 'bold' }]}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
          <LogoutModal
            visible={showLogout}
            onCancel={() => setShowLogout(false)}
            onConfirm={handleLogout}
          />
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  option: {
    fontSize: 16,
    color: '#222',
    fontFamily: 'Inter',
    marginVertical: 10,
  },
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: '#eee',
    marginVertical: 8,
  },
});
