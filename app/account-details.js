import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { API_CONFIG, buildApiUrl } from '../config/api';

const API_URL = API_CONFIG.BASE_URL; // Ya incluye /api/v1

export default function AccountDetailsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('********');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (user) {
      setEmail(user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || '');
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const res = await fetch(`${API_URL}/users/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setUserData(data);
      }
    } catch (e) {
      console.log('Error fetching user data:', e);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#E2773C" />
      </TouchableOpacity>

      <Text style={styles.header}>Account Details</Text>

      <Image 
        source={userData?.profileImage ? { uri: userData.profileImage } : require('../assets/user.jpeg')} 
        style={styles.avatar} 
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="#fff"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        secureTextEntry
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#fff"
      />

      <TouchableOpacity
        style={styles.saveButton}
        onPress={() => router.push('/(tabs)/profile')}
      >
        <Text style={styles.saveText}>Back to Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFBF6', 
    alignItems: 'center', 
    paddingTop: 60 
  },
  backButton: { 
    position: 'absolute', 
    top: 60, 
    left: 20 
  },
  header: {
    fontSize: 24,
    fontFamily: 'DynaPuff',
    fontWeight: 'bold',
    color: '#E2773C',
    marginBottom: 20,
    textAlign: 'center',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 6,
  },
  label: {
    alignSelf: 'flex-start',
    marginLeft: 40,
    marginBottom: 4,
    fontSize: 15,
    fontFamily: 'Inter',
    fontWeight: 'bold',
    color: '#222',
  },
  input: {
    width: '80%',
    backgroundColor: '#E2773C',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
    color: '#444',
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: '#142E8B',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginTop: 20,
  },
  saveText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Inter',
    textTransform: 'none',
    letterSpacing: 0,
  },
}); 