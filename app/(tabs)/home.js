import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ImageBackground, Dimensions, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height, width } = Dimensions.get('window');

const API_URL = 'https://gloo-api-production.up.railway.app/api/v1/recipes';
const API_BASE_URL = 'https://gloo-api-production.up.railway.app/api/v1';

function fetchRecipes() {
  return fetch(API_URL)
    .then(res => {
      if (!res.ok) throw new Error('Error fetching recipes');
      return res.json();
    })
    .then(json => {
      const recipes = json.data || [];
      console.log('Fetched recipes with comments:', recipes.map(r => ({ 
        id: r.id, 
        title: r.title, 
        image: r.image,
        comments: r.comments,
        commentsType: typeof r.comments,
        rates: r.rates,
        ratesType: typeof r.rates
      })));
      
      // Filtrar solo recetas originales del backend (no modificadas)
      const originalRecipes = recipes.filter(recipe => {
        const isOriginal = !recipe.title?.includes('(Modificada)') && !recipe.isModified;
        if (!isOriginal) {
          console.log('Filtering out modified recipe:', recipe.title);
        }
        return isOriginal;
      });
      
      console.log('Original recipes count:', originalRecipes.length);
      
      // Asegurar que cada receta tenga información del usuario
      return originalRecipes.map(recipe => {
        return {
          ...recipe,
          user: recipe.user || {
            username: recipe.authorName || 'Chef Anónimo',
            imageUrl: recipe.authorImage || null,
            id: recipe.authorId || null
          }
        };
      });
    });
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Funciones para manejar likes
const saveLikesLocally = async (likes) => {
  try {
    await AsyncStorage.setItem('@gloo:userLikes', JSON.stringify(likes));
  } catch (error) {
    console.log('Error saving likes locally:', error);
  }
};

const loadLikesLocally = async () => {
  try {
    const savedLikes = await AsyncStorage.getItem('@gloo:userLikes');
    return savedLikes ? JSON.parse(savedLikes) : {};
  } catch (error) {
    console.log('Error loading likes locally:', error);
    return {};
  }
};

const toggleLikeBackend = async (recipeId, userId, isLiked) => {
  try {
    const method = isLiked ? 'DELETE' : 'POST';
    const endpoint = isLiked ? 'unlike' : 'like';
    const response = await fetch(`https://gloo-api-production.up.railway.app/api/v1/likes/${userId}/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipeId }),
    });
    return response.ok;
  } catch (error) {
    console.log('Error toggling like on backend:', error);
    return false;
  }
};

// Funciones para manejar recetas guardadas
const saveSavedRecipesLocally = async (savedRecipes) => {
  try {
    await AsyncStorage.setItem('@gloo:savedRecipes', JSON.stringify(savedRecipes));
  } catch (error) {
    console.log('Error saving recipes locally:', error);
  }
};

const loadSavedRecipesLocally = async () => {
  try {
    const localSavedRecipes = await AsyncStorage.getItem('@gloo:savedRecipes');
    return localSavedRecipes ? JSON.parse(localSavedRecipes) : {};
  } catch (error) {
    console.log('Error loading saved recipes locally:', error);
    return {};
  }
};

const toggleSaveBackend = async (recipeId, userId, isSaved) => {
  try {
    const method = isSaved ? 'DELETE' : 'POST';
    const endpoint = isSaved ? 'remove' : 'add';
    const response = await fetch(`${API_BASE_URL}/collections/${userId}/default/recipes`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipeId }),
    });
    
    return response.ok;
  } catch (error) {
    console.log('Error toggling save on backend:', error);
    return false;
  }
};

// Funciones para manejar seguir usuarios
const saveFollowedUsersLocally = async (followedUsers) => {
  try {
    await AsyncStorage.setItem('@gloo:followedUsers', JSON.stringify(followedUsers));
  } catch (error) {
    console.log('Error saving followed users locally:', error);
  }
};

const loadFollowedUsersLocally = async () => {
  try {
    const followedUsers = await AsyncStorage.getItem('@gloo:followedUsers');
    return followedUsers ? JSON.parse(followedUsers) : {};
  } catch (error) {
    console.log('Error loading followed users locally:', error);
    return {};
  }
};

const toggleFollowBackend = async (targetUserId, currentUserId, isFollowing) => {
  try {
    const method = isFollowing ? 'DELETE' : 'POST';
    const endpoint = isFollowing ? 'unfollow' : 'follow';
    const response = await fetch(`https://gloo-api-production.up.railway.app/api/v1/users/${currentUserId}/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetUserId }),
    });
    
    return response.ok;
  } catch (error) {
    console.log('Error toggling follow on backend:', error);
    return false;
  }
};

