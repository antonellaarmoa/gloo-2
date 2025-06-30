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
import { API_CONFIG } from '../config/api';

export default function Followers() {
  const router = useRouter();
  const { userId } = useAuth();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchFollowers();
    }
  }, [userId]);

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      
      // Intentar cargar seguidores desde el backend
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/follows/${userId}/followers`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data && data.data.followers) {
            setFollowers(data.data.followers);
          } else {
            setFollowers([]);
          }
        } else {
          console.log('Backend followers endpoint not available');
          setFollowers([]);
        }
      } catch (backendError) {
        console.log('Backend not available for followers:', backendError);
        setFollowers([]);
      }
      
    } catch (error) {
      console.error('Error fetching followers:', error);
      setFollowers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUser = async (targetUserId) => {
    try {
      // Intentar seguir al usuario desde el backend
      const res = await fetch(`${API_CONFIG.BASE_URL}/follows/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ followingId: targetUserId }),
      });
      
      if (res.ok) {
        console.log('Successfully followed user from followers list');
        Alert.alert('✅ Siguiendo', 'Ahora sigues a este usuario');
      } else {
        console.log('Backend follow failed');
        Alert.alert('Info', 'No se pudo seguir al usuario en este momento');
      }
    } catch (error) {
      console.error('Error following user:', error);
      Alert.alert('Error', 'No se pudo seguir al usuario');
    }
  };

  const renderFollower = ({ item }) => (
    <TouchableOpacity 
      style={styles.followerItem}
      onPress={() => {
        // Navegar al perfil del usuario
        router.push({
          pathname: '/public-profile',
          params: { userId: item.followerId || item.id }
        });
      }}
    >
      <Image 
        source={item.user?.imageUrl ? { uri: item.user.imageUrl } : require('../assets/user.jpeg')} 
        style={styles.followerAvatar} 
      />
      <View style={styles.followerInfo}>
        <Text style={styles.followerName}>
          {item.user?.firstName || 'Usuario'} {item.user?.lastName || ''}
        </Text>
        <Text style={styles.followerUsername}>@{item.user?.username || 'usuario'}</Text>
      </View>
      <TouchableOpacity 
        style={styles.followButton}
        onPress={() => handleFollowUser(item.followerId || item.id)}
      >
        <Text style={styles.followButtonText}>Seguir</Text>
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
        <Text style={styles.headerTitle}>Seguidores</Text>
        <View style={styles.placeholder} />
      </View>

      {followers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Aún no tienes seguidores</Text>
          <Text style={styles.emptyStateSubtext}>¡Comparte tus recetas para conseguir seguidores!</Text>
        </View>
      ) : (
        <FlatList
          data={followers}
          renderItem={renderFollower}
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
  followerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  followerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  followerInfo: {
    flex: 1,
  },
  followerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    fontFamily: 'Inter',
  },
  followerUsername: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  followButton: {
    backgroundColor: '#E2773C',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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