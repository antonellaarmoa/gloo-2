import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        // For testing: always show onboarding
        // Comment out the next line to enable normal flow
        await AsyncStorage.removeItem('hasSeenOnboarding');
        
        const seen = await AsyncStorage.getItem('hasSeenOnboarding');
        if (seen === 'true') {
          router.replace('/(auth)/sign-in');
        } else {
          router.replace('/onboarding');
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
        router.replace('/onboarding'); // fallback
      } finally {
        setLoading(false);
      }
    };

    checkOnboarding();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f97316' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 10, fontSize: 16 }}>Loading Gloo...</Text>
      </View>
    );
  }

  return null;
}
