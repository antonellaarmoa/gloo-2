import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ImageBackground, Dimensions, TouchableOpacity, Modal, ActivityIndicator, Alert, Animated, Easing, TextInput, ScrollView, Share } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addToFavorites, removeFromFavorites, syncFavoritesWithSavedState, refreshProfileFavorites, getCustomCollections, createCustomCollection, addRecipeToCustomCollection, getRecipesFromCustomCollection, removeRecipeFromCustomCollection, deleteCustomCollection, isRecipeFavorite, forceSyncFavorites, repairFavorites } from '../../utils/favoritesManager';
import { API_URLS } from '../../config/api';
import SaveRecipeModal from '../../components/SaveRecipeModal';
import LikeButton from '../../components/LikeButton';

const { height, width } = Dimensions.get('window');

const API_URL = 'https://gloo-api-production.up.railway.app/api/v1/recipes';
const API_BASE_URL = 'https://gloo-api-production.up.railway.app/api/v1';

// Función robusta para hacer peticiones a la API
const makeApiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...options,
    });
    
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      data = null;
    }
    
    return {
      success: response.ok,
      status: response.status,
      data,
      response,
    };
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    return {
      success: false,
      error,
      status: 0,
    };
  }
};

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

function PostItem({ item, isGuest, onGuestLimit, index, userLikes, setUserLikes, savedRecipes, onSaveToggle, followedUsers, onFollowToggle }) {
  const [likeCount, setLikeCount] = useState(Math.max(0, item.rates || 0));
  const [likeLoading, setLikeLoading] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [userCollections, setUserCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [localSavedState, setLocalSavedState] = useState(savedRecipes[item.id] || false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const [customCollections, setCustomCollections] = useState([]);

  // Debug log for comments
  console.log(`Recipe ${item.id} (${item.title}): comments = ${item.comments}, rates = ${item.rates}`);

  // Sincronizar estado local con estado global
  React.useEffect(() => {
    const newSavedState = savedRecipes[item.id] || false;
    if (localSavedState !== newSavedState) {
      setLocalSavedState(newSavedState);
    }
  }, [savedRecipes[item.id], localSavedState]);

  // Verificar si el usuario ya dio like
  const liked = userLikes[item.id] || false;
  
  // Verificar si la receta está guardada
  const isSaved = savedRecipes[item.id] || false;
  
  // Verificar si sigue al usuario
  const isFollowing = followedUsers[item.userId] || followedUsers[item.user?.id] || false;

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
    // Usar la imagen real de la receta si existe
    if (item.image && item.image !== 'null' && item.image !== '') {
      return { uri: item.image };
    }
    if (item.media && item.media !== 'null' && item.media !== '') {
      return { uri: item.media };
    }
    // Fallbacks
    const title = item.title?.toLowerCase() || '';
    if (title.includes('tacos de pollo tikka') || title.includes('pollo tikka')) {
      return require('../../assets/teriyaki.jpg');
    } else if (title.includes('souffle') || title.includes('soufflé') || title.includes('queso')) {
      return require('../../assets/hamburguesa.png');
    } else if (title.includes('teriyaki') || title.includes('chicken bowl')) {
      return require('../../assets/teriyaki.jpg');
    } else if (title.includes('avocado') || title.includes('toast')) {
      return require('../../assets/avocado-toast.jpg');
    } else if (title.includes('french') || title.includes('toast')) {
      return require('../../assets/french-toast.jpg');
    } else if (title.includes('tacos') || title.includes('mexican') || title.includes('taco') || title.includes('pork') || title.includes('carnitas')) {
      return require('../../assets/teriyaki.jpg');
    } else {
      return require('../../assets/avocado-toast.jpg');
    }
  };

  // Actualizar likeCount cuando cambie el estado de liked
  React.useEffect(() => {
    const baseCount = Math.max(0, item.rates || 0);
    const adjustedCount = liked ? baseCount + 1 : baseCount;
    if (likeCount !== adjustedCount) {
      console.log(`Like count update for ${item.title}: base=${baseCount}, liked=${liked}, adjusted=${adjustedCount}`);
      setLikeCount(adjustedCount);
    }
  }, [liked, item.rates, likeCount]);

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
    
    if (!userId) return;
    
    // Mostrar indicador de carga
    const loadingKey = `saving_${item.id}`;
    if (global[loadingKey]) return; // Evitar múltiples clicks
    global[loadingKey] = true;
    
    try {
      if (localSavedState) {
        // Quitar de favoritos
        console.log('Removing from favorites:', item.title);
        
        // Actualizar estado local inmediatamente para feedback visual
        setLocalSavedState(false);
        
        // Remover del local primero
        const localRemoved = await removeFromFavorites(userId, item.id);
        
        // Remover del backend
        const backendRemoved = await makeApiRequest(API_URLS.COLLECTIONS.REMOVE_FROM_FAVORITES(userId), {
          method: 'DELETE',
          body: JSON.stringify({ recipeId: item.id }),
          headers: { 'Content-Type': 'application/json' },
        });
        
        // Actualizar estado global
        onSaveToggle(item.id, false);
        
        // Refrescar perfil
        if (global.refreshProfileFavorites) {
          global.refreshProfileFavorites();
        }
        
        console.log('Recipe removed from favorites:', { localRemoved, backendRemoved });
      } else {
        // Agregar a favoritos directamente
        console.log('Adding to favorites:', item.title);
        
        // Actualizar estado local inmediatamente para feedback visual
        setLocalSavedState(true);
        
        // Agregar al local primero
        const localAdded = await addToFavorites(userId, item);
        
        // Agregar al backend
        const backendAdded = await makeApiRequest(API_URLS.COLLECTIONS.ADD_TO_FAVORITES(userId), {
          method: 'POST',
          body: JSON.stringify({ recipeId: item.id }),
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (localAdded || backendAdded) {
          // Actualizar estado global
          onSaveToggle(item.id, true);
          
          // Refrescar perfil
          if (global.refreshProfileFavorites) {
            global.refreshProfileFavorites();
          }
          
          console.log('Recipe added to favorites:', { localAdded, backendAdded });
        } else {
          // Si falló, revertir el estado local
          setLocalSavedState(false);
        }
      }
    } catch (error) {
      console.error('Error toggling favorites:', error);
      Alert.alert('Error', 'No se pudo actualizar favoritos');
      // Revertir estado local en caso de error
      setLocalSavedState(!localSavedState);
    } finally {
      // Limpiar indicador de carga
      delete global[loadingKey];
    }
  };

  const toggleShared = async () => {
    if (isGuest) {
      onGuestLimit();
      return;
    }

    try {
      const shareContent = {
        title: item.title || 'Receta de Gloo',
        message: `¡Mira esta deliciosa receta: ${item.title}!\n\n${item.description || 'Una receta increíble para compartir.'}\n\nDescarga Gloo para más recetas: https://gloo.app`,
        url: `https://gloo.app/recipe/${item.id}`, // URL de la receta
      };

      const result = await Share.share(shareContent, {
        dialogTitle: 'Compartir receta',
      });

      if (result.action === Share.sharedAction) {
        setIsShared(true);
        // Resetear después de 2 segundos
        setTimeout(() => setIsShared(false), 2000);
      }
    } catch (error) {
      console.error('Error sharing recipe:', error);
      Alert.alert('Error', 'No se pudo compartir la receta');
    }
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
    console.log('🔍 handleUserPress called');
    console.log('📊 item data:', {
      id: item.id,
      title: item.title,
      user: item.user,
      userId: item.userId
    });
    
    if (isGuest) {
      onGuestLimit();
      return;
    }
    
    // Intentar diferentes campos para el ID del usuario
    const userId = item.user?.id || item.userId || item.user?.userId;
    console.log('👤 User ID found:', userId);
    
    if (userId) {
      console.log('🚀 Navigating to public profile with userId:', userId);
      router.push({
        pathname: '/public-profile',
        params: { userId: userId.toString() }
      });
    } else {
      console.log('❌ No user ID found, cannot navigate to profile');
      // Fallback: mostrar alerta o navegar a una pantalla de error
      Alert.alert('Error', 'No se pudo cargar el perfil del usuario');
    }
  };

  // Obtener colecciones del backend
  const fetchUserCollections = async () => {
    setLoadingCollections(true);
    try {
      const res = await makeApiRequest(API_URLS.COLLECTIONS.BY_USER(userId));
      let collections = [];
      if (res.success && Array.isArray(res.data?.data)) {
        collections = res.data.data;
      }
      setUserCollections(collections);
    } catch (error) {
      setUserCollections([]);
    } finally {
      setLoadingCollections(false);
    }
  };

  // Obtener colecciones personalizadas locales
  const fetchCustomCollections = async () => {
    const collections = await getCustomCollections(userId);
    setCustomCollections(collections);
  };

  // Sincroniza colecciones backend→local
  const syncBackendCollectionsToLocal = async () => {
    const res = await makeApiRequest(API_URLS.COLLECTIONS.BY_USER(userId));
    if (res.success && Array.isArray(res.data?.data)) {
      const backendCollections = res.data.data;
      let localCollections = await getCustomCollections(userId);
      for (const col of backendCollections) {
        const normalizedName = col.name.toLowerCase().replace(/\s+/g, '-');
        const idx = localCollections.findIndex(c => (c.name && c.name.toLowerCase().replace(/\s+/g, '-') === normalizedName));
        if (idx === -1) {
          // No existe en local, créala
          await createCustomCollection(userId, normalizedName, col.name, col.id);
        } else {
          // Existe, actualiza id si es necesario
          if (localCollections[idx].id != col.id) {
            localCollections[idx].id = col.id;
            await AsyncStorage.setItem(getCollectionsKey(userId), JSON.stringify(localCollections));
          }
        }
      }
    }
  };

  // Guardar receta en cualquier colección personalizada (solo local)
  const saveRecipeToAnyCollection = async (collectionId) => {
    // 1. Guardar en local
    await saveRecipeToCustomCollection(collectionId);
    // 2. Guardar en Favoritos del backend
    try {
      await makeApiRequest(API_URLS.COLLECTIONS.ADD_TO_FAVORITES(userId), {
        method: 'POST',
        body: JSON.stringify({ recipeId: item.id }),
        headers: { 'Content-Type': 'application/json' },
      });
      // Refrescar favoritos en el perfil
      if (global.refreshProfileFavorites) global.refreshProfileFavorites();
    } catch (e) {
      console.log('DEBUG: Error guardando en Favoritos backend', e);
    }
  };

  // Guardar en colección personalizada local
  const saveRecipeToCustomCollection = async (collectionId) => {
    console.log('DEBUG: Guardando en colección personalizada', { userId, collectionId, item });
    if (!userId || !collectionId) return;
    setSavingRecipe(true);
    try {
      const safeRecipe = {
        id: item.id,
        title: item.title || 'Sin título',
        description: item.description || 'Sin descripción',
        image: item.image || item.imageUrl || '',
        imageUrl: item.imageUrl || item.image || '',
        averageRating: item.averageRating || item.rating || 4.2,
        estimatedTime: item.estimatedTime || item.duration || 30,
        user: item.user ? {
          id: item.user.id || '',
          username: item.user.username || '',
          imageUrl: item.user.imageUrl || ''
        } : null,
      };
      const ok = await addRecipeToCustomCollection(userId, collectionId, safeRecipe);
      console.log('DEBUG: Resultado addRecipeToCustomCollection', ok);
      // DEBUG: Mostrar colecciones locales después de guardar
      const debugCollections = await getCustomCollections(userId);
      console.log('DEBUG: Colecciones locales después de guardar', debugCollections);
      if (ok) {
        // --- NUEVO: Asegurar que la receta esté en favoritos local y backend ---
        const isFav = await isRecipeFavorite(userId, item.id);
        if (!isFav) {
          await addToFavorites(userId, item); // local
          await makeApiRequest(API_URLS.COLLECTIONS.ADD_TO_FAVORITES(userId), {
            method: 'POST',
            body: JSON.stringify({ recipeId: item.id }),
            headers: { 'Content-Type': 'application/json' },
          }); // backend
        }
        setShowSaveModal(false);
        setSelectedRecipe(null);
        setNewCollectionName('');
        await fetchCustomCollections();
        if (global.refreshProfileFavorites) global.refreshProfileFavorites();
        Alert.alert('¡Éxito!', 'Receta guardada en la colección');
        onSaveToggle(item.id, true);
      } else {
        Alert.alert('Error', 'No se pudo guardar la receta (puede que ya esté en la colección)');
      }
    } catch (error) {
      console.log('DEBUG: Error guardando en colección personalizada', error);
      Alert.alert('Error', 'No se pudo guardar la receta');
    } finally {
      setSavingRecipe(false);
    }
  };

  // Crear colección: backend y local
  const handleCreateCollectionAndSave = async (name, icon = 'folder', recipe) => {
    console.log('DEBUG: Creando colección y guardando receta', { userId, name, icon, recipe });
    if (!userId || !name.trim()) return;
    try {
      // 1. Crear en backend
      const body = {
        name: name.trim(),
        icon: icon.trim() || 'folder',
        color: '#E2773C',
        description: '',
        isPublic: 'false',
      };
      const res = await makeApiRequest(API_URLS.COLLECTIONS.CREATE(userId), {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('DEBUG: Respuesta backend crear colección', res);
      if (res.success && res.data && res.data.data && res.data.data.id) {
        // 2. Crear en local usando el id real del backend
        const localCol = await createCustomCollection(userId, name.trim(), name.trim(), res.data.data.id);
        console.log('DEBUG: Resultado createCustomCollection local', localCol);
        await fetchCustomCollections();
        await fetchUserCollections();
        if (global.refreshProfileFavorites) global.refreshProfileFavorites();
        // 3. Espera a que la colección esté en local y guarda la receta
        await syncBackendCollectionsToLocal();
        await saveRecipeToCustomCollection(res.data.data.id);
        // --- NUEVO: Asegurar que la receta esté en favoritos local y backend ---
        const isFav = await isRecipeFavorite(userId, item.id);
        if (!isFav) {
          await addToFavorites(userId, item); // local
          await makeApiRequest(API_URLS.COLLECTIONS.ADD_TO_FAVORITES(userId), {
            method: 'POST',
            body: JSON.stringify({ recipeId: item.id }),
            headers: { 'Content-Type': 'application/json' },
          }); // backend
        }
        // FEEDBACK INMEDIATO: actualizar estado del botón
        onSaveToggle(item.id, true);
      }
    } catch (e) {
      console.log('DEBUG: Error creando colección', e);
    }
  };

  // Eliminar colección: backend y local
  const handleDeleteCollection = async (collectionId) => {
    if (!userId) return;
    try {
      const res = await makeApiRequest(API_URLS.COLLECTIONS.DELETE(userId, collectionId), { method: 'DELETE' });
      await deleteCustomCollection(userId, collectionId);
      await fetchCustomCollections();
      await fetchUserCollections();
      if (global.refreshProfileFavorites) global.refreshProfileFavorites();
    } catch {}
  };

  // Función para manejar follow/unfollow
  const toggleFollow = async () => {
    if (isGuest) {
      onGuestLimit();
      return;
    }
    
    const targetUserId = item.userId || item.user?.id;
    if (!targetUserId) return;
    
    console.log('Toggle follow:', { targetUserId, currentUserId: userId, isFollowing });
    
    // Actualizar estado local inmediatamente
    onFollowToggle(targetUserId, !isFollowing);
    
    // Intentar sincronizar con backend (sin revertir si falla)
    if (userId) {
      try {
        const method = isFollowing ? 'DELETE' : 'POST';
        const endpoint = isFollowing ? 'unfollow' : 'follow';
        const response = await fetch(`${API_BASE_URL}/follows/${userId}/${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ followingId: targetUserId }),
        });
        
        console.log('Follow response status:', response.status);
        
        if (!response.ok) {
          console.log('Backend sync failed, but keeping local state for better UX');
          // No revertir el estado - mantener la experiencia del usuario
        }
      } catch (error) {
        console.error('Error toggling follow:', error);
        // No revertir el estado - mantener la experiencia del usuario
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
          
          {/* Botón de seguir arriba del View recipe */}
          {!isGuest && (
            <TouchableOpacity 
              style={[styles.followButton, isFollowing && styles.followingButton]} 
              onPress={toggleFollow}
            >
              <Text style={[styles.followText, isFollowing && styles.followingText]}>
                {isFollowing ? 'Siguiendo' : 'Seguir'}
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Botón View recipe */}
          <TouchableOpacity
            style={styles.viewRecipeButton}
            onPress={handleViewRecipe}
          >
            <Text style={styles.viewRecipeText}>View recipe</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description || 'Sin descripción'}</Text>
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
            <LikeButton
              initialCount={item.likes || item.rates || 0}
              size={30}
              style={styles.actionIcon}
              showCount={true}
            />
            <TouchableOpacity style={styles.actionIcon} onPress={isGuest ? onGuestLimit : () => router.push({ pathname: '/comment', params: { id: item.id } })}>
              <View style={styles.iconContainer}>
                <Ionicons name="chatbubble-ellipses" size={30} color="white" style={styles.icon} />
              </View>
              <Text style={styles.actionText}>{item.comments || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionIcon, isGuest && { opacity: 0.5 }]}
              onPress={() => {
                setSelectedRecipe(item);
                setShowSaveModal(true);
              }}
              disabled={isGuest}
            >
              <View style={[styles.iconContainer, localSavedState && styles.iconContainerSaved]}>
                <Ionicons 
                  name={localSavedState ? 'bookmark' : 'bookmark-outline'} 
                  size={24} 
                  color="white" 
                  style={styles.icon}
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon} onPress={toggleShared}>
              <View style={[styles.iconContainer, isShared && styles.iconContainerShared]}>
                <Ionicons name="arrow-redo" size={30} color="white" style={styles.icon} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <SaveRecipeModal
        visible={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        recipe={selectedRecipe}
        userId={userId}
        onSaved={(recipeId, isSaved) => {
          setShowSaveModal(false);
          setLocalSavedState(isSaved);
          if (global.refreshProfileFavorites) global.refreshProfileFavorites();
        }}
      />
    </ImageBackground>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { isSignedIn, userId, isLoaded } = useAuth();
  const [activeTab, setActiveTab] = useState('For You');
  const [userLikes, setUserLikes] = useState({});
  const [savedRecipes, setSavedRecipes] = useState({});
  const [followedUsers, setFollowedUsers] = useState({});
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [trendingRecipes, setTrendingRecipes] = useState([]);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Animation refs for loading dots
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Loading dots animation
  useEffect(() => {
    let isMounted = true;
    
    const animateDots = () => {
      if (!isMounted) return;
      
      Animated.sequence([
        Animated.parallel([
          Animated.timing(dot1Anim, {
            toValue: 1,
            duration: 600,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Anim, {
            toValue: 1,
            duration: 600,
            delay: 200,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Anim, {
            toValue: 1,
            duration: 600,
            delay: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(dot1Anim, {
            toValue: 0,
            duration: 600,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Anim, {
            toValue: 0,
            duration: 600,
            delay: 200,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Anim, {
            toValue: 0,
            duration: 600,
            delay: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        if (isMounted) {
          animateDots();
        }
      });
    };

    // Shimmer animation
    const animateShimmer = () => {
      if (!isMounted) return;
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateDots();
    animateShimmer();
    
    return () => {
      isMounted = false;
    };
  }, []); // Remove dependencies to prevent re-creation

  // Verificar autenticación al cargar
  useEffect(() => {
    if (isLoaded) {
      setAuthChecked(true);
    }
  }, [isLoaded]);

  // Cargar datos al montar el componente
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isSignedIn && userId && isMounted) {
        try {
          const likes = await loadLikesLocally();
          if (isMounted) setUserLikes(likes);
          
          const saved = await loadSavedRecipesLocally();
          if (isMounted) {
            setSavedRecipes(saved);
            
            // Sincronizar con favoritos locales
            try {
              const combinedSaved = await syncFavoritesWithSavedState(userId, saved);
              if (isMounted) {
                setSavedRecipes(combinedSaved);
                console.log('Favorites synced with saved state:', Object.keys(combinedSaved).length, 'recipes');
              }
            } catch (error) {
              console.error('Error syncing with favorites:', error);
            }
            
            // Reparar favoritos si es necesario
            repairFavorites(userId).then(repaired => {
              if (repaired.length > 0 && isMounted) {
                console.log('Favorites repaired:', repaired.length, 'recipes');
              }
            });
          }
          
          const followed = await loadFollowedUsersLocally();
          if (isMounted) setFollowedUsers(followed);
        } catch (error) {
          console.error('Error loading data:', error);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [isSignedIn, userId]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['recipes'],
    queryFn: fetchRecipes,
  });
  
  const isGuest = !isSignedIn;

  // Función para manejar acciones de usuarios guest
  const handleGuestAction = (action) => {
    Alert.alert(
      'Inicia sesión',
      `Para ${action}, necesitas iniciar sesión primero.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Iniciar sesión',
          onPress: () => router.push('/(auth)/sign-in'),
        },
      ]
    );
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

  // Cargar recetas trending cuando se cambia a tab Following
  React.useEffect(() => {
    let isMounted = true;
    
    const loadTrending = async () => {
      if (activeTab === 'Following' && trendingRecipes.length === 0 && isMounted) {
        try {
          const recipes = await fetchTrendingRecipes();
          if (isMounted) {
            setTrendingRecipes(recipes);
          }
        } catch (error) {
          console.error('Error loading trending recipes:', error);
        }
      }
    };
    
    loadTrending();
    
    return () => {
      isMounted = false;
    };
  }, [activeTab, trendingRecipes.length]);

  // Función para manejar cambios de like
  const handleLikeToggle = async (recipeId, isLiked) => {
    const newLikes = { ...userLikes, [recipeId]: isLiked };
    setUserLikes(newLikes);
    await saveLikesLocally(newLikes);
  };

  // Función para agregar a favoritos backend (scope global)
  const addRecipeToFavoritesBackend = async (userId, recipeId) => {
    try {
      const res = await makeApiRequest(API_URLS.COLLECTIONS.ADD_TO_FAVORITES(userId), {
        method: 'POST',
        body: JSON.stringify({ recipeId: recipeId }),
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('Backend add to favorites response:', res);
      return res.success;
    } catch (error) {
      console.error('Error adding to favorites backend:', error);
      return false;
    }
  };

  // Función para remover de favoritos backend (scope global)
  const removeRecipeFromFavoritesBackend = async (userId, recipeId) => {
    try {
      const res = await makeApiRequest(API_URLS.COLLECTIONS.REMOVE_FROM_FAVORITES(userId), {
        method: 'DELETE',
        body: JSON.stringify({ recipeId: recipeId }),
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('Backend remove from favorites response:', res);
      return res.success;
    } catch (error) {
      console.error('Error removing from favorites backend:', error);
      return false;
    }
  };

  // Función para manejar cambios de guardar
  const handleSaveToggle = async (recipeId, isSaved) => {
    console.log('handleSaveToggle called:', { recipeId, isSaved });
    
    // Actualizar estado local inmediatamente
    const newSaved = { ...savedRecipes, [recipeId]: isSaved };
    setSavedRecipes(newSaved);
    await saveSavedRecipesLocally(newSaved);
    
    // Sincronizar con favoritos locales y backend
    if (userId) {
      try {
        const recipe = data?.find(r => r.id === recipeId);
        
        if (isSaved && recipe) {
          // Agregar a favoritos
          const localAdded = await addToFavorites(userId, recipe);
          const backendAdded = await addRecipeToFavoritesBackend(userId, recipeId);
          
          console.log('Save toggle - added to favorites:', { localAdded, backendAdded });
        } else if (!isSaved) {
          // Remover de favoritos
          const localRemoved = await removeFromFavorites(userId, recipeId);
          const backendRemoved = await removeRecipeFromFavoritesBackend(userId, recipeId);
          
          console.log('Save toggle - removed from favorites:', { localRemoved, backendRemoved });
        }
        
        // Refrescar favoritos en el perfil
        if (global.refreshProfileFavorites) {
          global.refreshProfileFavorites();
        }
      } catch (error) {
        console.error('Error syncing with favorites:', error);
      }
    }
  };

  // Sincronizar seguidos con backend
  const syncFollowedUsersWithBackend = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`https://gloo-api-production.up.railway.app/api/v1/follows/${userId}/following`);
      if (res.ok) {
        const data = await res.json();
        const followingArr = Array.isArray(data.data?.following) ? data.data.following : [];
        const newFollowed = {};
        followingArr.forEach(u => {
          if (u.followingId) newFollowed[u.followingId] = true;
        });
        setFollowedUsers(newFollowed);
        await saveFollowedUsersLocally(newFollowed);
      }
    } catch (e) {
      // Si falla, no sobreescribir el estado local
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const syncData = async () => {
      if (userId && isMounted) {
        try {
          await syncFollowedUsersWithBackend();
        } catch (error) {
          console.error('Error syncing followed users:', error);
        }
      }
    };
    
    syncData();
    
    return () => {
      isMounted = false;
    };
  }, [userId]);

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      
      const syncData = async () => {
        if (userId && isMounted) {
          try {
            await syncFollowedUsersWithBackend();
          } catch (error) {
            console.error('Error syncing followed users on focus:', error);
          }
        }
      };
      
      syncData();
      
      return () => {
        isMounted = false;
      };
    }, [userId])
  );

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

  // Mostrar loading mientras se verifica la autenticación
  if (!authChecked || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        {/* Background gradient */}
        <View style={styles.loadingBackground} />
        
        {/* Logo and loading animation */}
        <View style={styles.loadingContent}>
          <Image 
            source={require('../../assets/gloo.png')} 
            style={styles.loadingLogo}
            resizeMode="contain"
          />
          
          {/* Animated dots */}
          <View style={styles.loadingDots}>
            <Animated.View 
              style={[
                styles.dot, 
                styles.dot1, 
                {
                  opacity: dot1Anim,
                  transform: [{
                    scale: dot1Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1.2],
                    }),
                  }],
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.dot, 
                styles.dot2, 
                {
                  opacity: dot2Anim,
                  transform: [{
                    scale: dot2Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1.2],
                    }),
                  }],
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.dot, 
                styles.dot3, 
                {
                  opacity: dot3Anim,
                  transform: [{
                    scale: dot3Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1.2],
                    }),
                  }],
                }
              ]} 
            />
          </View>
          
          <Text style={styles.loadingTitle}>
            {!authChecked ? 'Verificando autenticación...' : 'Cargando recetas deliciosas'}
          </Text>
          <Text style={styles.loadingSubtitle}>
            {!authChecked ? 'Preparando tu experiencia...' : 'Preparando tu experiencia culinaria...'}
          </Text>
          
          {/* Recipe cards skeleton */}
          <View style={styles.skeletonContainer}>
            {[1, 2, 3].map((index) => (
              <View key={index} style={styles.skeletonCard}>
                <Animated.View 
                  style={[
                    styles.skeletonImage,
                    {
                      opacity: shimmerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 0.7],
                      }),
                    }
                  ]} 
                />
                <View style={styles.skeletonContent}>
                  <Animated.View 
                    style={[
                      styles.skeletonTitle,
                      {
                        opacity: shimmerAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 0.7],
                        }),
                      }
                    ]} 
                  />
                  <View style={styles.skeletonUser}>
                    <Animated.View 
                      style={[
                        styles.skeletonAvatar,
                        {
                          opacity: shimmerAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.3, 0.7],
                          }),
                        }
                      ]} 
                    />
                    <Animated.View 
                      style={[
                        styles.skeletonUsername,
                        {
                          opacity: shimmerAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.3, 0.7],
                          }),
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorBackground} />
        
        <View style={styles.errorContent}>
          <Image 
            source={require('../../assets/glooenojado.png')} 
            style={styles.errorImage}
            resizeMode="contain"
          />
          
          <Text style={styles.errorTitle}>¡Ups! Algo salió mal</Text>
          <Text style={styles.errorSubtitle}>No pudimos cargar las recetas</Text>
          <Text style={styles.errorMessage}>
            {error.message || 'Verifica tu conexión a internet e intenta de nuevo'}
          </Text>
          
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              // Refetch data
              window.location.reload();
            }}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Intentar de nuevo</Text>
          </TouchableOpacity>
        </View>
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
            onGuestLimit={() => handleGuestAction('ver más contenido')}
            index={index}
            userLikes={userLikes}
            setUserLikes={setUserLikes}
            savedRecipes={savedRecipes}
            onSaveToggle={handleSaveToggle}
            followedUsers={followedUsers}
            onFollowToggle={setFollowedUsers}
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
    justifyContent: 'center',
    gap: 20 
  },
  actionIcon: { 
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  iconContainer: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconContainerSaved: {
    backgroundColor: '#fbbf24',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    borderColor: '#ffffff',
  },
  iconContainerShared: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    borderColor: '#ffffff',
  },
  icon: {
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  actionText: { 
    color: 'white', 
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  loadingBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingLogo: {
    width: 120,
    height: 120,
    marginBottom: 30,
    opacity: 0.9,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  dot1: {
    backgroundColor: '#f97316',
  },
  dot2: {
    backgroundColor: '#fbbf24',
  },
  dot3: {
    backgroundColor: '#10b981',
  },
  loadingTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  loadingSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  skeletonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 30,
    gap: 15,
  },
  skeletonCard: {
    width: '30%',
    height: 180,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  skeletonImage: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    margin: 8,
  },
  skeletonContent: {
    padding: 12,
  },
  skeletonTitle: {
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
    borderRadius: 4,
  },
  skeletonUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
  },
  skeletonUsername: {
    height: 12,
    width: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  errorBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorSubtitle: {
    color: '#fff',
    fontSize: 16,
  },
  errorMessage: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#f97316',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  saveModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  saveModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  saveModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  saveModalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  saveModalRecipeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  saveModalRecipeImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  saveModalRecipeText: {
    flex: 1,
  },
  saveModalRecipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  saveModalRecipeDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 18,
  },
  saveModalCollections: {
    marginBottom: 24,
  },
  saveModalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  saveModalCollectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  saveModalCollectionItemSelected: {
    borderColor: '#f97316',
    backgroundColor: '#fff7ed',
  },
  saveModalCollectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  saveModalCollectionInfo: {
    flex: 1,
  },
  saveModalCollectionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  saveModalCollectionDescription: {
    fontSize: 13,
    color: '#64748b',
  },
  saveModalLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  saveModalLoadingText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  saveModalNewCollection: {
    marginBottom: 24,
  },
  saveModalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
    backgroundColor: '#ffffff',
  },
  saveModalButton: {
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveModalButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  followButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 15,
    height: 32,
    alignSelf: 'flex-start',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  followingButton: {
    backgroundColor: '#1e3a8a',
  },
  followText: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 12,
  },
  followingText: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 12,
  },
});


