import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function LogoutModal({ visible, onCancel, onConfirm }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Log Out</Text>
          <Text style={styles.message}>Are you sure you want to end session?</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={onConfirm}>
              <Text style={styles.logoutText}>Yes, Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFFCF8',
    borderRadius: 36,
    padding: 32,
    alignItems: 'center',
    width: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontFamily: 'DynaPuff',
    fontWeight: 'bold',
    fontSize: 22,
    color: '#E2773C',
    marginBottom: 18,
    marginTop: 8,
  },
  message: {
    fontFamily: 'Inter',
    fontSize: 18,
    color: '#222',
    textAlign: 'center',
    marginBottom: 28,
    marginHorizontal: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: '#F6E3A9',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 28,
    marginRight: 8,
  },
  cancelText: {
    color: '#222',
    fontFamily: 'Inter',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#E2773C',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 28,
    marginLeft: 8,
  },
  logoutText: {
    color: '#fff',
    fontFamily: 'Inter',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 