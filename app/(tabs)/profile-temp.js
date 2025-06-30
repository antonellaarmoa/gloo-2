import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Feather } from '@expo/vector-icons';
import RecipeCard from '../../components/RecipeCard';
import MenuModal from '../../components/MenuModal';
import ShareProfileModal from '../../components/ShareProfileModal';

const { width } = Dimensions.get('window');

export default function Profile() {
  const router = useRouter();
  const { userId, user, isSignedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('My Recipes');
  const [userStats, setUserStats] = useState({ recipes: 0, followers: 0, following: 0 });
  const [userRecipes, setUserRecipes] = useState([]);
  const [isNewUser, setIsNewUser] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (isSignedIn && userId) {
      console.log('DEBUG - Loading profile for userId:', userId);
      
      // Usar datos de Clerk inmediatamente
      setUserData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        username: user?.username || '',
        description: user?.publicMetadata?.bio || '',
        imageUrl: user?.imageUrl || null,
      });
      
      setUserStats({ recipes: 0, followers: 0, following: 0 });
      setUserRecipes([]);
      setLoading(false);
    }
  }, [isSignedIn, userId, user]);

  return (
  <View style={styles.container}>
    {loading ? (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#E2773C" />
        <Text style={{ marginTop: 16, color: '#666' }}>Cargando perfil...</Text>
      </View>
    ) : (
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ...resto del contenido del perfil... */}
      </ScrollView>
    )}
  </View>
);

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

  const getUserDisplayName = () => {
    if (userData?.firstName && userData.firstName !== 'undefined' && userData.firstName !== 'null') {
      return userData.firstName;
    }
    if (user?.firstName && user.firstName !== 'undefined') {
      return user.firstName;
    }
    
    const email = user?.primaryEmailAddress?.emailAddress;
    if (email) {
      const emailName = email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    
    return 'Usuario';
  };

  const getUserUsername = () => {
    const username = userData?.username || user?.username;
    if (username && username !== 'undefined' && username !== 'null') {
      return username.startsWith('@') ? username : `@${username}`;
    }
    return `@${user?.id?.slice(0, 8)}`;
  };

  const getUserBio = () => {
    return userData?.description || user?.publicMetadata?.bio || "¡Comparte tus mejores recetas!";
  };

  const getUserProfileImage = () => {
    if (userData?.imageUrl) {
      return { uri: userData.imageUrl };
    }
    return require('../../assets/user.jpeg');
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <Feather name="menu" size={20} color="white" />
        </TouchableOpacity>
        <MenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} />
        
        <TouchableOpacity onPress={handleAccountDetailsPress} style={styles.avatarContainer}>
          <Image source={getUserProfileImage()} style={styles.avatar} />
        </TouchableOpacity>
        
        <Text style={styles.name}>{getUserDisplayName()}</Text>
        <Text style={styles.username}>{getUserUsername()}</Text>
        <Text style={styles.bio}>{getUserBio()}</Text>
        
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statBox} 
            onPress={() => setActiveTab('My Recipes')}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{userStats.recipes}</Text>
            <Text style={styles.statLabel}>Recetas</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statBox} 
            onPress={handleFollowingPress}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{userStats.following}</Text>
            <Text style={styles.statLabel}>Siguiendo</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statBox} 
            onPress={handleFollowersPress}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{userStats.followers}</Text>
            <Text style={styles.statLabel}>Seguidores</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.orangeButton]}
            onPress={handleEditProfilePress}
          >
            <Text style={styles.actionButtonText}>Editar Perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={() => setShareModalVisible(true)}
          >
            <Text style={[styles.actionButtonText, { color: '#E2773C' }]}>Compartir Perfil</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.tabsContainer}>
          {['My Recipes', 'Favorites', 'Changed'].map(tab => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tabButton}>
              <Text style={[styles.tabText, activeTab === tab && styles.activeTab]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {activeTab === 'My Recipes' && (
          <View style={styles.recipesContainer}>
            {userRecipes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Aún no tienes recetas</Text>
                <Text style={styles.emptyStateSubtext}>¡Crea tu primera receta y compártela!</Text>
                <TouchableOpacity style={[styles.actionButton, styles.orangeButton, { marginTop: 16 }]} onPress={() => router.push('/(tabs)/create-recipe')}>
                  <Text style={styles.actionButtonText}>Crear Receta</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.recipesGrid}>
                {userRecipes.slice(0, 5).map((recipe, idx) => (
                  <View key={recipe.id || idx} style={styles.recipeCard}>
                    <RecipeCard 
                      recipe={{
                        title: recipe.title,
                        description: recipe.description || 'Sin descripción',
                        image: recipe.imageUrl ? { uri: recipe.imageUrl } : 
                               recipe.image ? { uri: recipe.image } : 
                               require('../../assets/hamburguesa.png'),
                        averageRating: recipe.averageRating,
                        cookingTime: recipe.cookingTime,
                      }} 
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
        
        {activeTab === 'Favorites' && (
          <View style={styles.favoritesContainer}>
            <View style={styles.favoriteCard}>
              <Image source={require('../../assets/hamburguesa.png')} style={styles.favoriteImage} />
            </View>
            <View style={styles.favoriteCard}>
              <Image source={require('../../assets/hamburguesa.png')} style={styles.favoriteImage} />
            </View>
            <View style={styles.favoriteCard}>
              <Image source={require('../../assets/hamburguesa.png')} style={styles.favoriteImage} />
            </View>
            <TouchableOpacity style={styles.createButton}>
              <Text style={styles.createButtonText}>+ Crear Colección</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {activeTab === 'Changed' && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Las recetas modificadas aparecerán aquí</Text>
          </View>
        )}
      </ScrollView>
      
      <ShareProfileModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        profileUrl={`https://gloo.app/u/${getUserUsername().replace('@', '')}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  scrollContainer: {
    alignItems: 'center',
    paddingBottom: 120,
    paddingTop: 60,
  },
  menuButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    backgroundColor: '#E2773C',
    padding: 12,
    borderRadius: 24,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarContainer: {
    marginTop: 20,
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#F6E6A8',
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  bio: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'Inter',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22,
    paddingHorizontal: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 24,
    width: '100%',
    paddingHorizontal: 24,
  },
  statBox: {
    alignItems: 'center',
    marginHorizontal: 20,
    paddingVertical: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E2773C',
    fontFamily: 'Inter',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter',
    marginTop: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    width: '100%',
    gap: 16,
    paddingHorizontal: 24,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    backgroundColor: '#F6E6A8',
    minWidth: 140,
    alignItems: 'center',
  },
  orangeButton: {
    backgroundColor: '#E2773C',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Inter',
  },
  shareButton: {
    backgroundColor: '#F6E6A8',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    width: '100%',
    paddingHorizontal: 24,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 16,
    color: '#888',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  activeTab: {
    color: '#E2773C',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  recipesContainer: {
    width: '100%',
    paddingHorizontal: 24,
  },
  recipesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 4,
  },
  recipeCard: {
    width: (width - 64) / 2,
    marginBottom: 8,
  },
  favoritesContainer: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 24,
  },
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginVertical: 4,
    width: width - 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  favoriteImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 16,
  },
  createButton: {
    backgroundColor: '#E2773C',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 16,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Inter',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 18,
    fontFamily: 'Inter',
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyStateSubtext: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
}); 