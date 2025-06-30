import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Feather } from '@expo/vector-icons';
import { API_CONFIG, buildApiUrl } from '../config/api';

const API_URL = API_CONFIG.BASE_URL;

export default function EditProfile() {
  const router = useRouter();
  const { userId, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    description: '',
    email: '',
  });

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUserData({
          firstName: data.data?.firstName || user?.firstName || '',
          lastName: data.data?.lastName || user?.lastName || '',
          username: data.data?.username || user?.username || '',
          description: data.data?.description || '',
          email: user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '',
        });
      }
    } catch (e) {
      console.log('Error fetching user data:', e);
      // Fallback to Clerk data
      setUserData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        username: user?.username || '',
        description: '',
        email: user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userData.firstName.trim() || !userData.username.trim()) {
      Alert.alert('Error', 'El nombre y username son obligatorios');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: userData.firstName,
          lastName: userData.lastName,
          username: userData.username,
          description: userData.description,
          imageUrl: user?.imageUrl || undefined,
        }),
      });

      if (res.ok) {
        Alert.alert('Éxito', 'Perfil actualizado correctamente', [
          { text: 'OK', onPress: () => router.push('/(tabs)/profile') }
        ]);
      } else {
        const error = await res.json();
        Alert.alert('Error', error.error || 'Error al actualizar el perfil');
      }
    } catch (e) {
      console.log('Error updating profile:', e);
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E2773C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <Image 
            source={userData?.imageUrl ? { uri: userData.imageUrl } : require('../assets/user.jpeg')} 
            style={styles.avatar} 
          />
          <TouchableOpacity style={styles.changePhotoButton}>
            <Text style={styles.changePhotoText}>Cambiar foto</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.input}
              value={userData.firstName}
              onChangeText={(text) => setUserData({...userData, firstName: text})}
              placeholder="Tu nombre"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Apellido</Text>
            <TextInput
              style={styles.input}
              value={userData.lastName}
              onChangeText={(text) => setUserData({...userData, lastName: text})}
              placeholder="Tu apellido"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username *</Text>
            <TextInput
              style={styles.input}
              value={userData.username}
              onChangeText={(text) => setUserData({...userData, username: text})}
              placeholder="@username"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={userData.email}
              editable={false}
              placeholderTextColor="#999"
            />
            <Text style={styles.helperText}>El email no se puede cambiar</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Biografía</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={userData.description}
              onChangeText={(text) => setUserData({...userData, description: text})}
              placeholder="Cuéntanos sobre ti..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    fontFamily: 'Inter',
  },
  saveButton: {
    backgroundColor: '#E2773C',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Inter',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changePhotoText: {
    color: '#E2773C',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#222',
    fontFamily: 'Inter',
    backgroundColor: '#fafafa',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Inter',
  },
}); 