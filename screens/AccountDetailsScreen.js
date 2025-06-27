// screens/AccountDetailsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function AccountDetailsScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('anto.armoa@gmail.com');
  const [password, setPassword] = useState('********');

  return (
    <View style={styles.container}>
 
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="#E2773C" />
      </TouchableOpacity>

      <Text style={styles.header}>Account Details</Text>

      <Image
        source={require('../assets/user-ej.png')}
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
  onPress={() => navigation.navigate('Profile')}
>
  <Text style={styles.saveText}>Back to Profile</Text>
</TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF6', alignItems: 'center', paddingTop: 60 },
  backButton: { position: 'absolute', top: 60, left: 20 },
  header: {
    fontSize: 22,
    fontFamily: 'DynaPuff',
    color: '#E2773C',
    marginBottom: 20,
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
    fontSize: 13,
    fontFamily: 'Inter',
  },
  input: {
    width: '80%',
    backgroundColor: '#E2773C',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
    color: 'white',
    fontFamily: 'Inter',
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
    fontSize: 14,
    fontFamily: 'Inter',
  },
});
