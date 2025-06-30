import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

export default function Following() {
  const router = useRouter();
  const { userId } = useAuth();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadFollowing();
    }
  }, [userId]);

  const loadFollowing = async () => {
    try {
      setLoading(true);
      
      // Cargar seguidos desde AsyncStorage (estado local)
      const followedUsers = await AsyncStorage.getItem('@gloo:followedUsers');
      const localFollowing = followedUsers ? JSON.parse(followedUsers) : {};
      
      // Convertir el objeto de seguidos a array de usuarios
      const followingArray = Object.keys(localFollowing)
        .filter(userId => localFollowing[userId] === true)
        .map(userId => ({
          id: userId,
          username: `user_${userId.slice(0, 8)}`,
          firstName: 'Usuario',
          lastName: '',
          profileImage: null,
          isFollowing: true
        }));
      
      setFollowing(followingArray);
      
      // Intentar cargar datos adicionales desde el backend si está disponible
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/follows/${userId}/following`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data && data.data.following) {
            // Combinar datos del backend con datos locales
            const backendFollowing = data.data.following.map(user => ({
              ...user,
              isFollowing: true
            }));
            setFollowing(backendFollowing);
          }
        }
      } catch (backendError) {
        console.log('Backend not available, using local data only:', backendError);
      }
      
    } catch (error) {
      console.error('Error loading following:', error);
      setFollowing([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (targetUserId) => {
    try {
      // Actualizar estado local inmediatamente
      const newFollowing = following.filter(user => user.id !== targetUserId);
      setFollowing(newFollowing);
      
      // Actualizar AsyncStorage
      const followedUsers = await AsyncStorage.getItem('@gloo:followedUsers');
      const localFollowing = followedUsers ? JSON.parse(followedUsers) : {};
      localFollowing[targetUserId] = false;
      await AsyncStorage.setItem('@gloo:followedUsers', JSON.stringify(localFollowing));
      
      // Intentar sincronizar con backend
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/follows/${userId}/unfollow`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ followingId: targetUserId }),
        });
        
        if (res.ok) {
          console.log('Successfully unfollowed user on backend');
        } else {
          console.log('Backend unfollow failed, but local state updated');
        }
      } catch (backendError) {
        console.log('Backend not available for unfollow:', backendError);
      }
      
      Alert.alert('✅ Dejaste de seguir', 'Usuario removido de tu lista de seguidos');
      
    } catch (error) {
      console.error('Error unfollowing user:', error);
      Alert.alert('Error', 'No se pudo dejar de seguir al usuario');
    }
  };

  const renderFollowing = ({ item }) => (
    <TouchableOpacity 
      style={styles.followingItem}
      onPress={() => {
        // Navegar al perfil del usuario
        router.push({
          pathname: '/public-profile',
          params: { userId: item.id }
        });
      }}
    >
      <Image 
        source={item.profileImage ? { uri: item.profileImage } : require('../assets/user.jpeg')} 
        style={styles.followingAvatar} 
      />
      <View style={styles.followingInfo}>
        <Text style={styles.followingName}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.followingUsername}>@{item.username}</Text>
      </View>
      <TouchableOpacity 
        style={styles.unfollowButton}
        onPress={() => handleUnfollow(item.id)}
      >
        <Text style={styles.unfollowButtonText}>Dejar de seguir</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Siguiendo</Text>
        <View style={styles.placeholder} />
      </View>

      {following.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No estás siguiendo a nadie</Text>
          <Text style={styles.emptyStateSubtext}>¡Explora y encuentra chefs increíbles para seguir!</Text>
        </View>
      ) : (
        <FlatList
          data={following}
          renderItem={renderFollowing}
          keyExtractor={(item) => item.id || item.userId}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  placeholder: {
    width: 40,
  },
  listContainer: {
    paddingVertical: 16,
  },
  followingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  followingAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  followingInfo: {
    flex: 1,
  },
  followingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    fontFamily: 'Inter',
  },
  followingUsername: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  unfollowButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  unfollowButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Inter',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Inter',
    lineHeight: 20,
  },
}); 