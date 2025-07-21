import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { API_CONFIG } from '../config/api';

const { width } = Dimensions.get('window');

export default function PublicProfileScreen() {
  const router = useRouter();
  const { userId: viewerId, isSignedIn } = useAuth();
  const { userId: paramUserId } = useLocalSearchParams();
  const [userData, setUserData] = useState(null);
  const [userRecipes, setUserRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    fetchUserData();
    fetchUserRecipes();
    fetchUserStats();
    checkFollowing();
  }, [viewerId, paramUserId]);

  // Refrescar estado cada vez que la pantalla recibe foco
  useFocusEffect(
    React.useCallback(() => {
      fetchUserStats();
      checkFollowing();
    }, [viewerId, paramUserId])
  );

  const API_BASE_URL = API_CONFIG.BASE_URL; // Ya incluye /api/v1

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/${paramUserId}`);
      const data = await res.json();
      if (data.success) {
        setUserData(data.data);
      } else {
        setError('Usuario no encontrado');
      }
    } catch (e) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRecipes = async () => {
    setRecipesLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/recipes/user/${paramUserId}`);
      const data = await res.json();
      if (data.success) {
        setUserRecipes(data.data || []);
      } else {
        setUserRecipes([]);
      }
    } catch (e) {
      setUserRecipes([]);
    } finally {
      setRecipesLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${paramUserId}/stats`);
      const data = await res.json();
      if (data.success) {
        setUserStats(data.data);
      } else {
        setUserStats(null);
      }
    } catch (e) {
      setUserStats(null);
    }
  };

  const checkFollowing = async () => {
    if (!viewerId || !paramUserId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/follows/${viewerId}/following`);
      if (res.ok) {
        const data = await res.json();
        const followingArr = Array.isArray(data.data?.following) ? data.data.following : [];
        const followingIds = followingArr.map(u => u.followingId);
        const isFollowingUser = followingIds.includes(paramUserId);
        setIsFollowing(isFollowingUser);
        setDebugInfo({ viewerId, paramUserId, followingIds, isFollowingUser });
      }
    } catch (e) {
      setIsFollowing(false);
      setDebugInfo({ viewerId, paramUserId, followingIds: [], isFollowingUser: false, error: e.message });
    }
  };

  const handleFollow = async () => {
    if (!viewerId || !paramUserId) return;
    setFollowLoading(true);
    try {
      let res;
      if (isFollowing) {
        // Unfollow: DELETE con body
        res = await fetch(`${API_BASE_URL}/follows/${viewerId}/unfollow`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ followingId: paramUserId }),
        });
      } else {
        // Follow: POST con body
        res = await fetch(`${API_BASE_URL}/follows/${viewerId}/follow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ followingId: paramUserId }),
        });
      }
      if (res.ok) {
        fetchUserStats();
        checkFollowing();
      }
    } catch (e) {}
    setFollowLoading(false);
  };

  const getUserProfileImage = () => {
    if (userData?.imageUrl) {
      return { uri: userData.imageUrl };
    }
    return require('../assets/user.jpeg');
  };

  const renderRecipe = ({ item }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => router.push({ pathname: '/(tabs)/recipe', params: { id: item.id } })}
      activeOpacity={0.85}
    >
      <Image
        source={item.image && item.image !== 'null' && item.image !== '' ? { uri: item.image } : require('../assets/hamburguesa.png')}
        style={styles.recipeImage}
      />
      <Text style={styles.recipeTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.recipeDesc} numberOfLines={2}>{item.description || 'Sin descripción'}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F9690E" />
        <Text style={{ marginTop: 16, color: '#666' }}>Cargando perfil...</Text>
      </View>
    );
  }

  if (error || !userData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Usuario no encontrado'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Image source={getUserProfileImage()} style={styles.avatar} />
            <Text style={styles.name}>{userData.firstName || userData.username || 'Usuario'}</Text>
            <Text style={styles.username}>@{userData.username || userData.id?.slice(0, 8)}</Text>
            {userData.description && (
              <Text style={styles.bio}>{userData.description}</Text>
            )}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{userRecipes.length}</Text>
                <Text style={styles.statLabel}>Recetas</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{userStats?.followers ?? 0}</Text>
                <Text style={styles.statLabel}>Seguidores</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{userStats?.following ?? 0}</Text>
                <Text style={styles.statLabel}>Siguiendo</Text>
              </View>
            </View>
            {/* Botón seguir (simulado) */}
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={handleFollow}
              disabled={followLoading || !isSignedIn || viewerId === paramUserId}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color={isFollowing ? '#666' : '#fff'} />
              ) : !isSignedIn ? (
                <Text style={[styles.followButtonText, { color: '#aaa' }]}>Inicia sesión para seguir</Text>
              ) : viewerId === paramUserId ? (
                <Text style={[styles.followButtonText, { color: '#aaa' }]}>Este es tu perfil</Text>
              ) : (
                <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                  {isFollowing ? 'Siguiendo' : 'Seguir'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        {/* Recetas */}
        <View style={styles.sectionHeader}>
          <Ionicons name="restaurant" size={22} color="#F9690E" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>Recetas de {userData.firstName || userData.username || 'Usuario'}</Text>
        </View>
        {recipesLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#F9690E" />
            <Text style={{ marginTop: 16, color: '#666' }}>Cargando recetas...</Text>
          </View>
        ) : userRecipes.length > 0 ? (
          <FlatList
            data={userRecipes}
            renderItem={renderRecipe}
            keyExtractor={item => item.id?.toString() || Math.random().toString()}
            numColumns={2}
            contentContainerStyle={styles.recipesGrid}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyRecipes}>
            <Ionicons name="restaurant-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No hay recetas aún</Text>
            <Text style={styles.emptySubtitle}>Este usuario aún no ha compartido ninguna receta</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    paddingBottom: 40,
    paddingTop: 0,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 12,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#F9690E',
    marginBottom: 10,
    marginTop: 8,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    textAlign: 'center',
  },
  username: {
    fontSize: 15,
    color: '#888',
    marginBottom: 6,
    textAlign: 'center',
  },
  bio: {
    fontSize: 15,
    color: '#444',
    marginBottom: 10,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 6,
  },
  statBox: {
    alignItems: 'center',
    marginHorizontal: 18,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9690E',
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
  },
  followButton: {
    backgroundColor: '#F9690E',
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 32,
    marginTop: 10,
    marginBottom: 0,
    alignSelf: 'center',
  },
  followingButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F9690E',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  followingButtonText: {
    color: '#F9690E',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  recipesGrid: {
    paddingHorizontal: 10,
    gap: 10,
    marginBottom: 20,
  },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    margin: 6,
    width: (width - 48) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  recipeImage: {
    width: '100%',
    height: 90,
    borderRadius: 10,
    marginBottom: 6,
    resizeMode: 'cover',
  },
  recipeTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#222',
    marginBottom: 2,
    textAlign: 'center',
  },
  recipeDesc: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 2,
  },
  emptyRecipes: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#888',
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#F9690E',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 