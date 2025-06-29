import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://gloo-api-production.up.railway.app/api/v1';

export default function ProfileScreen() {
  const { isSignedIn, userId, user } = useAuth();
  const router = useRouter();
  const [userStats, setUserStats] = useState({
    recipes: 0,
    followers: 0,
    following: 0,
    likes: 0,
    totalViews: 0,
    comments: 0,
    savedRecipes: 0,
    averageRating: 0,
    totalCookTime: 0,
    favoriteCategory: 'Sin datos'
  });
  const [userRecipes, setUserRecipes] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recipes');

  useEffect(() => {
    if (isSignedIn) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [isSignedIn]);

  // Funciones para manejar datos localmente
  const saveUserStatsLocally = async (stats) => {
    try {
      await AsyncStorage.setItem(`@gloo:userStats_${userId}`, JSON.stringify(stats));
    } catch (error) {
      console.log('Error saving user stats locally:', error);
    }
  };

  const loadUserStatsLocally = async () => {
    try {
      const savedStats = await AsyncStorage.getItem(`@gloo:userStats_${userId}`);
      return savedStats ? JSON.parse(savedStats) : null;
    } catch (error) {
      console.log('Error loading user stats locally:', error);
      return null;
    }
  };

  const saveUserRecipesLocally = async (recipes) => {
    try {
      await AsyncStorage.setItem(`@gloo:userRecipes_${userId}`, JSON.stringify(recipes));
    } catch (error) {
      console.log('Error saving user recipes locally:', error);
    }
  };

  const loadUserRecipesLocally = async () => {
    try {
      const savedRecipes = await AsyncStorage.getItem(`@gloo:userRecipes_${userId}`);
      return savedRecipes ? JSON.parse(savedRecipes) : [];
    } catch (error) {
      console.log('Error loading user recipes locally:', error);
      return [];
    }
  };

  const saveUserActivityLocally = async (activity) => {
    try {
      await AsyncStorage.setItem(`@gloo:userActivity_${userId}`, JSON.stringify(activity));
    } catch (error) {
      console.log('Error saving user activity locally:', error);
    }
  };

  const loadUserActivityLocally = async () => {
    try {
      const savedActivity = await AsyncStorage.getItem(`@gloo:userActivity_${userId}`);
      return savedActivity ? JSON.parse(savedActivity) : [];
    } catch (error) {
      console.log('Error loading user activity locally:', error);
      return [];
    }
  };

  const saveUserAchievementsLocally = async (achievements) => {
    try {
      await AsyncStorage.setItem(`@gloo:userAchievements_${userId}`, JSON.stringify(achievements));
    } catch (error) {
      console.log('Error saving user achievements locally:', error);
    }
  };

  const loadUserAchievementsLocally = async () => {
    try {
      const savedAchievements = await AsyncStorage.getItem(`@gloo:userAchievements_${userId}`);
      return savedAchievements ? JSON.parse(savedAchievements) : [];
    } catch (error) {
      console.log('Error loading user achievements locally:', error);
      return [];
    }
  };

  // Generar logros basados en estadísticas
  const generateAchievements = (stats) => {
    const achievements = [];
    
    if (stats.recipes >= 1) achievements.push({ id: 1, name: 'Primer Chef', description: 'Creaste tu primera receta', icon: '🍳', unlocked: true });
    if (stats.recipes >= 5) achievements.push({ id: 2, name: 'Chef Novato', description: 'Creaste 5 recetas', icon: '👨‍🍳', unlocked: true });
    if (stats.recipes >= 10) achievements.push({ id: 3, name: 'Chef Experto', description: 'Creaste 10 recetas', icon: '👨‍🍳', unlocked: true });
    if (stats.likes >= 10) achievements.push({ id: 4, name: 'Popular', description: 'Recibiste 10 likes', icon: '❤️', unlocked: true });
    if (stats.likes >= 50) achievements.push({ id: 5, name: 'Super Popular', description: 'Recibiste 50 likes', icon: '🔥', unlocked: true });
    if (stats.followers >= 5) achievements.push({ id: 6, name: 'Influencer', description: 'Tienes 5 seguidores', icon: '👥', unlocked: true });
    if (stats.averageRating >= 4.5) achievements.push({ id: 7, name: 'Chef de Oro', description: 'Promedio de 4.5+ estrellas', icon: '⭐', unlocked: true });
    
    return achievements;
  };

  // Cargar datos del usuario
  const loadUserData = async () => {
    setLoading(true);

    try {
      // Cargar datos locales primero
      const [localStats, localRecipes, localActivity, localAchievements] = await Promise.all([
        loadUserStatsLocally(),
        loadUserRecipesLocally(),
        loadUserActivityLocally(),
        loadUserAchievementsLocally()
      ]);

      if (localStats) setUserStats(localStats);
      if (localRecipes.length > 0) setUserRecipes(localRecipes);
      if (localActivity.length > 0) setUserActivity(localActivity);
      if (localAchievements.length > 0) setUserAchievements(localAchievements);

      // Intentar sincronizar con backend
      await Promise.all([
        fetchUserData(),
        fetchUserRecipes(),
        fetchUserStats()
      ]);

      // Generar logros basados en estadísticas actuales
      const achievements = generateAchievements(userStats);
      setUserAchievements(achievements);
      await saveUserAchievementsLocally(achievements);

    } catch (error) {
      console.log('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener recetas del usuario desde el backend real
  const fetchUserRecipes = async () => {
    try {
      const response = await fetch(`${API_URL}/recipes/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        const recipes = data.recipes || data.data || [];
        setUserRecipes(recipes);
        await saveUserRecipesLocally(recipes);
      } else {
        // fallback local
        const localRecipes = await loadUserRecipesLocally();
        setUserRecipes(localRecipes);
      }
    } catch (error) {
      console.log('Error fetching user recipes:', error);
      const localRecipes = await loadUserRecipesLocally();
      setUserRecipes(localRecipes);
    }
  };

  // Obtener datos de usuario desde el backend real
  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Aquí puedes setear datos de usuario si los necesitas
        // setUserData(data);
      }
    } catch (error) {
      console.log('Error fetching user data:', error);
    }
  };

  // Obtener estadísticas del usuario desde el backend
  const fetchUserStats = async () => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const stats = data.data;
          const userStats = {
            recipes: stats.recipes || 0,
            followers: stats.followers || 0,
            following: stats.following || 0,
            likes: stats.totalLikes || 0,
            comments: stats.totalComments || 0,
            ratings: stats.totalRatings || 0,
            averageRating: stats.averageRating || 0,
            engagementRate: parseFloat(stats.engagementRate) || 0
          };
          setUserStats(userStats);
          await saveUserStatsLocally(userStats);
        }
      } else {
        // fallback local
        const localStats = await loadUserStatsLocally();
        if (localStats) setUserStats(localStats);
      }
    } catch (error) {
      console.log('Error fetching user stats:', error);
      const localStats = await loadUserStatsLocally();
      if (localStats) setUserStats(localStats);
    }
  };

  // Renderizar receta del usuario
  const renderUserRecipe = ({ item }) => (
    <TouchableOpacity 
      style={styles.recipeItem}
      onPress={() => router.push({
        pathname: '/(tabs)/recipe',
        params: { post: JSON.stringify(item) }
      })}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.recipeImage}
        defaultSource={require('../../assets/french-toast.jpg')}
      />
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeTitle}>{item.title}</Text>
        <View style={styles.recipeMeta}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.recipeTime}>{item.estimatedTime} min</Text>
          <Ionicons name="star" size={14} color="#666" />
          <Text style={styles.recipeRating}>{item.rates || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Renderizar actividad
  const renderActivity = ({ item }) => (
    <View style={styles.activityItem}>
      <Image 
        source={{ uri: item.userImage }} 
        style={styles.activityAvatar}
        defaultSource={require('../../assets/user.jpeg')}
      />
      <View style={styles.activityInfo}>
        <Text style={styles.activityText}>
          <Text style={styles.activityUsername}>{item.username}</Text> {item.action}
        </Text>
        <Text style={styles.activityTime}>{item.time}</Text>
      </View>
    </View>
  );

  // Renderizar logro
  const renderAchievement = ({ item }) => (
    <View style={styles.achievementItem}>
      <View style={styles.achievementIcon}>
        <Text style={styles.achievementEmoji}>{item.icon}</Text>
      </View>
      <View style={styles.achievementInfo}>
        <Text style={styles.achievementName}>{item.name}</Text>
        <Text style={styles.achievementDescription}>{item.description}</Text>
      </View>
      <View style={styles.achievementStatus}>
        <Ionicons 
          name={item.unlocked ? "checkmark-circle" : "lock-closed"} 
          size={24} 
          color={item.unlocked ? "#4CAF50" : "#ccc"} 
        />
      </View>
    </View>
  );

  if (!isSignedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestContainer}>
          <Ionicons name="person-circle-outline" size={100} color="#ccc" />
          <Text style={styles.guestTitle}>Inicia sesión</Text>
          <Text style={styles.guestSubtitle}>Para ver tu perfil y estadísticas</Text>
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={() => router.replace('/(auth)/sign-in')}
          >
            <Text style={styles.signInButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F9690E" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header del perfil */}
        <View style={styles.profileHeader}>
          <Image 
            source={{ uri: user?.imageUrl }} 
            style={styles.profileImage}
            defaultSource={require('../../assets/user.jpeg')}
          />
          <Text style={styles.profileName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.profileEmail}>{user?.emailAddresses?.[0]?.emailAddress}</Text>
          
          <View style={styles.profileActions}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => Alert.alert('Editar Perfil', 'Función en desarrollo')}
            >
              <Text style={styles.editButtonText}>Editar Perfil</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => router.push('/(tabs)/settings')}
            >
              <Ionicons name="settings-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.recipes}</Text>
            <Text style={styles.statLabel}>Recetas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.followers}</Text>
            <Text style={styles.statLabel}>Seguidores</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.following}</Text>
            <Text style={styles.statLabel}>Siguiendo</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.likes}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'recipes' && styles.activeTab]}
            onPress={() => setActiveTab('recipes')}
          >
            <Text style={[styles.tabText, activeTab === 'recipes' && styles.activeTabText]}>
              Mis Recetas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
            onPress={() => setActiveTab('activity')}
          >
            <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>
              Actividad
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
            onPress={() => setActiveTab('achievements')}
          >
            <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>
              Logros
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contenido de tabs */}
        {activeTab === 'recipes' ? (
          <View style={styles.contentContainer}>
            {userRecipes.length > 0 ? (
              <FlatList
                data={userRecipes}
                renderItem={renderUserRecipe}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="stats-chart-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No tienes recetas aún</Text>
                <Text style={styles.emptySubtext}>Crea tu primera receta</Text>
                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={() => router.push('/(tabs)/create-recipe')}
                >
                  <Text style={styles.createButtonText}>Crear Receta</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.contentContainer}>
            {userActivity.length > 0 ? (
              <FlatList
                data={userActivity}
                renderItem={renderActivity}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="walk-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No hay actividad reciente</Text>
                <Text style={styles.emptySubtext}>Interactúa con otras recetas</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'achievements' && (
          <View style={styles.contentContainer}>
            {userAchievements.length > 0 ? (
              <FlatList
                data={userAchievements}
                renderItem={renderAchievement}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="trophy-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No tienes logros aún</Text>
                <Text style={styles.emptySubtext}>Crea recetas para desbloquear logros</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  guestSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  signInButton: {
    backgroundColor: '#F9690E',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 24,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#F9690E',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#F9690E',
    fontWeight: '600',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  recipeItem: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
  },
  recipeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  recipeInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeTime: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    marginRight: 12,
  },
  recipeRating: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  activityUsername: {
    fontWeight: '600',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#F9690E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  achievementItem: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#666',
  },
  achievementStatus: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementEmoji: {
    fontSize: 24,
    color: '#333',
  },
  profileActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});