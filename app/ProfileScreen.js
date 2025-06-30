import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Alert,
  AppState,
  FlatList,
  TextInput,
  Modal,
  Platform,
  ToastAndroid,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import RecipeCard from '../components/RecipeCard';
import MenuModal from '../components/MenuModal';
import ShareProfileModal from '../components/ShareProfileModal';
import { API_URLS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCustomCollections, getRecipesFromCustomCollection, deleteCustomCollection } from '../utils/favoritesManager';

const { width } = Dimensions.get('window');

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

export default function ProfileScreen() {
  const router = useRouter();
  const { userId, user, isSignedIn, getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('My Recipes');
  const [userStats, setUserStats] = useState({ recipes: 0, followers: 0, following: 0 });
  const [userRecipes, setUserRecipes] = useState([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [userData, setUserData] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [userCollections, setUserCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [selectedCollectionRecipes, setSelectedCollectionRecipes] = useState([]);
  const [collectionModalVisible, setCollectionModalVisible] = useState(false);
  const [fetchDebug, setFetchDebug] = useState({ userId: '', url: '', response: null, error: null });
  const [expandedCollectionId, setExpandedCollectionId] = useState(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionIcon, setNewCollectionIcon] = useState('folder');
  const [changedRecipes, setChangedRecipes] = useState([]);

  // Helpers para colecciones custom locales
  const getCollectionsKey = (userId) => `@gloo:collections:${userId}`;

  // Cargar recetas modificadas
  const loadChangedRecipes = async () => {
    if (!userId) return;
    try {
      const storageKey = `changed_recipes_${userId}`;
      const existingChanged = await AsyncStorage.getItem(storageKey);
      const changedRecipesList = existingChanged ? JSON.parse(existingChanged) : [];
      setChangedRecipes(changedRecipesList);
      console.log('Loaded changed recipes:', changedRecipesList.length);
    } catch (error) {
      console.error('Error loading changed recipes:', error);
      setChangedRecipes([]);
    }
  };

  const fetchProfileData = async () => {
    if (!isSignedIn || !userId) return;
    setLoading(true);
    let backendUser = null;
    let debugInfo = { userId, url: API_URLS.USERS.BY_ID(userId), response: null, error: null };
    try {
      // 1. Get user profile from backend
      const userRes = await makeApiRequest(API_URLS.USERS.BY_ID(userId));
      debugInfo.response = userRes;
      if (userRes.success && userRes.data && userRes.data.data) {
        backendUser = userRes.data.data;
      } else if (userRes.success && userRes.data) {
        backendUser = userRes.data;
      } else {
        backendUser = null;
      }
      // 2. If user does not exist in backend, create it using Clerk data
      if (!backendUser && user) {
        const createRes = await makeApiRequest(API_URLS.USERS.BY_ID(userId), {
          method: 'PUT',
          body: JSON.stringify({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            username: user.username || '',
            description: user.publicMetadata?.bio || '',
          }),
          headers: { 'Content-Type': 'application/json' },
        });
        debugInfo.createRes = createRes;
        // Re-fetch after creation
        const userRes2 = await makeApiRequest(API_URLS.USERS.BY_ID(userId));
        debugInfo.response2 = userRes2;
        if (userRes2.success && userRes2.data && userRes2.data.data) {
          backendUser = userRes2.data.data;
        } else if (userRes2.success && userRes2.data) {
          backendUser = userRes2.data;
        } else {
          backendUser = null;
        }
      }
      setFetchDebug(debugInfo);
      // 3. Get stats
      const statsRes = await makeApiRequest(API_URLS.USERS.STATS(userId));
      // 4. Get user recipes
      const recipesRes = await makeApiRequest(API_URLS.RECIPES.BY_USER(userId));
      // 5. Get all collections (backend, metadatos)
      const collectionsRes = await makeApiRequest(API_URLS.COLLECTIONS.BY_USER(userId));
      console.log('DEBUG collectionsRes:', collectionsRes);
      let backendCollections = [];
      let favoritos = [];
      if (collectionsRes.success && Array.isArray(collectionsRes.data?.data)) {
        backendCollections = collectionsRes.data.data;
        // Fetch recipes for each collection
        const collectionsWithRecipes = await Promise.all(
          backendCollections.map(async (col) => {
            const colUrl = `${API_URLS.COLLECTIONS.BY_USER(userId)}/${col.id}`;
            console.log('DEBUG fetching collection recipes:', colUrl);
            const colRes = await makeApiRequest(colUrl);
            console.log('DEBUG colRes:', colRes);
            let recipes = [];
            if (
              colRes.success &&
              colRes.data &&
              colRes.data.data &&
              Array.isArray(colRes.data.data.recipes)
            ) {
              recipes = colRes.data.data.recipes;
            }
            return { ...col, recipes };
          })
        );
        backendCollections = collectionsWithRecipes;
        // Favoritos
        const favCol = backendCollections.find(col => col.name === 'Favoritos' || col.isDefault);
        favoritos = favCol && favCol.recipes ? favCol.recipes : [];
        console.log('DEBUG backendCollections:', backendCollections);
        console.log('DEBUG favoritos:', favoritos);
        
        // También cargar favoritos locales como respaldo
        try {
          const { getFavorites } = require('../utils/favoritesManager');
          const localFavorites = await getFavorites(userId);
          console.log('DEBUG localFavorites:', localFavorites);
          
          // Si no hay favoritos en backend pero sí en local, usar los locales
          if (favoritos.length === 0 && localFavorites.length > 0) {
            favoritos = localFavorites;
            console.log('Using local favorites as fallback');
          }
        } catch (error) {
          console.error('Error loading local favorites:', error);
        }
      }
      // 6. Followers/Following
      const followersRes = await makeApiRequest(API_URLS.FOLLOWS.FOLLOWERS(userId));
      const followingRes = await makeApiRequest(API_URLS.FOLLOWS.FOLLOWING(userId));
      // 7. Custom collections (local)
      const customCollections = await getCustomCollections(userId);
      setUserData(backendUser);
      setUserStats(
        statsRes.success && statsRes.data && statsRes.data.data
          ? statsRes.data.data
          : statsRes.success && statsRes.data
            ? statsRes.data
            : { recipes: 0, followers: 0, following: 0 }
      );
      setUserRecipes(
        recipesRes.success && recipesRes.data && Array.isArray(recipesRes.data)
          ? recipesRes.data
          : recipesRes.success && recipesRes.data && Array.isArray(recipesRes.data.data)
            ? recipesRes.data.data
            : []
      );
      setFavoriteRecipes(favoritos);
      setFollowers(followersRes.success && Array.isArray(followersRes.data) ? followersRes.data : []);
      setFollowing(followingRes.success && Array.isArray(followingRes.data) ? followingRes.data : []);
      setUserCollections(customCollections);
      // Guardar collectionsRes en fetchDebug para mostrarlo en el debug block
      setFetchDebug(prev => ({ ...prev, collectionsRes }));
    } catch (e) {
      debugInfo.error = e.message || e.toString();
      setFetchDebug(debugInfo);
      setUserData(null);
      setUserStats({ recipes: 0, followers: 0, following: 0 });
      setUserRecipes([]);
      setFavoriteRecipes([]);
      setFollowers([]);
      setFollowing([]);
      setUserCollections([]);
    }
    setLoading(false);
  };

  // Fetch user data from backend y colecciones locales
  useEffect(() => {
    fetchProfileData();
    loadChangedRecipes();

    // Listener global para refrescar favoritos/colecciones desde otras pantallas
    global.refreshProfileFavorites = () => {
      console.log('Refreshing profile favorites...');
      fetchProfileData();
      loadChangedRecipes();
    };

    // Cleanup function
    return () => {
      if (global.refreshProfileFavorites) {
        delete global.refreshProfileFavorites;
      }
    };
    
    // Listener global para refrescar recetas modificadas
    global.refreshChangedRecipes = loadChangedRecipes;
    // Listener de AppState para refrescar al volver al perfil
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        fetchProfileData();
        loadChangedRecipes();
      }
    });
    return () => {
      global.refreshProfileFavorites = undefined;
      global.refreshChangedRecipes = undefined;
      subscription.remove();
    };
  }, [isSignedIn, userId]);

  useEffect(() => {
    const syncLocalCollections = async () => {
      if (!userId) return;
      const localCollections = await getCustomCollections(userId);
      setUserCollections(localCollections);
    };
    syncLocalCollections();
    if (router?.addListener) {
      const unsubscribe = router.addListener('focus', syncLocalCollections);
      return () => unsubscribe && unsubscribe();
    }
  }, [userId]);

  // Helpers para mostrar datos
  const getUserDisplayName = () => {
    if (userData && userData.firstName) return userData.firstName;
    if (userData && userData.username) return userData.username;
    return 'Usuario';
  };
  const getUserUsername = () => {
    if (userData && userData.username) return `@${userData.username}`;
    return userId ? `@${userId.slice(0, 8)}` : '@usuario';
  };
  const getUserBio = () => {
    if (userData && userData.description) return userData.description;
    return '¡Comparte tus mejores recetas!';
  };
  const getUserProfileImage = () => {
    if (userData && userData.imageUrl) return { uri: userData.imageUrl };
    return require('../assets/user.jpeg');
  };

  // Navegación
  const handleFollowingPress = () => router.push('/following');
  const handleFollowersPress = () => router.push('/followers');
  const handleEditProfilePress = () => router.push('/edit-profile');
  const handleAccountDetailsPress = () => router.push('/account-details');

  // Modal de colección custom
  const openCollectionModal = async (collection) => {
    const recipes = await getRecipesFromCustomCollection(userId, collection.id);
    setSelectedCollection(collection);
    setSelectedCollectionRecipes(recipes);
    setCollectionModalVisible(true);
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

  // Función para eliminar colección
  const handleDeleteCollection = async (collectionId) => {
    if (!userId) return;
    Alert.alert(
      'Eliminar colección',
      '¿Estás seguro de que quieres eliminar esta colección? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive', onPress: async () => {
            try {
              // Obtener token de Clerk correctamente
              const token = await getToken();
              if (!token) {
                Alert.alert('Error', 'No se pudo obtener el token de autenticación. Por favor, vuelve a iniciar sesión.');
                return;
              }
              console.log('Intentando borrar colección:', collectionId, 'con token:', token);
              const res = await makeApiRequest(API_URLS.COLLECTIONS.DELETE(userId, collectionId), {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              });
              console.log('Respuesta backend al borrar colección:', res);
              if (res.success) {
                await deleteCustomCollection(userId, collectionId);
                await fetchProfileData();
                if (global.refreshProfileFavorites) global.refreshProfileFavorites();
                Alert.alert('Colección eliminada', 'La colección fue eliminada correctamente.');
              } else if (res.status === 404 || res.status === 500) {
                // Si la colección no existe o hay error interno, bórrala localmente igual
                await deleteCustomCollection(userId, collectionId);
                await fetchProfileData();
                if (global.refreshProfileFavorites) global.refreshProfileFavorites();
                // Mostrar solo un toast suave, no error fuerte
                if (Platform.OS === 'android') {
                  ToastAndroid.show('La colección fue eliminada localmente.', ToastAndroid.SHORT);
                } else {
                  Alert.alert('Colección eliminada', 'La colección fue eliminada localmente.');
                }
              } else {
                Alert.alert('Error', `No se pudo eliminar la colección en el servidor.\nStatus: ${res.status}\nMensaje: ${res.data?.message || JSON.stringify(res.data)}`);
              }
            } catch (e) {
              console.log('Error al intentar borrar colección:', e);
              Alert.alert('Error', 'No se pudo eliminar la colección.');
            }
          }
        }
      ]
    );
  };

  // Función para crear colección
  const handleCreateCollection = async () => {
    if (!userId || !newCollectionName.trim()) return;
    try {
      const body = {
        name: newCollectionName.trim(),
        icon: newCollectionIcon.trim() || 'folder',
        color: '#E2773C',
        description: '',
        isPublic: 'false',
      };
      const res = await makeApiRequest(API_URLS.COLLECTIONS.CREATE(userId), {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.success) {
        setCreateModalVisible(false);
        setNewCollectionName('');
        setNewCollectionIcon('folder');
        fetchProfileData();
      } else {
        alert('No se pudo crear la colección');
      }
    } catch (e) {
      alert('Error creando colección');
    }
  };

  // Utilidad para iconos de colecciones
  const getCollectionIcon = (collection) => {
    if (collection.name === 'Dulce' && !collection.icon) return { type: 'emoji', value: '🍰' };
    if (collection.icon === 'ice-cream') return { type: 'emoji', value: '🍦' };
    // Puedes agregar más mapeos aquí
    return { type: 'material', value: collection.icon || 'folder' };
  };

  // 1. Crea la función renderProfileHeader
  const renderProfileHeader = () => (
    <>
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
        <TouchableOpacity style={styles.statBox} onPress={() => setActiveTab('My Recipes')} activeOpacity={0.7}>
          <Text style={styles.statNumber}>{userStats.recipes}</Text>
          <Text style={styles.statLabel}>Recetas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statBox} onPress={handleFollowingPress} activeOpacity={0.7}>
          <Text style={styles.statNumber}>{userStats.following}</Text>
          <Text style={styles.statLabel}>Siguiendo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statBox} onPress={handleFollowersPress} activeOpacity={0.7}>
          <Text style={styles.statNumber}>{userStats.followers}</Text>
          <Text style={styles.statLabel}>Seguidores</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={[styles.actionButton, styles.orangeButton]} onPress={handleEditProfilePress}>
          <Text style={styles.actionButtonText}>Editar Perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.shareButton]} onPress={() => setShareModalVisible(true)}>
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
    </>
  );

  // Renderizado de colecciones personalizadas en cards tipo carpeta (solo local, sin favoritos)
  const renderCustomCollections = () => {
    console.log('DEBUG: userCollections en render', userCollections);
    return (
      <View>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#E2773C', marginTop: 28, marginBottom: 10, marginLeft: 4 }}>
          Mis Colecciones
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
          {userCollections
            .filter(col => col.name.toLowerCase() !== 'favoritos')
            .map(collection => (
              <View
                key={collection.id}
                style={{
                  width: '46%',
                  margin: '2%',
                  backgroundColor: '#f8f8f8',
                  borderRadius: 18,
                  padding: 14,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.13,
                  shadowRadius: 10,
                  elevation: 4,
                  position: 'relative',
                  borderWidth: 1.5,
                  borderColor: '#e0e0e0',
                }}
              >
                {/* Ícono de carpeta o personalizado */}
                {(() => {
                  const icon = getCollectionIcon(collection);
                  if (icon.type === 'emoji') {
                    return <Text style={{ fontSize: 38, marginBottom: 6 }}>{icon.value}</Text>;
                  }
                  return (
                    <MaterialIcons
                      name={icon.value}
                      size={38}
                      color={collection.color || '#E2773C'}
                      style={{ marginBottom: 6 }}
                    />
                  );
                })()}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#E2773C', marginBottom: 2, textAlign: 'center', flex: 1 }}>{collection.displayName || collection.name}</Text>
                  {/* Botón ver (popup) */}
                  <TouchableOpacity onPress={() => openCollectionModal(collection)} style={{ marginLeft: 6 }}>
                    <Ionicons name="eye" size={22} color="#E2773C" />
                  </TouchableOpacity>
                </View>
                <Text style={{ color: '#888', fontSize: 13, marginBottom: 6 }}>{collection.recipes.length} receta{collection.recipes.length === 1 ? '' : 's'}</Text>
                {/* Botón eliminar */}
                <TouchableOpacity
                  style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}
                  onPress={(e) => {
                    e.stopPropagation && e.stopPropagation();
                    handleDeleteCollection(collection.id);
                  }}
                >
                  <MaterialIcons name="delete" size={22} color="#E2773C" />
                </TouchableOpacity>
              </View>
            ))}
          {/* Botón para crear nueva colección */}
          <TouchableOpacity onPress={() => setCreateModalVisible(true)} style={{ width: '46%', margin: '2%', backgroundColor: '#fff7f2', borderRadius: 18, padding: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E2773C', borderStyle: 'dashed' }}>
            <MaterialIcons name="add" size={38} color="#E2773C" />
            <Text style={{ color: '#E2773C', fontWeight: 'bold', fontSize: 16, marginTop: 6 }}>Nueva colección</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
          <ActivityIndicator size="large" color="#E2773C" />
          <Text style={{ marginTop: 16, color: '#666' }}>Cargando perfil...</Text>
        </View>
      ) : (
        <>
          {renderProfileHeader()}
          {activeTab === 'My Recipes' ? (
            <FlatList
              data={userRecipes}
              keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
              numColumns={2}
              renderItem={({ item }) => (
                <View style={styles.recipeCard}>
                  <RecipeCard
                    recipe={{
                      ...item,
                      title: item.title || 'Sin título',
                      description: item.description || 'Sin descripción',
                      averageRating: item.averageRating || item.rating || 4.2,
                      estimatedTime: item.estimatedTime || item.duration || 30,
                    }}
                    onPress={() => router.push(`/recipe/${item.id}`)}
                  />
                </View>
              )}
              contentContainerStyle={styles.recipesGrid}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Aún no tienes recetas</Text>
                  <Text style={styles.emptyStateSubtext}>¡Crea tu primera receta y compártela!</Text>
                  <TouchableOpacity style={[styles.actionButton, styles.orangeButton, { marginTop: 16 }]} onPress={() => router.push('/(tabs)/create-recipe')}>
                    <Text style={styles.actionButtonText}>Crear Receta</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          ) : activeTab === 'Favorites' ? (
            <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#E2773C', marginBottom: 12, marginLeft: 4 }}>
                Favoritos
              </Text>
              <View style={{ marginBottom: 24 }}>
                <FlatList
                  data={favoriteRecipes}
                  keyExtractor={(item) => item.id.toString()}
                  horizontal
                  renderItem={({ item }) => <RecipeCard recipe={item} />}
                  ListEmptyComponent={<Text style={{ color: '#888' }}>No tienes recetas favoritas.</Text>}
                />
              </View>
              {/* Render colecciones personalizadas (solo local) */}
              {renderCustomCollections()}
            </ScrollView>
          ) : activeTab === 'Changed' ? (
            <FlatList
              data={changedRecipes}
              keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
              numColumns={2}
              renderItem={({ item }) => (
                <View style={styles.recipeCard}>
                  <RecipeCard
                    recipe={{
                      ...item,
                      title: item.title || 'Sin título',
                      description: item.description || 'Sin descripción',
                      averageRating: item.averageRating || item.rating || 4.2,
                      estimatedTime: item.estimatedTime || item.duration || 30,
                    }}
                    onPress={() => router.push({
                      pathname: '/(tabs)/recipe',
                      params: { post: JSON.stringify(item) }
                    })}
                  />
                </View>
              )}
              contentContainerStyle={styles.recipesGrid}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Aún no tienes recetas modificadas</Text>
                  <Text style={styles.emptyStateSubtext}>Modifica una receta para que aparezca aquí</Text>
                </View>
              }
            />
          ) : (
            // Para otras tabs, puedes usar un ScrollView si lo necesitas
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.recipesContainer}>
                <Text style={styles.emptyStateText}>Contenido no disponible</Text>
              </View>
            </ScrollView>
          )}
        </>
      )}
      <ShareProfileModal visible={shareModalVisible} onClose={() => setShareModalVisible(false)} profileUrl={`https://gloo.app/u/${getUserUsername().replace('@','')}`} />
      {/* Modal para ver recetas de una colección custom */}
      <Modal
        visible={collectionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCollectionModalVisible(false)}
      >
        <View style={styles.collectionModalOverlay}>
          <View style={[styles.collectionModal, { alignItems: 'center', justifyContent: 'flex-start', paddingTop: 32 }]}> 
            {/* Portada visual de la colección */}
            <View style={{ alignItems: 'center', marginBottom: 18 }}>
              {selectedCollection && (() => {
                const icon = getCollectionIcon(selectedCollection);
                if (icon.type === 'emoji') {
                  return <Text style={{ fontSize: 54, marginBottom: 6 }}>{icon.value}</Text>;
                }
                return (
                  <MaterialIcons
                    name={icon.value}
                    size={54}
                    color={selectedCollection.color || '#E2773C'}
                    style={{ marginBottom: 6 }}
                  />
                );
              })()}
              <Text style={{ fontWeight: 'bold', fontSize: 22, color: '#E2773C', marginBottom: 2, textAlign: 'center' }}>{selectedCollection?.displayName || selectedCollection?.name}</Text>
            </View>
            <TouchableOpacity
              style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}
              onPress={() => setCollectionModalVisible(false)}
            >
              <Ionicons name="close-circle" size={32} color="#E2773C" />
            </TouchableOpacity>
            {selectedCollectionRecipes.length === 0 ? (
              <Text style={styles.emptyStateText}>No hay recetas en esta colección</Text>
            ) : (
              <FlatList
                data={selectedCollectionRecipes}
                keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
                renderItem={({ item }) => (
                  <View style={{ marginBottom: 18, alignItems: 'center', width: '100%' }}>
                    <RecipeCard
                      recipe={item}
                      onPress={() => router.push(`/recipe/${item.id}`)}
                    />
                  </View>
                )}
                contentContainerStyle={{ paddingBottom: 8, paddingTop: 8, alignItems: 'center' }}
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 400, minWidth: 260, width: 320, alignSelf: 'center' }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 16,
  },
  menuButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#E2773C',
    padding: 10,
    borderRadius: 20,
    zIndex: 10,
  },
  avatarContainer: { alignItems: 'center', marginTop: 60 },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    fontFamily: 'Inter',
    color: '#E2773C',
    textAlign: 'center',
    marginBottom: 2,
  },
  username: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  bio: {
    fontSize: 14,
    color: '#444',
    fontFamily: 'Inter',
    marginBottom: 18,
    textAlign: 'center',
    maxWidth: width * 0.85,
    backgroundColor: '#fff7f2',
    borderRadius: 12,
    padding: 10,
    alignSelf: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginBottom: 28,
    alignSelf: 'center',
  },
  statBox: { 
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    minWidth: 90,
    minHeight: 60,
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: '#E2773C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter',
    color: '#E2773C',
  },
  statLabel: {
    fontSize: 13,
    color: '#777',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 28,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    backgroundColor: '#eee',
    marginHorizontal: 6,
    shadowColor: '#E2773C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  orangeButton: {
    backgroundColor: '#E2773C',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'Inter',
    fontSize: 15,
  },
  shareButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E2773C',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  tabButton: {
    marginHorizontal: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tabText: {
    fontSize: 16,
    color: '#888',
    fontFamily: 'Inter',
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    transition: 'all 0.2s',
  },
  activeTab: {
    color: '#E2773C',
    borderBottomColor: '#E2773C',
    fontWeight: 'bold',
    fontSize: 17,
  },
  recipesContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 28,
  },
  recipesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    width: '100%',
  },
  recipeCard: {
    width: width / 2 - 24,
    marginBottom: 18,
    marginHorizontal: 6,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 36,
  },
  emptyStateText: {
    color: '#888',
    fontSize: 17,
    fontFamily: 'Inter',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    color: '#aaa',
    fontSize: 14,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  collectionModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  collectionModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 6,
  },
  collectionModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E2773C',
    marginBottom: 18,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
});