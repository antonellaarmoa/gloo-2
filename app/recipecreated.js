// RecipeCreatedScreen.js

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useNotifications } from '../context/NotificationContext';

export default function RecipeCreatedScreen() {
  const router = useRouter();
  const { addNotification } = useNotifications();

  const handleDone = () => {
    addNotification({
      id: Date.now().toString(),
      title: 'Your recipe was approved!',
      message: 'Congratulations, your recipe is now visible to others.',
      timestamp: new Date().toISOString(),
    });
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <ConfettiCannon count={60} origin={{ x: 0, y: 0 }} explosionSpeed={400} fallSpeed={3000} fadeOut autoStart />
      <ConfettiCannon count={60} origin={{ x: 400, y: 0 }} explosionSpeed={400} fallSpeed={3000} fadeOut autoStart />

      <Text style={styles.title}>Create Recipe</Text>
      <View style={styles.confettiContainer}>
        <Image
          source={require('../assets/gloofeliz.png')}
          style={{ width: 260, height: 260, alignSelf: 'center', marginVertical: 24 }}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.successText}>Excellent!
        <Text style={styles.successSubText}> Your Recipe Has Been Created</Text>
      </Text>
      <Text style={styles.description}>Please wait while we check that everything is okay. We will notify you when there is any news.</Text>
      <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
        <Text style={styles.doneText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontFamily: 'DynaPuff',
    color: '#f97316',
    marginBottom: 10,
  },
  confettiContainer: {
    width: '100%',
    height: 200,
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  successText: {
    fontSize: 20,
    color: '#f97316',
    fontFamily: 'DynaPuff',
    textAlign: 'center',
  },
  successSubText: {
    color: '#f97316',
    fontFamily: 'DynaPuff',
  },
  description: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginVertical: 16,
  },
  doneBtn: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 20,
  },
  doneText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter',
  },
});