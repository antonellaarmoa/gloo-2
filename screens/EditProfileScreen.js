import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function EditProfileScreen() {
  const router = useRouter();

  const [name, setName] = useState('Anto Armoa');
  const [username, setUsername] = useState('anto.armoa');
  const [presentation, setPresentation] = useState("it's simple ;)");
  const [link, setLink] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleSave = () => {
    setShowModal(true);
    setTimeout(() => setShowModal(false), 1500);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
    
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#E2773C" />
      </TouchableOpacity>

      <Text style={styles.header}>Edit Profile</Text>

      <Image
        source={require('../assets/user-ej.png')}
        style={styles.avatar}
      />
      <Text style={styles.editPhoto}>Edit Photo</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
      />

      <Text style={styles.label}>Presentation</Text>
      <TextInput
        style={[styles.input, styles.presentationInput]}
        value={presentation}
        onChangeText={setPresentation}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Add Link</Text>
      <TextInput
        style={styles.input}
        value={link}
        onChangeText={setLink}
      
        placeholderTextColor="#fff"
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save Changes</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', elevation: 8 }}>
              <Text style={{ color: '#142E8B', fontWeight: 'bold', fontSize: 16, fontFamily: 'Inter' }}>Profile updated successfully!</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFBF6',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
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
  editPhoto: {
    fontSize: 14,
    color: '#E2773C',
    marginBottom: 30,
    fontFamily: 'Inter',
    fontWeight: '400',
    textAlign: 'center',
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
  presentationInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#142E8B',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginTop: 10,
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
