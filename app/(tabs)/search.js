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
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://gloo-api-production.up.railway.app/api/v1';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [popularCategories, setPopularCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const { isSignedIn } = useAuth();
  const router = useRouter();

  // Cargar historial de búsqueda al montar
  useEffect(() => {
    loadSearchHistory();
    loadPopularCategories();
  }, []);

  // Funciones para manejar búsqueda localmente
  const saveSearchHistory = async (history) => {
    try {
      await AsyncStorage.setItem('@gloo:searchHistory', JSON.stringify(history));
    } catch (error) {
      console.log('Error saving search history:', error);
    }
  };

  const loadSearchHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('@gloo:searchHistory');
      const history = savedHistory ? JSON.parse(savedHistory) : [];
      setSearchHistory(history);
      setRecentSearches(history.slice(0, 5)); // Mostrar solo los últimos 5
    } catch (error) {
      console.log('Error loading search history:', error);
    }
  };

  const loadPopularCategories = async () => {
    try {
      const savedCategories = await AsyncStorage.getItem('@gloo:popularCategories');
      if (savedCategories) {
        setPopularCategories(JSON.parse(savedCategories));
      } else {
        // Categorías por defecto
        const defaultCategories = [
          { id: 1, name: 'Pasta', icon: '🍝', count: 45 },
          { id: 2, name: 'Pizza', icon: '🍕', count: 32 },
          { id: 3, name: 'Ensaladas', icon: '🥗', count: 28 },
          { id: 4, name: 'Postres', icon: '🍰', count: 25 },
          { id: 5, name: 'Sopas', icon: '🍲', count: 20 },
          { id: 6, name: 'Carnes', icon: '🥩', count: 35 },
        ];
        setPopularCategories(defaultCategories);
        await AsyncStorage.setItem('@gloo:popularCategories', JSON.stringify(defaultCategories));
      }
    } catch (error) {
      console.log('Error loading popular categories:', error);
    }
  };

  // Función de búsqueda
  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);

    // Agregar a historial
    const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    await saveSearchHistory(newHistory);

    try {
      // Intentar búsqueda en backend
      const response = await fetch(`${API_URL}/recipes/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.recipes || data.data || []);
      } else {
        // Si falla, buscar en recetas locales
        await searchLocally(query);
      }
    } catch (error) {
      console.log('Search failed, using local search:', error);
      await searchLocally(query);
    } finally {
      setLoading(false);
    }
  };

  // Búsqueda local
  const searchLocally = async (query) => {
    try {
      const savedRecipes = await AsyncStorage.getItem('@gloo:allRecipes');
      if (savedRecipes) {
        const recipes = JSON.parse(savedRecipes);
        const filtered = recipes.filter(recipe => 
          recipe.title?.toLowerCase().includes(query.toLowerCase()) ||
          recipe.description?.toLowerCase().includes(query.toLowerCase()) ||
          recipe.ingredients?.some(ing => ing.name?.toLowerCase().includes(query.toLowerCase()))
        );
        setSearchResults(filtered);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.log('Local search failed:', error);
      setSearchResults([]);
    }
  };

  // Buscar por categoría
  const searchByCategory = (category) => {
    setSearchQuery(category);
    performSearch(category);
  };

  // Buscar desde historial
  const searchFromHistory = (query) => {
    setSearchQuery(query);
    performSearch(query);
  };

  // Renderizar resultado de búsqueda
  const renderSearchResult = ({ item }) => (
    <TouchableOpacity 
      style={styles.resultItem}
      onPress={() => router.push({
        pathname: '/(tabs)/recipe',
        params: { post: JSON.stringify(item) }
      })}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.resultImage}
        defaultSource={require('../../assets/french-toast.jpg')}
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle}>{item.title}</Text>
        <Text style={styles.resultDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.resultMeta}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.resultTime}>{item.estimatedTime} min</Text>
          <Ionicons name="star" size={14} color="#666" />
          <Text style={styles.resultRating}>{item.rates || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Renderizar categoría popular
  const renderCategory = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryItem}
      onPress={() => searchByCategory(item.name)}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text style={styles.categoryName}>{item.name}</Text>
      <Text style={styles.categoryCount}>{item.count} recetas</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buscar</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar recetas, ingredientes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => performSearch(searchQuery)}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F9690E" />
          <Text style={styles.loadingText}>Buscando...</Text>
        </View>
      )}

      {searchQuery.length === 0 ? (
        <View style={styles.content}>
          {/* Búsquedas recientes */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Búsquedas recientes</Text>
              {recentSearches.map((query, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.recentItem}
                  onPress={() => searchFromHistory(query)}
                >
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.recentText}>{query}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Categorías populares */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categorías populares</Text>
            <FlatList
              data={popularCategories}
              renderItem={renderCategory}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            />
          </View>
        </View>
      ) : (
        /* Resultados de búsqueda */
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.resultsContainer}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No se encontraron resultados</Text>
                <Text style={styles.emptySubtext}>Intenta con otros términos</Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  categoriesContainer: {
    paddingRight: 20,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    minWidth: 80,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
  },
  resultsContainer: {
    paddingHorizontal: 20,
  },
  resultItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  resultInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resultDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultTime: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    marginRight: 12,
  },
  resultRating: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
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
  },
});