// Función para obtener recetas trending
const fetchTrendingRecipes = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/recipes/trending`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.data || [];
    } else {
      // Si falla, usar recetas locales ordenadas por likes
      const localRecipes = await AsyncStorage.getItem('@gloo:allRecipes');
      if (localRecipes) {
        const recipes = JSON.parse(localRecipes);
        return recipes.sort((a, b) => (b.rates || 0) - (a.rates || 0)).slice(0, 10);
      }
      return [];
    }
  } catch (error) {
    console.log('Error fetching trending recipes:', error);
    // Si falla, usar recetas locales ordenadas por likes
    const localRecipes = await AsyncStorage.getItem('@gloo:allRecipes');
    if (localRecipes) {
      const recipes = JSON.parse(localRecipes);
      return recipes.sort((a, b) => (b.rates || 0) - (a.rates || 0)).slice(0, 10);
    }
    return [];
  }
};

function PostItem({ item, isGuest, onGuestLimit, index, userLikes, onLikeToggle, savedRecipes, onSaveToggle, followedUsers, onFollowToggle }) {
  const [likeCount, setLikeCount] = useState(Math.max(0, item.rates || 0));
  const [isShared, setIsShared] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();

  // Debug log for comments
  console.log(`Recipe ${item.id} (${item.title}): comments = ${item.comments}, rates = ${item.rates}`);

  // Verificar si el usuario ya dio like
  const liked = userLikes[item.id] || false;
  
  // Verificar si la receta está guardada
  const isSaved = savedRecipes[item.id] || false;
  
  // Verificar si sigue al usuario
  const isFollowing = followedUsers[item.user?.id] || false;

  // Obtener información del usuario con fallbacks
  const userInfo = {
    username: item.user?.username || item.user?.email?.split('@')[0] || item.authorName || 'Chef Anónimo',
    imageUrl: item.user?.imageUrl || item.authorImage || null,
    id: item.user?.id || item.authorId || null
  };

  // Función para obtener avatar con fallback
  const getAvatarSource = () => {
    if (userInfo.imageUrl && userInfo.imageUrl !== 'null' && userInfo.imageUrl !== '') {
      return { uri: userInfo.imageUrl };
    }
    // Fallback a imagen local si no hay URL
    return require('../../assets/user.jpeg');
  };

  // Función para manejar errores de carga de imagen
  const handleImageError = () => {
    console.log('Error loading user image, using fallback');
  };

  // Función para obtener imagen de receta con fallback
  const getRecipeImageSource = () => {
    const title = item.title?.toLowerCase() || '';
    console.log('Recipe title for image detection:', title);
    
    // Forzar fallback para tacos de carnitas mexicanos
    if (title.includes('carnitas') || title.includes('tacos de carnitas')) {
      console.log('Using carnitas specific image for:', title);
      return require('../../assets/french-toast.jpg'); // Imagen específica para carnitas
    }
    
    // Verificar si tiene imagen en el backend
    if (item.image && item.image !== 'null' && item.image !== '') {
      console.log('Using backend image for:', item.title, item.image);
      return { uri: item.image };
    }
    
    // Fallback basado en el título de la receta
    if (title.includes('teriyaki') || title.includes('chicken bowl')) {
      return require('../../assets/teriyaki.jpg');
    } else if (title.includes('avocado') || title.includes('toast')) {
      return require('../../assets/avocado-toast.jpg');
    } else if (title.includes('french') || title.includes('toast')) {
      return require('../../assets/french-toast.jpg');
    } else if (title.includes('tacos') || title.includes('mexican') || title.includes('taco') || title.includes('pork')) {
      console.log('Using taco fallback image for:', title);
      return require('../../assets/teriyaki.jpg'); // Usar teriyaki como fallback para otros tacos
    } else {
      console.log('Using default image for:', title);
      // Imagen por defecto
      return require('../../assets/avocado-toast.jpg');
    }
  };

  // Actualizar likeCount cuando cambie el estado de liked
  React.useEffect(() => {
    const baseCount = Math.max(0, item.rates || 0);
    const adjustedCount = liked ? baseCount + 1 : baseCount;
    console.log(`Like count update for ${item.title}: base=${baseCount}, liked=${liked}, adjusted=${adjustedCount}`);
    setLikeCount(adjustedCount);
  }, [liked, item.rates]);

  const toggleLike = async () => {
    if (isGuest) {
      onGuestLimit();
      return;
    }

    // Actualizar estado de like (el useEffect se encargará del contador)
    onLikeToggle(item.id, !liked);

    // Intentar sincronizar con backend
    if (userId) {
      const success = await toggleLikeBackend(item.id, userId, liked);
      if (!success) {
        console.log('Backend sync failed, keeping local state');
      }
    }
  };

  const toggleSaved = async () => {
    if (isGuest) {
      onGuestLimit();
      return;
    }
    
    // Actualizar UI inmediatamente
    onSaveToggle(item.id, !isSaved);

    // Intentar sincronizar con backend
    if (userId) {
      const success = await toggleSaveBackend(item.id, userId, isSaved);
      if (!success) {
        console.log('Backend sync failed, keeping local state');
      }
    }
  };

  const toggleShared = () => {
    if (isGuest) {
      onGuestLimit();
      return;
    }
    setIsShared(!isShared);
  };

  const handleViewRecipe = () => {
    if (isGuest && index >= 3) {
      onGuestLimit();
      return;
    }
    router.push({
      pathname: '/(tabs)/recipe',
      params: { post: JSON.stringify(item) }
    });
  };

  const handleUserPress = async () => {
    if (isGuest) {
      onGuestLimit();
      return;
    }
    
    // Toggle follow
    onFollowToggle(item.user?.id, !isFollowing);
    
    // Intentar sincronizar con backend
    if (userId && item.user?.id) {
      const success = await toggleFollowBackend(item.user.id, userId, isFollowing);
      if (!success) {
        console.log('Backend sync failed, keeping local state');
      }
    }
  };

  return (
    <ImageBackground source={getRecipeImageSource()} style={styles.postContainer}>
      <View style={styles.overlay}>
        <View style={styles.bottomContent}>
          <TouchableOpacity 
            style={styles.userInfoContainer} 
            onPress={handleUserPress}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              {imageLoading && userInfo.imageUrl && (
                <ActivityIndicator 
                  size="small" 
                  color="#f97316" 
                  style={styles.avatarLoader}
                />
              )}
              <Image 
                source={getAvatarSource()} 
                style={styles.avatar}
                defaultSource={require('../../assets/user.jpeg')}
                onError={handleImageError}
                onLoad={() => setImageLoading(false)}
              />
            </View>
            <View style={styles.userTextContainer}>
              <Text style={styles.username}>@{userInfo.username}</Text>
              <Text style={styles.time}>
                {item.estimatedTime ? `${item.estimatedTime} min` : 'Tiempo no especificado'}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.viewRecipeButton}
            onPress={handleViewRecipe}
          >
            <Text style={styles.viewRecipeText}>View recipe</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={18} color="white" />
              <Text style={styles.metaText}>{item.estimatedTime ? `${item.estimatedTime} min` : ''}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={18} color="white" />
              <Text style={styles.metaText}>{item.rates || 0}</Text>
            </View>
          </View>
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionIcon} onPress={toggleLike}>
              <Ionicons name="heart" size={30} color={liked ? '#ef4444' : 'white'} />
              <Text style={styles.actionText}>{likeCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon} onPress={isGuest ? onGuestLimit : () => router.push({ pathname: '/comment', params: { id: item.id } })}>
              <Ionicons name="chatbubble-ellipses" size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon} onPress={toggleSaved}>
              <Ionicons name="bookmark" size={30} color={isSaved ? '#fbbf24' : 'white'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon} onPress={toggleShared}>
              <Ionicons name="arrow-redo" size={30} color={isShared ? '#10b981' : 'white'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState('For You');
  const { isSignedIn, userId } = useAuth();
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [userLikes, setUserLikes] = useState({});
  const [savedRecipes, setSavedRecipes] = useState({});
  const [followedUsers, setFollowedUsers] = useState({});
  const [trendingRecipes, setTrendingRecipes] = useState([]);
  const { data, isLoading, error } = useQuery({
    queryKey: ['recipes'],
    queryFn: fetchRecipes,
  });
  const isGuest = !isSignedIn;
  const router = useRouter();

  // Cargar datos al montar el componente
  React.useEffect(() => {
    if (isSignedIn) {
      Promise.all([
        loadLikesLocally(),
        loadSavedRecipesLocally(),
        loadFollowedUsersLocally()
      ]).then(([likes, saved, followed]) => {
        setUserLikes(likes);
        setSavedRecipes(saved);
        setFollowedUsers(followed);
      });
    }
  }, [isSignedIn]);

  // Cargar recetas trending cuando se cambia a tab Following
  React.useEffect(() => {
    if (activeTab === 'Following' && trendingRecipes.length === 0) {
      fetchTrendingRecipes().then(recipes => {
        setTrendingRecipes(recipes);
      });
    }
  }, [activeTab]);

  // Función para manejar cambios de like
  const handleLikeToggle = async (recipeId, isLiked) => {
    const newLikes = { ...userLikes, [recipeId]: isLiked };
    setUserLikes(newLikes);
    await saveLikesLocally(newLikes);
  };

  // Función para manejar cambios de guardar
  const handleSaveToggle = async (recipeId, isSaved) => {
    const newSaved = { ...savedRecipes, [recipeId]: isSaved };
    setSavedRecipes(newSaved);
    await saveSavedRecipesLocally(newSaved);
  };

  // Función para manejar cambios de seguir
  const handleFollowToggle = async (userId, isFollowing) => {
    const newFollowed = { ...followedUsers, [userId]: isFollowing };
    setFollowedUsers(newFollowed);
    await saveFollowedUsersLocally(newFollowed);
  };

  // Determinar qué datos mostrar según el tab activo
  let visibleData = data;
  if (activeTab === 'Following') {
    visibleData = trendingRecipes.length > 0 ? trendingRecipes : data;
  }
  
  console.log('Data source:', { 
    activeTab, 
    dataLength: data?.length, 
    trendingLength: trendingRecipes?.length,
    visibleLength: visibleData?.length 
  });
  
  // Asegurar que solo se muestren recetas del backend (con ID numérico)
  if (Array.isArray(visibleData)) {
    visibleData = visibleData.filter(recipe => {
      const hasValidId = recipe.id && typeof recipe.id === 'number';
      if (!hasValidId) {
        console.log('Filtering out recipe without valid ID:', recipe.title, recipe.id);
      }
      return hasValidId;
    });
  }
  
  if (isGuest && Array.isArray(visibleData) && visibleData.length > 3) {
    visibleData = visibleData.slice(0, 3);
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'white', textAlign: 'center', marginTop: 40 }}>Loading recipes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>Error loading recipes</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabHeader}>
        <TouchableOpacity onPress={() => setActiveTab('For You')}>
          <Text style={[styles.tabText, activeTab === 'For You' && styles.activeTab]}>For You</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('Following')}>
          <Text style={[styles.tabText, activeTab === 'Following' && styles.activeTab]}>Following</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={visibleData}
        keyExtractor={item => item.id?.toString() || item._id?.toString() || Math.random().toString()}
        renderItem={({ item, index }) => (
          <PostItem
            item={item}
            isGuest={isGuest}
            onGuestLimit={() => {}}
            index={index}
            userLikes={userLikes}
            onLikeToggle={handleLikeToggle}
            savedRecipes={savedRecipes}
            onSaveToggle={handleSaveToggle}
            followedUsers={followedUsers}
            onFollowToggle={handleFollowToggle}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (isGuest && Array.isArray(data) && data.length > 3) {
            setShowGuestModal(true);
          }
        }}
        onEndReachedThreshold={0.1}
      />
      <Modal
        visible={showGuestModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGuestModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.85)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Image source={require('../../assets/glooenojado.png')} style={{ width: 260, height: 260, marginBottom: 24 }} resizeMode="contain" />
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 12, textAlign: 'center', textShadowColor: '#000', textShadowRadius: 8 }}>Are you having fun?</Text>
            <Text style={{ fontSize: 16, color: '#fff', marginBottom: 24, textAlign: 'center', textShadowColor: '#000', textShadowRadius: 8 }}>
              If you want to see more recipes, <Text style={{ color: '#F9690E', fontWeight: 'bold' }}>log in</Text> or <Text style={{ color: '#F9690E', fontWeight: 'bold' }}>create an account!</Text>
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: '#F9690E', borderRadius: 50, paddingVertical: 12, paddingHorizontal: 32, marginBottom: 12 }}
              onPress={() => {
                setShowGuestModal(false);
                router.replace('/(auth)/sign-in');
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Sign In / Create Account</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowGuestModal(false)}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginTop: 8, textDecorationLine: 'underline' }}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'black' 
  },
  postContainer: { 
    height: height, 
    width: width, 
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  tabHeader: {
    position: 'absolute',
    top: 50,
    zIndex: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 20,
  },
  tabText: { 
    color: 'rgba(255, 255, 255, 0.4)', 
    fontSize: 18,
    fontWeight: '600',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  activeTab: { 
    color: '#fff', 
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    position: 'relative',
  },
  avatarLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  avatar: { 
    width: 36, 
    height: 36, 
    borderRadius: 18,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  userTextContainer: {
    flex: 1,
  },
  username: { 
    color: 'white', 
    fontWeight: 'bold',
    fontSize: 16,
  },
  time: { 
    color: '#ccc', 
    fontSize: 12,
  },
  bottomContent: {
    marginBottom: 100,
    marginLeft: 8,
    marginRight: 0,
    paddingHorizontal: 0,
    borderRadius: 20,
  },
  viewRecipeButton: {
    backgroundColor: '#f97316',
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 15,
    height: 32,
    alignSelf: 'flex-start',
    top: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  viewRecipeText: { 
    fontWeight: 'bold', 
    color: '#fff', 
    fontSize: 12, 
    top: 3 
  },
  title: { 
    color: 'white', 
    fontSize: 24, 
    fontWeight: 'bold',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  description: { 
    color: 'white', 
    fontSize: 16, 
    marginVertical: 8,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  metaContainer: { 
    flexDirection: 'row', 
    gap: 20, 
    alignItems: 'center', 
    marginTop: 12 
  },
  metaItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  metaText: { 
    color: 'white', 
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  actionsContainer: { 
    position: 'absolute', 
    right: 20, 
    bottom: 250, 
    alignItems: 'center', 
    gap: 20 
  },
  actionIcon: { 
    alignItems: 'center' 
  },
  actionText: { 
    color: 'white', 
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
