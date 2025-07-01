import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Dimensions,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import SaveRecipeModal from '../../components/SaveRecipeModal';
import LikeButton from '../../components/LikeButton';
import { addToFavorites, removeFromFavorites, isRecipeFavorite } from '../../utils/favoritesManager';
import { API_URLS } from '../../config/api';

const { width } = Dimensions.get('window');
const API_URL = 'https://gloo-api-production.up.railway.app/api/v1';

const CATEGORIES = [
  { key: '1', label: 'Desayuno', icon: 'sunny-outline' },
  { key: '2', label: 'Almuerzo', icon: 'restaurant-outline' },
  { key: '3', label: 'Cena', icon: 'moon-outline' },
  { key: '4', label: 'Vegano', icon: 'leaf-outline' },
  { key: '5', label: 'Postre', icon: 'ice-cream-outline' },
  { key: '6', label: 'Rápido', icon: 'flash-outline' },
];

const SORT_OPTIONS = [
  { key: 'newest', label: 'Más recientes', icon: 'time-outline' },
  { key: 'rating', label: 'Mejor valoradas', icon: 'star-outline' },
  { key: 'popularity', label: 'Más populares', icon: 'trending-up-outline' },
];

export default function SearchScreen() {
  const router = useRouter();
  const { isSignedIn, userId } = useAuth();

  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [collectionModalVisible, setCollectionModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [excludedIngredients, setExcludedIngredients] = useState([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [duration, setDuration] = useState(60);
  const [searchHistory, setSearchHistory] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [likesState, setLikesState] = useState({});
  const [followingState, setFollowingState] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userCollections, setUserCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState({});
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    fetchSuggestions();
    fetchHistory();
    fetchCategories();
    if (isSignedIn && userId) {
      fetchUserCollections();
    }
    const loadSaved = async () => {
      try {
        const localSaved = await AsyncStorage.getItem('@gloo:savedRecipes');
        const savedData = localSaved ? JSON.parse(localSaved) : {};
        console.log('Loaded saved recipes:', Object.keys(savedData).length);
        setSavedRecipes(savedData);
      } catch (error) {
        console.error('Error loading saved recipes:', error);
        setSavedRecipes({});
      }
    };
    loadSaved();
    // Escuchar cambios globales
    global.refreshProfileFavorites = loadSaved;
    return () => { global.refreshProfileFavorites = undefined; };
  }, [isSignedIn, userId]);

  // Detectar si el usuario es invitado
  useEffect(() => {
    setIsGuest(!isSignedIn);
  }, [isSignedIn]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/search/categories`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setCategories(data.data);
      } else {
        // Usar categorías por defecto si no hay categorías en el backend
        setCategories(CATEGORIES);
      }
    } catch (e) {
      console.error('Error fetching categories:', e);
      // Usar categorías por defecto si falla
      setCategories(CATEGORIES);
    }
  };

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      // Solo hacer búsqueda si hay query válido
      if (!search.trim()) {
        console.log('Search is empty, clearing results');
        setResults([]);
        setLoading(false);
        return;
      }

      let url = `${API_URL}/search?query=${encodeURIComponent(search.trim())}&sortBy=${sortBy}&limit=50`;
      
      // Solo agregar categoryId si está seleccionado y es un número válido
      if (selectedCategory && !isNaN(parseInt(selectedCategory))) {
        url += `&categoryId=${parseInt(selectedCategory)}`;
      }
      
      console.log('Searching with URL:', url);
      
      const res = await fetch(url);
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Search response:', data);
      
      if (data.success) {
        // Filtrar solo recetas originales (no modificadas)
        let filteredResults = data.data || [];
        
        // Filtrar por duración en el frontend si es necesario
        if (duration && duration < 120) {
          filteredResults = filteredResults.filter(recipe => 
            (recipe.estimatedTime || 30) <= duration
          );
        }
        
        // Filtrar solo recetas originales (no contienen "Modificada" en el título)
        filteredResults = filteredResults.filter(recipe => 
          !recipe.title.toLowerCase().includes('modificada')
        );
        
        // Filtrar por ingredientes excluidos en el frontend
        if (excludedIngredients.length > 0) {
          filteredResults = filteredResults.filter(recipe => {
            // Normalizar ingredientes a array de strings
            let recipeIngredients = [];
            if (Array.isArray(recipe.ingredients)) {
              if (typeof recipe.ingredients[0] === 'object' && recipe.ingredients[0]?.name) {
                recipeIngredients = recipe.ingredients.map(ing => ing.name.toLowerCase());
              } else {
                recipeIngredients = recipe.ingredients.map(ing => ing.toLowerCase());
              }
            } else if (typeof recipe.ingredients === 'string') {
              recipeIngredients = recipe.ingredients.split(',').map(ing => ing.trim().toLowerCase());
            }
            // Si no hay ingredientes, no excluir
            if (!recipeIngredients.length) return true;
            // Si alguno de los ingredientes excluidos está presente, excluir la receta
            return !excludedIngredients.some(exIng => recipeIngredients.includes(exIng.toLowerCase()));
          });
        }
        
        // Remover duplicados basados en título similar
        const uniqueRecipes = [];
        const seenTitles = new Set();
        
        filteredResults.forEach(recipe => {
          const baseTitle = recipe.title.toLowerCase().replace(/\s*\([^)]*\)/g, '').trim();
          if (!seenTitles.has(baseTitle)) {
            seenTitles.add(baseTitle);
            uniqueRecipes.push(recipe);
          }
        });
        
        console.log('Original recipes count:', uniqueRecipes.length);
        setResults(uniqueRecipes);
        
        // Guardar en historial si hay búsqueda
        if (search.trim() && isSignedIn && userId) {
          try {
            await fetch(`${API_URL}/search/history/${userId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                query: search.trim(),
                resultsCount: uniqueRecipes.length 
              })
            });
          } catch (e) {
            console.error('Error saving to history:', e);
          }
        }
      } else {
        console.error('Search failed:', data);
        setResults([]);
      }
    } catch (e) {
      console.error('Error fetching recipes:', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCollections = async () => {
    if (!isSignedIn || !userId) return;
    
    setLoadingCollections(true);
    try {
      const res = await fetch(`${API_URL}/collections/${userId}`);
      const data = await res.json();
      
      if (data.success) {
        const collections = data.data || [];
        console.log('User collections loaded:', collections.length, 'collections');
        
        if (collections.length === 0) {
          console.log('No collections found, creating default collection...');
          
          // Crear solo la colección "Favoritos" por defecto
          const favoritesRes = await fetch(`${API_URL}/collections/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              name: 'favoritos',
              displayName: 'Favoritos'
            })
          });
          
          // Obtener las colecciones creadas
          const finalRes = await fetch(`${API_URL}/collections/${userId}`);
          const finalData = await finalRes.json();
          
          if (finalData.success) {
            console.log('Default collection created successfully');
            // Filtrar la colección "Favoritos" del modal de guardar
            const filteredCollections = finalData.data.filter(collection => 
              collection.name !== 'favoritos' && collection.displayName !== 'Favoritos'
            );
            setUserCollections(filteredCollections || []);
          } else {
            console.error('Failed to fetch created collections:', finalData);
            setUserCollections([]);
          }
        } else {
          console.log('Using existing collections');
          // Filtrar la colección "Favoritos" del modal de guardar
          const filteredCollections = collections.filter(collection => 
            collection.name !== 'favoritos' && collection.displayName !== 'Favoritos'
          );
          setUserCollections(filteredCollections);
        }
      } else {
        console.error('Failed to fetch collections:', data);
        setUserCollections([]);
      }
    } catch (e) {
      console.error('Error fetching collections:', e);
      setUserCollections([]);
    } finally {
      setLoadingCollections(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await fetch(`${API_URL}/search/suggestions`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setSuggestions(data.data.map(s => s.query));
      } else {
        // Usar sugerencias por defecto si no hay en el backend
        setSuggestions(['pasta carbonara', 'pollo teriyaki', 'ensalada césar', 'tiramisú', 'tacos']);
      }
    } catch (e) {
      setSuggestions(['pasta carbonara', 'pollo teriyaki', 'ensalada césar', 'tiramisú', 'tacos']);
    }
  };

  const fetchHistory = async () => {
    try {
      if (isSignedIn && userId) {
        const res = await fetch(`${API_URL}/search/history/${userId}`);
        const data = await res.json();
        setSearchHistory(data.data?.map(h => h.query) || []);
      } else {
        setSearchHistory([]);
      }
    } catch (e) {
      setSearchHistory([]);
    }
  };

  useEffect(() => {
    if (search.trim() !== '') {
      fetchRecipes();
    } else {
      setResults([]);
    }
  }, [search, selectedCategory, duration, excludedIngredients, sortBy]);

  const handleSearch = (text) => {
    console.log('Search text changed:', text);
    setSearch(text);
  };
  
  const handleSubmitSearch = () => {
    console.log('Submitting search:', search);
    if (search.trim() === '') return;
    fetchRecipes();
  };
  
  const handleDeleteHistoryItem = async (item) => {
    try {
      if (isSignedIn && userId) {
        await fetch(`${API_URL}/search/history/${userId}/${item}`, {
          method: 'DELETE'
        });
      }
      setSearchHistory(prev => prev.filter(i => i !== item));
    } catch (e) {
      console.error('Error deleting history item:', e);
    }
  };
  
  const handleAddIngredient = () => {
    const cleaned = ingredientInput.trim().toLowerCase();
    if (cleaned !== '' && !excludedIngredients.includes(cleaned)) {
      setExcludedIngredients([...excludedIngredients, cleaned]);
      setIngredientInput('');
    }
  };
  
  const handleRemoveIngredient = (item) => setExcludedIngredients(excludedIngredients.filter(i => i !== item));
  const toggleFollow = (user) => setFollowingState(prev => ({ ...prev, [user]: !prev[user] }));
  const toggleLike = (id) => setLikesState(prev => ({ ...prev, [id]: { likes: (prev[id]?.likes || 0) + (prev[id]?.liked ? -1 : 1), liked: !prev[id]?.liked } }));

  const handleSaveToCollection = async (recipeId, collectionId) => {
    if (!isSignedIn || !userId) {
      Alert.alert('Error', 'Debes iniciar sesión para guardar recetas');
      return;
    }

    try {
      console.log('Saving recipe', recipeId, 'to collection', collectionId);
      
      const res = await fetch(`${API_URL}/collections/${userId}/${collectionId}/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId: parseInt(recipeId) })
      });
      
      const data = await res.json();
      console.log('Save to collection response:', data);
      
      if (data.success) {
        Alert.alert('✅ Éxito', 'Receta guardada en la colección', [
          { text: 'OK', onPress: () => setCollectionModalVisible(false) }
        ]);
        // Actualizar la lista de colecciones
        fetchUserCollections();
      } else {
        Alert.alert('❌ Error', data.message || data.error || 'Error al guardar la receta');
      }
    } catch (e) {
      console.error('Error saving to collection:', e);
      Alert.alert('❌ Error', 'Error de conexión al guardar la receta');
    }
  };

  const handleSaveToFavorites = async (recipeId) => {
    if (!isSignedIn || !userId) {
      Alert.alert('Error', 'Debes iniciar sesión para guardar recetas');
      return;
    }

    try {
      console.log('Saving recipe', recipeId, 'to favorites');
      
      // Primero buscar la colección "favoritos"
      const collectionsRes = await fetch(`${API_URL}/collections/${userId}`);
      const collectionsData = await collectionsRes.json();
      
      if (!collectionsData.success) {
        Alert.alert('❌ Error', 'No se pudieron obtener las colecciones');
        return;
      }
      
      const favoritesCollection = collectionsData.data.find(col => col.name === 'favoritos');
      
      if (!favoritesCollection) {
        Alert.alert('❌ Error', 'No se encontró la colección de favoritos');
        return;
      }
      
      const res = await fetch(`${API_URL}/collections/${userId}/${favoritesCollection.id}/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId: parseInt(recipeId) })
      });
      
      const data = await res.json();
      console.log('Save to favorites response:', data);
      
      if (data.success) {
        Alert.alert('✅ Éxito', 'Receta guardada en favoritos', [
          { text: 'OK', onPress: () => setCollectionModalVisible(false) }
        ]);
      } else {
        Alert.alert('❌ Error', data.message || data.error || 'Error al guardar en favoritos');
      }
    } catch (e) {
      console.error('Error saving to favorites:', e);
      Alert.alert('❌ Error', 'Error de conexión al guardar en favoritos');
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      Alert.alert('Error', 'El nombre de la colección no puede estar vacío');
      return;
    }

    if (!isSignedIn || !userId) {
      Alert.alert('Error', 'Debes iniciar sesión para crear colecciones');
      return;
    }

    setCreatingCollection(true);
    try {
      console.log('Creating collection:', newCollectionName);
      
      const res = await fetch(`${API_URL}/collections/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newCollectionName.trim().toLowerCase().replace(/\s+/g, '_'),
          displayName: newCollectionName.trim()
        })
      });
      
      const data = await res.json();
      console.log('Create collection response:', data);
      
      if (data.success) {
        Alert.alert('✅ Éxito', 'Colección creada exitosamente', [
          { text: 'OK', onPress: () => {
            setNewCollectionName('');
            // Actualizar la lista de colecciones
            fetchUserCollections();
          }}
        ]);
      } else {
        // Intentar parsear el error para obtener el mensaje
        let errorMessage = 'Error al crear la colección';
        if (data.error) {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        }
        Alert.alert('❌ Error', errorMessage);
      }
    } catch (e) {
      console.error('Error creating collection:', e);
      Alert.alert('❌ Error', 'Error de conexión al crear la colección');
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleSaveToggle = async (recipeId, isSaved) => {
    console.log('handleSaveToggle called:', { recipeId, isSaved });
    
    // Actualizar estado local inmediatamente
    const newSaved = { ...savedRecipes, [recipeId]: isSaved };
    setSavedRecipes(newSaved);
    await AsyncStorage.setItem('@gloo:savedRecipes', JSON.stringify(newSaved));
    
    // Sincronizar con favoritos locales y backend
    if (userId) {
      try {
        const recipe = results.find(r => r.id === recipeId);
        
        if (isSaved && recipe) {
          // Agregar a favoritos
          const localAdded = await addToFavorites(userId, recipe);
          
          // Agregar al backend
          const response = await fetch(API_URLS.COLLECTIONS.ADD_TO_FAVORITES(userId), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipeId: recipeId })
          });
          const backendData = await response.json();
          const backendAdded = backendData.success;
          
          console.log('Save toggle - added to favorites:', { localAdded, backendAdded });
        } else if (!isSaved) {
          // Remover de favoritos
          const localRemoved = await removeFromFavorites(userId, recipeId);
          
          // Remover del backend
          const response = await fetch(API_URLS.COLLECTIONS.REMOVE_FROM_FAVORITES(userId), {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipeId: recipeId })
          });
          const backendData = await response.json();
          const backendRemoved = backendData.success;
          
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

  // Función para manejar el botón guardar - abre el modal
  const handleSave = (recipeId) => {
    console.log('handleSave called with recipeId:', recipeId);
    console.log('isSignedIn:', isSignedIn, 'userId:', userId);
    
    if (!isSignedIn) {
      Alert.alert(
        'Inicia sesión',
        'Debes iniciar sesión para guardar recetas',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar sesión', onPress: () => router.push('/(auth)/sign-in') }
        ]
      );
      return;
    }
    
    const recipe = results.find(r => r.id === recipeId);
    console.log('Found recipe:', recipe ? recipe.title : 'not found');
    if (recipe) {
      setSelectedRecipe(recipe);
      setShowSaveModal(true);
      console.log('Modal opened for recipe:', recipe.title);
    }
  };

  const renderRecipe = ({ item }) => {
    const getUserDisplayName = () => {
      if (item.user && typeof item.user === 'object') {
        return item.user.username || item.user.email?.split('@')[0] || 'user';
      }
      return item.user || 'user';
    };

    const getRecipeImage = () => {
      // Usar la imagen real de la receta si existe
      if (item.image && item.image !== 'null' && item.image !== '') {
        return { uri: item.image };
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
        return require('../../assets/french-toast.jpg');
      }
    };

    // Calcular rating promedio si hay ratings
    const getAverageRating = () => {
      // Si hay ratings en el backend, usar esos datos
      if (item.stats?.rates && item.stats.rates > 0) {
        // Por ahora usar un valor fijo, pero se puede calcular con los datos reales
        return '4.2';
      }
      // Si no hay ratings, mostrar un valor por defecto
      return '4.2';
    };

    // Obtener ingredientes principales para mostrar
    const getMainIngredients = () => {
      // Verificar si hay ingredientes en diferentes formatos posibles
      if (item.ingredients && Array.isArray(item.ingredients) && item.ingredients.length > 0) {
        // Si es un array de objetos con propiedad 'name'
        if (item.ingredients[0] && typeof item.ingredients[0] === 'object' && item.ingredients[0].name) {
          return item.ingredients.slice(0, 3).map(ing => ing.name).join(', ');
        }
        // Si es un array de strings
        else if (typeof item.ingredients[0] === 'string') {
          return item.ingredients.slice(0, 3).join(', ');
        }
      }
      
      // Verificar si hay ingredientes en formato de string separado por comas
      if (item.ingredients && typeof item.ingredients === 'string') {
        const ingredientsArray = item.ingredients.split(',').map(ing => ing.trim());
        return ingredientsArray.slice(0, 3).join(', ');
      }
      
      // Verificar si hay ingredientes en formato de array de strings en una propiedad diferente
      if (item.ingredientList && Array.isArray(item.ingredientList) && item.ingredientList.length > 0) {
        return item.ingredientList.slice(0, 3).join(', ');
      }
      
      // Si no hay ingredientes disponibles, mostrar un mensaje informativo
      return 'Ingredientes no disponibles';
    };

    const { likes, liked } = likesState[item.id] || { likes: item.stats?.likes || 0, liked: false };
    const isSaved = item ? savedRecipes[item.id] || false : false;
    
    return (
      <TouchableOpacity style={styles.recipeCard} onPress={() => router.push({ pathname: '/(tabs)/recipe', params: { id: item.id } })}>
        <View style={styles.recipeImageContainer}>
          <Image source={getRecipeImage()} style={styles.recipeImage} />
          <View style={styles.recipeOverlay} />
          <View style={styles.profileOverlay}>
            <Image 
              source={item.user?.imageUrl ? { uri: item.user.imageUrl } : require('../../assets/user.jpeg')} 
              style={styles.profileAvatar} 
            />
            <TouchableOpacity onPress={() => toggleFollow(item.user?.id)} style={[styles.followCircle, { backgroundColor: followingState[item.user?.id] ? '#E2773C' : '#142E8B' }] }>
              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>{followingState[item.user?.id] ? '✓' : '+'}</Text>
            </TouchableOpacity>
            <Text style={styles.profileUser}>@{getUserDisplayName()}</Text>
            <Text style={styles.profileTime}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => handleSave(item.id)}
          >
            <View style={[styles.iconContainer, isSaved && styles.iconContainerSaved]}>
              <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={24} color="white" style={styles.icon} />
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeTitle}>{item.title}</Text>
          <Text style={styles.recipeDesc}>{item.description || 'Sin descripción'}</Text>
          
          {/* Mostrar ingredientes principales */}
          <Text style={styles.recipeIngredients}>{getMainIngredients()}</Text>
          
          <View style={styles.recipeMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.recipeMetaText}>{item.estimatedTime || 30} min</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={14} color="#666" />
              <Text style={styles.recipeMetaText}>{getAverageRating()}</Text>
            </View>
            <View style={styles.metaItem}>
              <LikeButton
                recipeId={item.id}
                userId={userId}
                initialLiked={!!likesState?.[item.id]}
                initialCount={item.likes || 0}
                size={14}
                showCount={false}
                style={{ marginRight: 2 }}
              />
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="chatbubble-outline" size={14} color="#666" />
              <Text style={styles.recipeMetaText}>{item.stats?.comments || 0}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const isSaved = selectedRecipe ? savedRecipes[selectedRecipe.id] || false : false;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buscar</Text>
        <TouchableOpacity onPress={() => setFilterVisible(true)} style={styles.filterButton}>
          <Feather name="sliders" size={20} color="#E2773C" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar recetas, ingredientes..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={handleSearch}
            onSubmitEditing={handleSubmitSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E2773C" />
          <Text style={styles.loadingText}>Buscando recetas...</Text>
        </View>
      )}

      {search.length === 0 ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
          {suggestions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔥 Tendencias</Text>
              <View style={styles.suggestionsContainer}>
                {suggestions.map((s, i) => (
                  <TouchableOpacity key={i} style={styles.suggestionPill} onPress={() => setSearch(s)}>
                    <Ionicons name="trending-up" size={16} color="#E2773C" />
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {searchHistory.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⏰ Historial</Text>
              {searchHistory.map((item, i) => (
                <View key={i} style={styles.historyRow}>
                  <TouchableOpacity style={styles.historyButton} onPress={() => setSearch(item)}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.historyText}>{item}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteHistoryItem(item)} style={styles.deleteButton}>
                    <Ionicons name="close" size={16} color="#E2773C" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📂 Categorías</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
              {categories.map(cat => {
                const categoryId = cat.id?.toString() || cat.key?.toString() || '';
                return (
                  <TouchableOpacity
                    key={cat.id || cat.key}
                    style={[styles.categoryPill, selectedCategory === categoryId && styles.categoryPillActive]}
                    onPress={() => setSelectedCategory(selectedCategory === categoryId ? '' : categoryId)}
                  >
                    <Ionicons name={cat.icon || 'restaurant-outline'} size={16} color={selectedCategory === categoryId ? '#fff' : '#E2773C'} />
                    <Text style={[styles.categoryText, selectedCategory === categoryId && styles.categoryTextActive]}>{cat.displayName || cat.name || cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={results}
          renderItem={renderRecipe}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.resultsContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No se encontraron resultados</Text>
                <Text style={styles.emptySubtext}>Intenta con otros términos de búsqueda</Text>
              </View>
            )
          }
        />
      )}

      {/* Modal de Filtros */}
      <Modal visible={filterVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔍 Filtrar búsqueda</Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)} style={styles.closeModalButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalLabel}>📊 Ordenar por:</Text>
            <View style={styles.sortOptionsContainer}>
              {SORT_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.sortOption, sortBy === option.key && styles.sortOptionActive]}
                  onPress={() => setSortBy(option.key)}
                >
                  <Ionicons name={option.icon} size={16} color={sortBy === option.key ? '#fff' : '#E2773C'} />
                  <Text style={[styles.sortOptionText, sortBy === option.key && styles.sortOptionTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.modalLabel}>⏱️ Duración máxima (minutos):</Text>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={10}
              maximumValue={120}
              step={5}
              value={duration}
              onValueChange={setDuration}
              minimumTrackTintColor="#E2773C"
              maximumTrackTintColor="#e0e0e0"
              thumbStyle={{ backgroundColor: '#E2773C' }}
            />
            <Text style={styles.durationText}>{duration} min</Text>
            
            <Text style={styles.modalLabel}>🚫 Excluir ingredientes:</Text>
            <View style={styles.ingredientInputContainer}>
              <TextInput
                style={styles.ingredientInput}
                placeholder="Ej: cebolla, ajo..."
                placeholderTextColor="#999"
                value={ingredientInput}
                onChangeText={setIngredientInput}
                onSubmitEditing={handleAddIngredient}
              />
              <TouchableOpacity onPress={handleAddIngredient} style={styles.addIngredientBtn}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.ingredientsList}>
              {excludedIngredients.map((ing, i) => (
                <View key={i} style={styles.ingredientPill}>
                  <Text style={styles.ingredientPillText}>{ing}</Text>
                  <TouchableOpacity onPress={() => handleRemoveIngredient(ing)}>
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            
            {(excludedIngredients.length > 0 || duration !== 60 || selectedCategory !== '' || sortBy !== 'newest') && (
              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: '#ccc', marginBottom: 10 }]}
                onPress={() => {
                  setExcludedIngredients([]);
                  setDuration(60);
                  setSelectedCategory('');
                  setSortBy('newest');
                  setIngredientInput('');
                  setFilterVisible(false);
                }}
              >
                <Text style={[styles.applyBtnText, { color: '#333' }]}>Limpiar filtros</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.applyBtn} onPress={() => setFilterVisible(false)}>
              <Text style={styles.applyBtnText}>Aplicar filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Colecciones */}
      <Modal visible={collectionModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💾 Guardar receta</Text>
              <View style={styles.modalHeaderButtons}>
                <TouchableOpacity onPress={fetchUserCollections} style={styles.refreshButton}>
                  <Ionicons name="refresh" size={20} color="#E2773C" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setCollectionModalVisible(false)} style={styles.closeModalButton}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {selectedRecipe && (
                <View style={styles.selectedRecipeInfo}>
                  <Image source={selectedRecipe.image ? { uri: selectedRecipe.image } : require('../../assets/french-toast.jpg')} style={styles.selectedRecipeImage} />
                  <Text style={styles.selectedRecipeTitle}>{selectedRecipe.title}</Text>
                </View>
              )}
              
              <Text style={styles.modalLabel}>⭐ Guardar en favoritos:</Text>
              <TouchableOpacity 
                style={styles.favoriteButton}
                onPress={() => selectedRecipe && handleSaveToggle(selectedRecipe.id, !isSaved)}
              >
                <Ionicons name="heart" size={20} color={isSaved ? '#fbbf24' : '#E2773C'} />
                <Text style={styles.favoriteButtonText}>{isSaved ? 'Quitar de favoritos' : 'Agregar a favoritos'}</Text>
              </TouchableOpacity>
              
              <Text style={styles.modalLabel}>📁 Guardar en colección:</Text>
              {loadingCollections ? (
                <View style={styles.loadingCollectionsContainer}>
                  <ActivityIndicator size="small" color="#E2773C" />
                  <Text style={styles.loadingCollectionsText}>Cargando colecciones...</Text>
                </View>
              ) : userCollections.length > 0 ? (
                <View style={styles.collectionsList}>
                  {userCollections.map(collection => (
                    <TouchableOpacity
                      key={collection.id}
                      style={styles.collectionItem}
                      onPress={() => selectedRecipe && handleSaveToCollection(selectedRecipe.id, collection.id)}
                    >
                      <Ionicons name="folder-outline" size={20} color="#E2773C" />
                      <Text style={styles.collectionItemText}>{collection.name || collection.displayName}</Text>
                      <Text style={styles.collectionItemCount}>({collection.recipeCount || 0} recetas)</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.noCollectionsContainer}>
                  <Ionicons name="folder-open-outline" size={32} color="#ccc" />
                  <Text style={styles.noCollectionsText}>No tienes colecciones</Text>
                  <Text style={styles.noCollectionsSubtext}>Crea una colección desde tu perfil</Text>
                  
                  <TouchableOpacity 
                    style={styles.goToProfileButton}
                    onPress={() => {
                      setCollectionModalVisible(false);
                      router.push('/(tabs)/profile');
                    }}
                  >
                    <Ionicons name="person-outline" size={20} color="#E2773C" />
                    <Text style={styles.goToProfileButtonText}>Ir al perfil</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.createCollectionContainer}>
                    <TextInput
                      style={styles.createCollectionInput}
                      placeholder="Nombre de la colección"
                      placeholderTextColor="#999"
                      value={newCollectionName}
                      onChangeText={setNewCollectionName}
                    />
                    <TouchableOpacity 
                      style={[styles.createCollectionButton, !newCollectionName.trim() && styles.createCollectionButtonDisabled]}
                      onPress={handleCreateCollection}
                      disabled={!newCollectionName.trim() || creatingCollection}
                    >
                      {creatingCollection ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.createCollectionButtonText}>Crear</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SaveRecipeModal
        visible={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        recipe={selectedRecipe}
        userId={userId}
        onSaved={(recipeId, isSaved) => {
          // Actualizar estado local
          const newSaved = { ...savedRecipes, [recipeId]: isSaved };
          setSavedRecipes(newSaved);
          AsyncStorage.setItem('@gloo:savedRecipes', JSON.stringify(newSaved));
          
          setShowSaveModal(false);
          if (global.refreshProfileFavorites) global.refreshProfileFavorites();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2773C',
    gap: 6,
  },
  suggestionText: {
    fontSize: 14,
    color: '#E2773C',
    fontWeight: '500',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 8,
  },
  deleteButton: {
    padding: 4,
  },
  categoriesContainer: {
    gap: 12,
    paddingRight: 20,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E2773C',
    gap: 8,
  },
  categoryPillActive: {
    backgroundColor: '#E2773C',
  },
  categoryText: {
    fontSize: 14,
    color: '#E2773C',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E2773C',
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeModalButton: {
    padding: 4,
  },
  refreshButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: '80%',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  sortOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2773C',
    gap: 6,
  },
  sortOptionActive: {
    backgroundColor: '#E2773C',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#E2773C',
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: '#fff',
  },
  durationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E2773C',
    textAlign: 'center',
    marginBottom: 16,
  },
  ingredientInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  ingredientInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  addIngredientBtn: {
    backgroundColor: '#E2773C',
    padding: 10,
    borderRadius: 8,
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  ingredientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2773C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  ingredientPillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  applyBtn: {
    backgroundColor: '#E2773C',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  recipeImageContainer: {
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  recipeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  profileOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  followCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  profileUser: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  profileTime: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  recipeInfo: {
    padding: 16,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  recipeDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  recipeIngredients: {
    fontSize: 13,
    color: '#E2773C',
    marginBottom: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeMetaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  saveButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  icon: {
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  selectedRecipeInfo: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedRecipeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedRecipeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2773C',
    gap: 8,
    marginBottom: 16,
  },
  favoriteButtonText: {
    color: '#E2773C',
    fontSize: 16,
    fontWeight: 'bold',
  },
  collectionsList: {
    maxHeight: 200,
  },
  collectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  collectionItemText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  collectionItemCount: {
    fontSize: 12,
    color: '#666',
  },
  loadingCollectionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  loadingCollectionsText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  noCollectionsContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noCollectionsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  noCollectionsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    marginBottom: 16,
  },
  createCollectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createCollectionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  createCollectionButton: {
    backgroundColor: '#E2773C',
    padding: 10,
    borderRadius: 8,
  },
  createCollectionButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createCollectionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  goToProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2773C',
    gap: 8,
    marginBottom: 16,
  },
  goToProfileButtonText: {
    color: '#E2773C',
    fontSize: 16,
    fontWeight: 'bold',
  },
});