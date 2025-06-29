import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function MenuModal({ visible, onClose }) {
  const router = useRouter();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.overlay} onPress={onClose}>
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
            onPress={() => {
              onClose();
              // Lógica de logout si querés
            }}
          >
            <Text style={styles.logout}>Log out</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 70,
    paddingRight: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalContainer: {
    backgroundColor: '#FDFBF7',
    width: 230,
    borderRadius: 30,
    paddingVertical: 24,
    alignItems: 'center',
  },
  option: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  logout: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: 'bold',
    color: 'red',
  },
  separator: {
    width: '80%',
    height: 1,
    backgroundColor: '#E2773C',
    marginVertical: 10,
  },
});
