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
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Feather } from '@expo/vector-icons';
import { API_CONFIG } from '../config/api';

export default function Following() {
  const router = useRouter();
  const { userId } = useAuth();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchFollowing();
    }
  }, [userId]);

  const fetchFollowing = async () => {
    try {
      setLoading(true);
      
      // Intentar cargar seguidos desde el backend
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/follows/${userId}/following`);
        if (res.ok) {
          const data = await res.json();
          console.log('Following API response:', data);
          if (data.success && data.data && data.data.following) {
            console.log('Following users found:', data.data.following.length);
            setFollowing(data.data.following);
          } else {
            console.log('No following data in response');
            setFollowing([]);
          }
        } else {
          console.log('Backend following endpoint not available, status:', res.status);
          setFollowing([]);
        }
      } catch (backendError) {
        console.log('Backend not available for following:', backendError);
        setFollowing([]);
      }
      
    } catch (error) {
      console.error('Error fetching following:', error);
      setFollowing([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFollowing();
    setRefreshing(false);
  };

  const handleUnfollow = async (targetUserId) => {
    try {
      console.log('Unfollowing user:', targetUserId);
      
      // Actualizar estado local inmediatamente
      const newFollowing = following.filter(user => user.followingId !== targetUserId);
      setFollowing(newFollowing);
      
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
          Alert.alert('✅ Dejaste de seguir', 'Usuario removido de tu lista de seguidos');
          // Refrescar la lista para asegurar sincronización
          setTimeout(() => {
            fetchFollowing();
          }, 500);
        } else {
          console.log('Backend unfollow failed, status:', res.status);
          Alert.alert('Info', 'No se pudo dejar de seguir al usuario en este momento');
          // Revertir el estado local si falló
          fetchFollowing();
        }
      } catch (backendError) {
        console.log('Backend not available for unfollow:', backendError);
        Alert.alert('Info', 'No se pudo dejar de seguir al usuario en este momento');
        // Revertir el estado local si falló
        fetchFollowing();
      }
      
    } catch (error) {
      console.error('Error unfollowing user:', error);
      Alert.alert('Error', 'No se pudo dejar de seguir al usuario');
      // Revertir el estado local si falló
      fetchFollowing();
    }
  };

  const renderFollowing = ({ item }) => (
    <TouchableOpacity 
      style={styles.followingItem}
      onPress={() => {
        // Navegar al perfil del usuario
        router.push({
          pathname: '/public-profile',
          params: { userId: item.followingId || item.id }
        });
      }}
    >
      <Image 
        source={item.user?.imageUrl ? { uri: item.user.imageUrl } : require('../assets/user.jpeg')} 
        style={styles.followingAvatar} 
      />
      <View style={styles.followingInfo}>
        <Text style={styles.followingName}>
          {item.user?.firstName || 'Usuario'} {item.user?.lastName || ''}
        </Text>
        <Text style={styles.followingUsername}>@{item.user?.username || 'usuario'}</Text>
      </View>
      <TouchableOpacity 
        style={styles.unfollowButton}
        onPress={() => handleUnfollow(item.followingId || item.id)}
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
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Feather name="refresh-cw" size={20} color="#E2773C" />
        </TouchableOpacity>
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#E2773C']}
              tintColor="#E2773C"
            />
          }
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
  refreshButton: {
    padding: 8,
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