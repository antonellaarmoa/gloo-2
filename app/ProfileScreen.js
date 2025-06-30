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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import RecipeCard from '../components/RecipeCard';
import MenuModal from '../components/MenuModal';
import ShareProfileModal from '../components/ShareProfileModal';
import { API_URLS, apiRequest } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { userId, user, isSignedIn } = useAuth();
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

  // Helpers para colecciones custom locales
  const getCollectionsKey = (userId) => `@gloo:collections:${userId}`;
  const getCustomCollections = async (userId) => {
    try {
      const key = getCollectionsKey(userId);
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };
  const getRecipesFromCustomCollection = async (userId, collectionId) => {
    const collections = await getCustomCollections(userId);
    const col = collections.find(c => c.id === collectionId);
    return col && col.recipes ? col.recipes : [];
  };

  // Fetch user data from backend y colecciones locales
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!isSignedIn || !userId) return;
      setLoading(true);
      let backendUser = null;
      let debugInfo = { userId, url: API_URLS.USERS.BY_ID(userId), response: null, error: null };
      try {
        // 1. Get user profile from backend
        const userRes = await apiRequest(API_URLS.USERS.BY_ID(userId));
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
          const createRes = await apiRequest(API_URLS.USERS.BY_ID(userId), {
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
          const userRes2 = await apiRequest(API_URLS.USERS.BY_ID(userId));
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
        const statsRes = await apiRequest(API_URLS.USERS.STATS(userId));
        // 4. Get user recipes
        const recipesRes = await apiRequest(API_URLS.RECIPES.BY_USER(userId));
        // 5. Get all collections (backend, metadatos)
        const collectionsRes = await apiRequest(API_URLS.COLLECTIONS.BY_USER(userId));
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
              const colRes = await apiRequest(colUrl);
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
        }
        // 6. Followers/Following
        const followersRes = await apiRequest(API_URLS.FOLLOWS.FOLLOWERS(userId));
        const followingRes = await apiRequest(API_URLS.FOLLOWS.FOLLOWING(userId));
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
        setUserCollections(backendCollections);
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
    fetchProfileData();

    // Listener global para refrescar favoritos/colecciones desde otras pantallas
    global.refreshProfileFavorites = fetchProfileData;
    // Listener de AppState para refrescar al volver al perfil
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchProfileData();
    });
    return () => {
      global.refreshProfileFavorites = undefined;
      subscription.remove();
    };
  }, [isSignedIn, userId]);

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

  // Función para eliminar colección
  const handleDeleteCollection = async (collectionId) => {
    if (!userId) return;
    try {
      const res = await apiRequest(API_URLS.COLLECTIONS.DELETE(userId, collectionId), { method: 'DELETE' });
      if (res.success) {
        // Refresca los datos del perfil
        fetchProfileData();
      } else {
        alert('No se pudo eliminar la colección');
      }
    } catch (e) {
      alert('Error eliminando colección');
    }
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
      const res = await apiRequest(API_URLS.COLLECTIONS.CREATE(userId), {
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
                      id: item.id,
                      title: item.title || 'Sin título',
                      description: item.description || 'Sin descripción',
                      image: item.imageUrl ? { uri: item.imageUrl } : require('../assets/hamburguesa.png'),
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
              <FlatList
                data={favoriteRecipes}
                keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
                numColumns={2}
                renderItem={({ item }) => (
                  <View style={[styles.recipeCard, { backgroundColor: '#fff7f2', borderRadius: 16, margin: 8, shadowColor: '#E2773C', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 }]}> 
                    <RecipeCard
                      recipe={{
                        id: item.id,
                        title: item.title || 'Sin título',
                        description: item.description || 'Sin descripción',
                        image: item.image ? { uri: item.image } : require('../assets/hamburguesa.png'),
                        averageRating: item.averageRating || item.rating || 4.2,
                        estimatedTime: item.estimatedTime || item.duration || 30,
                      }}
                      onPress={() => router.push(`/recipe/${item.id}`)}
                    />
                  </View>
                )}
                contentContainerStyle={{ paddingBottom: 8 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>Aún no tienes favoritos</Text>
                    <Text style={styles.emptyStateSubtext}>¡Guarda tus recetas favoritas aquí!</Text>
                  </View>
                }
                scrollEnabled={false}
              />
              {/* Colecciones del usuario (excepto Favoritos) como carpetas */}
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#E2773C', marginTop: 28, marginBottom: 10, marginLeft: 4 }}>
                Mis Colecciones
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                {userCollections
                  .filter(col => col.name !== 'Favoritos' && (!col.isDefault))
                  .map(collection => (
                    <View key={collection.id} style={{ width: '46%', margin: '2%', backgroundColor: '#fff', borderRadius: 18, padding: 14, alignItems: 'center', shadowColor: '#E2773C', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2, position: 'relative' }}>
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
                      <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#E2773C', marginBottom: 2, textAlign: 'center' }}>{collection.name}</Text>
                      <Text style={{ color: '#888', fontSize: 13, marginBottom: 6 }}>{collection.recipes.length} receta{collection.recipes.length === 1 ? '' : 's'}</Text>
                      {/* Botón eliminar */}
                      <TouchableOpacity style={{ position: 'absolute', top: 8, right: 8 }} onPress={() => handleDeleteCollection(collection.id)}>
                        <MaterialIcons name="delete" size={22} color="#E2773C" />
                      </TouchableOpacity>
                      {/* Expandir/collapse */}
                      <TouchableOpacity style={{ marginTop: 6 }} onPress={() => setExpandedCollectionId(expandedCollectionId === collection.id ? null : collection.id)}>
                        <MaterialIcons name={expandedCollectionId === collection.id ? 'expand-less' : 'expand-more'} size={24} color="#E2773C" />
                      </TouchableOpacity>
                      {/* Recetas expandibles */}
                      {expandedCollectionId === collection.id && (
                        <FlatList
                          data={collection.recipes}
                          keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
                          numColumns={1}
                          renderItem={({ item }) => (
                            <View style={[styles.recipeCard, { backgroundColor: '#fff7f2', borderRadius: 12, marginVertical: 6, shadowColor: '#E2773C', shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 }]}> 
                              <RecipeCard
                                recipe={{
                                  id: item.id,
                                  title: item.title || 'Sin título',
                                  description: item.description || 'Sin descripción',
                                  image: item.image ? { uri: item.image } : require('../assets/hamburguesa.png'),
                                  averageRating: item.averageRating || item.rating || 4.2,
                                  estimatedTime: item.estimatedTime || item.duration || 30,
                                }}
                                onPress={() => router.push(`/recipe/${item.id}`)}
                              />
                            </View>
                          )}
                          contentContainerStyle={{ paddingBottom: 4 }}
                          showsVerticalScrollIndicator={false}
                          ListEmptyComponent={
                            <View style={styles.emptyState}>
                              <Text style={styles.emptyStateText}>No hay recetas en esta colección</Text>
                            </View>
                          }
                          scrollEnabled={false}
                        />
                      )}
                    </View>
                  ))}
                {/* Botón para crear nueva colección */}
                <TouchableOpacity onPress={() => setCreateModalVisible(true)} style={{ width: '46%', margin: '2%', backgroundColor: '#fff7f2', borderRadius: 18, padding: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E2773C', borderStyle: 'dashed' }}>
                  <MaterialIcons name="add" size={38} color="#E2773C" />
                  <Text style={{ color: '#E2773C', fontWeight: 'bold', fontSize: 16, marginTop: 6 }}>Nueva colección</Text>
                </TouchableOpacity>
              </View>
              {/* Modal para crear colección */}
              {createModalVisible && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                  <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 24, width: '80%', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#E2773C', marginBottom: 12 }}>Crear colección</Text>
                    <TextInput
                      placeholder="Nombre de la colección"
                      value={newCollectionName}
                      onChangeText={setNewCollectionName}
                      style={{ borderWidth: 1, borderColor: '#E2773C', borderRadius: 10, padding: 8, width: '100%', marginBottom: 12 }}
                    />
                    <TextInput
                      placeholder="Ícono (ej: restaurant, ice-cream, folder)"
                      value={newCollectionIcon}
                      onChangeText={setNewCollectionIcon}
                      style={{ borderWidth: 1, borderColor: '#E2773C', borderRadius: 10, padding: 8, width: '100%', marginBottom: 12 }}
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                      <TouchableOpacity onPress={() => setCreateModalVisible(false)} style={{ padding: 10, borderRadius: 8, backgroundColor: '#eee', flex: 1, marginRight: 8 }}>
                        <Text style={{ color: '#E2773C', fontWeight: 'bold', textAlign: 'center' }}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleCreateCollection} style={{ padding: 10, borderRadius: 8, backgroundColor: '#E2773C', flex: 1 }}>
                        <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Crear</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          ) : (
            // Para la tab Changed y otras, puedes usar un ScrollView si lo necesitas
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.recipesContainer}>
                <Text style={styles.emptyStateText}>Las recetas modificadas aparecerán aquí</Text>
              </View>
            </ScrollView>
          )}
        </>
      )}
      <ShareProfileModal visible={shareModalVisible} onClose={() => setShareModalVisible(false)} profileUrl={`https://gloo.app/u/${getUserUsername().replace('@','')}`} />
      {/* Modal para ver recetas de una colección custom */}
      {collectionModalVisible && (
        <View style={styles.collectionModalOverlay}>
          <View style={styles.collectionModal}>
            <Text style={styles.collectionModalTitle}>{selectedCollection?.displayName || selectedCollection?.name}</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {selectedCollectionRecipes.length === 0 ? (
                <Text style={styles.emptyStateText}>No hay recetas en esta colección</Text>
              ) : (
                selectedCollectionRecipes.map((recipe, idx) => (
                  <View key={recipe.id || idx} style={styles.recipeCard}>
                    <RecipeCard
                      recipe={{
                        id: recipe.id,
                        title: recipe.title || 'Sin título',
                        description: recipe.description || 'Sin descripción',
                        image: recipe.imageUrl ? { uri: recipe.imageUrl } : require('../assets/hamburguesa.png'),
                        averageRating: recipe.averageRating || recipe.rating || 4.2,
                        estimatedTime: recipe.estimatedTime || recipe.duration || 30,
                      }}
                      onPress={() => router.push(`/recipe/${recipe.id}`)}
                    />
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}
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