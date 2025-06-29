import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';

export default function SignOutButton() {
  const { signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
  };

  return (
    <TouchableOpacity onPress={handleSignOut} style={styles.button}>
      <Text style={styles.buttonText}>Sign Out</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
