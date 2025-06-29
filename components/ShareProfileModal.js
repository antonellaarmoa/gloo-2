import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';

export default function ShareProfileModal({ visible, onClose, profileUrl }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(profileUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1200);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Share Profile</Text>
          <Text style={styles.link}>{profileUrl}</Text>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
            <Text style={styles.copyText}>{copied ? 'Copied!' : 'Copy Link'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30,30,30,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFFCF8',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    width: 320,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E2773C',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  link: {
    fontSize: 14,
    color: '#222',
    marginBottom: 18,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  copyButton: {
    backgroundColor: '#E2773C',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginBottom: 10,
  },
  copyText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Inter',
  },
  cancelButton: {
    backgroundColor: '#F6E6A8',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  cancelText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Inter',
  },
});