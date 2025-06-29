import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import RecipeCard from '../components/RecipeCard';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import MenuModal from '../components/MenuModal';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('My Recipes');
  const [menuVisible, setMenuVisible] = useState(false);

  const handleFollowingPress = () => {
    router.push('/following');
  };

  const handleFollowersPress = () => {
    router.push('/followers');
  };

  const handleEditProfilePress = () => {
    router.push('/edit-profile');
  };

  const handleAccountDetailsPress = () => {
    router.push('/account-details');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ alignItems: 'center' }}>
        {/* Botón de menú arriba a la derecha */}
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <Feather name="menu" size={18} color="white" />
        </TouchableOpacity>

        {/* Componente MenuModal */}
        <MenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} />

        <TouchableOpacity onPress={handleAccountDetailsPress}>
          <Image source={require('../assets/user-ej.png')} style={styles.avatar} />
        </TouchableOpacity>

        <Text style={styles.name}>Anto Armoa</Text>
        <Text style={styles.username}>@anto.armoa</Text>
        <Text style={styles.bio}>it's simple</Text>

        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statBox} 
            onPress={() => setActiveTab('My Recipes')}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>120</Text>
            <Text style={styles.statLabel}>Recipes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statBox} 
            onPress={handleFollowingPress}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>120</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statBox} 
            onPress={handleFollowersPress}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>250</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.orangeButton]}
            onPress={handleEditProfilePress}
          >
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
  style={[styles.actionButton, styles.shareButton]}
  onPress={() => router.push('/shareprofile')}
>
  <Text style={styles.actionButtonText}>Share Profile</Text>
</TouchableOpacity>
        </View>

        {/* Solapas */}
        <View style={styles.tabsContainer}>
          {['My Recipes', 'Favorites', 'Changed'].map(tab => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.activeTab]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contenido según solapa */}
        {activeTab === 'My Recipes' && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', width: '100%' }}>
            <RecipeCard
              recipe={{
                title: 'CheeseBURGA',
                description: 'Cheesy and tasty',
                image: require('../assets/hamburguesa.png'),
              }}
            />
            <RecipeCard
              recipe={{
                title: 'French Toast',
                description: 'Golden, fluffy French toast with a hint of cinnamon and vanilla.',
                image: require('../assets/french-toast.jpg'),
              }}
            />
          </View>
        )}

        {activeTab === 'Favorites' && (
          <View style={{ alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <View style={styles.favoriteCard}>
              <Image source={require('../assets/hamburguesa.png')} style={styles.favoriteImage} />
              <Text style={styles.favoriteText}>All Posts</Text>
            </View>

            <View style={styles.favoriteCard}>
              <Image source={require('../assets/hamburguesa.png')} style={styles.favoriteImage} />
              <Text style={styles.favoriteText}>Sweet</Text>
            </View>

            <View style={styles.favoriteCard}>
              <Image source={require('../assets/hamburguesa.png')} style={styles.favoriteImage} />
              <Text style={styles.favoriteText}>Salty</Text>
            </View>

            <TouchableOpacity style={styles.createButton}>
              <Text style={styles.createButtonText}>+ Create Collection</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'Changed' && (
          <Text style={styles.placeholderText}>Changed recipes will appear here</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  menuButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#E2773C',
    padding: 10,
    borderRadius: 20,
    zIndex: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    marginTop: 80,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Inter',
    color: '#E2773C',
  },
  username: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  bio: {
    fontSize: 13,
    color: '#444',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginBottom: 24,
  },
  statBox: { 
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    minWidth: 80,
    minHeight: 50,
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  statLabel: {
    fontSize: 13,
    color: '#777',
    fontFamily: 'Inter',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#142E8B',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  shareButton: {
    backgroundColor: '#E2773C',
  },
  orangeButton: {
    backgroundColor: '#E2773C',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
    fontFamily: 'Inter',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  tabText: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: '#888',
  },
  activeTab: {
    color: '#000',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  placeholderText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#999',
    marginTop: 20,
  },
  favoriteCard: {
    width: width * 0.9,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    alignItems: 'center',
    overflow: 'hidden',
  },
  favoriteImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  favoriteText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter',
    marginVertical: 10,
    color: '#E2773C',
  },
  createButton: {
    backgroundColor: '#E2773C',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 10,
  },
  createButtonText: {
    color: '#fff',
    fontFamily: 'Inter',
    fontWeight: 'bold',
    fontSize: 14,
  },
});