// SearchScreen con historial, sugerencias, búsqueda real y modales
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'vegan', label: 'Vegan' },
  { key: 'dessert', label: 'Dessert' },
];

const DUMMY_RECIPES = [
  {
    id: '1',
    user: 'facupotti',
    time: '15 months ago',
    title: 'Chicken Wings',
    description: 'A feast for the senses',
    duration: '20 min',
    servings: 4,
    likes: 4445,
    image: require('../assets/french-toast.jpg'),
    category: 'lunch',
  },
  {
    id: '2',
    user: 'nicki.nicole',
    time: '18 months ago',
    title: 'Teriyaki Chicken',
    description: 'Delicious and juicy',
    duration: '40 min',
    servings: 3,
    likes: 4445,
    image: require('../assets/french-toast.jpg'),
    category: 'lunch',
  },
  {
    id: '3',
    user: 'facu.potti',
    time: '18 months ago',
    title: 'Spring Rolls',
    description: 'Full of flavour',
    duration: '30 min',
    servings: 2,
    likes: 4445,
    image: require('../assets/french-toast.jpg'),
    category: 'lunch',
  },
  // ... add more recipes with different categories if needed ...
];

export default function SearchScreen() {
  const navigation = useNavigation();

  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [favoritesVisible, setFavoritesVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [excludedIngredients, setExcludedIngredients] = useState(['onion']);
  const [ingredientInput, setIngredientInput] = useState('');
  const [sortOption, setSortOption] = useState('new');
  const [duration, setDuration] = useState(30);
  const [searchHistory, setSearchHistory] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('lunch');
  const [likesState, setLikesState] = useState(
    DUMMY_RECIPES.reduce((acc, recipe) => {
      acc[recipe.id] = { likes: recipe.likes, liked: false };
      return acc;
    }, {})
  );
  const [followingState, setFollowingState] = useState(
    DUMMY_RECIPES.reduce((acc, recipe) => {
      acc[recipe.user] = false;
      return acc;
    }, {})
  );
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [savedRecipes, setSavedRecipes] = useState([]);

  const suggestions = ['sushi', 'sandwich', 'seafood', 'fried rice'];
  

  useEffect(() => {
    let filtered = DUMMY_RECIPES;
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    if (search.trim() !== '') {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    setResults(filtered);
  }, [search, selectedCategory]);

  const handleSearch = (text) => {
    setSearch(text);
  };

  const handleSubmitSearch = () => {
    if (search.trim() === '') return;
    setSearchHistory(prev => [search.trim(), ...prev.filter(item => item !== search.trim())]);
  };

  const handleDeleteHistoryItem = (item) => {
    setSearchHistory(prev => prev.filter(i => i !== item));
  };

  const handleAddIngredient = () => {
    const cleaned = ingredientInput.trim().toLowerCase();
    if (cleaned !== '' && !excludedIngredients.includes(cleaned)) {
      setExcludedIngredients([...excludedIngredients, cleaned]);
      setIngredientInput('');
    }
  };

  const handleRemoveIngredient = (item) => {
    setExcludedIngredients(excludedIngredients.filter(i => i !== item));
  };

  const openFavorites = (recipe) => {
    setSelectedRecipe(recipe);
    setFavoritesVisible(true);
  };

  const toggleFollow = (user) => {
    setFollowingState(prev => ({ ...prev, [user]: !prev[user] }));
  };

  const renderRecipe = ({ item }) => {
    const { likes, liked } = likesState[item.id] || { likes: item.likes, liked: false };
    return (
      <View style={[styles.recipeCard, { borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }]}>    
        {/* Imagen superior con perfil superpuesto */}
        <View>
          <Image source={item.image} style={styles.recipeImage} />

          {/* Sombra oscura completa */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', borderTopLeftRadius: 20, borderTopRightRadius: 20 }} />

          {/* Perfil centrado en columna */}
          <View style={{
            position: 'absolute',
            left: 16,
            bottom: 16,
            alignItems: 'center',
            flexDirection: 'column',
          }}>
            <View style={{ position: 'relative', alignItems: 'center' }}>
              <Image
                source={require('../assets/user.jpeg')}
                style={{ width: 54, height: 54, borderRadius: 27, borderWidth: 2, borderColor: 'white' }}
              />
              {/* Círculo azul con + o check, superpuesto */}
              <TouchableOpacity
                onPress={() => toggleFollow(item.user)}
                style={{
                  position: 'absolute',
                  left: '50%',
                  transform: [{ translateX: -11 }],
                  bottom: -11,
                  backgroundColor: followingState[item.user] ? '#D95F1E' : '#142E8B',
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: 'white',
                }}
              >
                <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
                  {followingState[item.user] ? '✓' : '+'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15, marginTop: 16 }}>@{item.user}</Text>
            <Text style={{ fontSize: 12, color: 'white', marginTop: 2 }}>{item.time}</Text>
          </View>
        </View>

        {/* Parte inferior blanca */}
        <View style={{ backgroundColor: 'white', padding: 16, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
          {/* Título y meta info derecha */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold', color: '#D95F1E', fontSize: 18, marginBottom: 0 }}>{item.title}</Text>
              <Text style={{ color: '#222', fontSize: 15, marginTop: 0 }}>{item.description}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
              <Text style={{ color: '#D95F1E', fontSize: 16, fontWeight: 'bold', marginRight: 2 }}>{item.servings}</Text>
              <Ionicons name="star" size={18} color="#D95F1E" style={{ marginRight: 8, marginLeft: 0 }} />
              <Ionicons name="time" size={18} color="#D95F1E" style={{ marginRight: 4 }} />
              <Text style={{ color: '#D95F1E', fontSize: 16, fontWeight: 'bold' }}>{item.duration}</Text>
            </View>
          </View>

          {/* Acciones */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 16,
          }}>
            {/* Grupo de acciones */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 18,
            }}>
              <TouchableOpacity
                style={{ alignItems: 'center', justifyContent: 'center' }}
                onPress={() => toggleLike(item.id)}
              >
                <Ionicons name="heart" size={28} color={liked ? '#D95F1E' : '#142E8B'} />
                <Text style={{
                  color: liked ? '#D95F1E' : '#142E8B',
                  fontWeight: 'bold',
                  fontSize: 15,
                  marginTop: 2,
                }}>{likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="chatbubble" size={28} color="#142E8B" />
                <Text style={{
                  color: '#142E8B',
                  fontWeight: 'bold',
                  fontSize: 15,
                  marginTop: 2,
                }}>64</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="share" size={28} color="#142E8B" />
                <Text style={{
                  color: '#142E8B',
                  fontWeight: 'bold',
                  fontSize: 15,
                  marginTop: 2,
                }}>Share</Text>
              </TouchableOpacity>
            </View>
            {/* Bookmark a la derecha */}
            <TouchableOpacity
              onPress={() => {
                if (savedRecipes.includes(item.id)) {
                  setSavedRecipes(prev => prev.filter(id => id !== item.id));
                } else {
                  openFavorites(item);
                }
              }}
            >
              <Ionicons
                name={savedRecipes.includes(item.id) ? 'bookmark' : 'bookmark-outline'}
                size={30}
                color={'#142E8B'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Find all results for the search term, regardless of category
  const allSearchResults = search.trim() !== '' ? DUMMY_RECIPES.filter(item => item.title.toLowerCase().includes(search.toLowerCase())) : [];
  // Results for the selected category
  const categoryResults = allSearchResults.filter(item => item.category === selectedCategory);

  const toggleLike = (id) => {
    setLikesState(prev => {
      const recipe = prev[id];
      if (!recipe) return prev;
      const liked = !recipe.liked;
      const likes = liked ? recipe.likes + 1 : recipe.likes - 1;
      return { ...prev, [id]: { likes, liked } };
    });
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={styles.searchBarContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} />
        </TouchableOpacity>
        <View style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginVertical: 12,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#D95F1E',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 30,
              width: 200,
              alignSelf: 'center',
            }}>
              <Ionicons name="search" size={20} color="white" style={{ marginRight: 8 }} />
              <TextInput
                style={{
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 18,
                  flex: 1,
                  maxWidth: 100,
                  paddingVertical: 0,
                }}
                placeholder="Search..."
                placeholderTextColor="#eee"
                value={search}
                onChangeText={handleSearch}
                onSubmitEditing={handleSubmitSearch}
                numberOfLines={1}
                ellipsizeMode="tail"
              />
              {search.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearch('')}
                  style={{
                    marginLeft: 4,
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: 'white',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={16} color="#D95F1E" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={() => setFilterVisible(true)} style={{ marginLeft: 16 }}>
              <Ionicons name="filter" size={28} color="#D95F1E" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 1. Show search history and suggestions only if no search has been performed (search is empty) */}
      {search.trim() === '' && (
        <>
          {searchHistory.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Recent searches</Text>
              {searchHistory.map((item, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <TouchableOpacity onPress={() => setSearch(item)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="time-outline" size={16} color="#999" style={{ marginRight: 6 }} />
                    <Text>{item}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteHistoryItem(item)}>
                    <Feather name="x" size={16} color="#999" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={{ marginVertical: 20 }}>
            <Text style={{ color: 'orangered', fontWeight: 'bold', marginBottom: 10 }}>Search suggestions</Text>
            <View style={styles.tagsContainer}>
              {suggestions.map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.tag} onPress={() => handleSearch(item)}>
                  <Text>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}

      {/* 2. After a search, if there are results in any category, show categories and recipe cards or category-specific no results */}
      {search.trim() !== '' && allSearchResults.length > 0 && (
        <>
          {/* Category Tab Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 4 }}
          >
            {CATEGORIES.map(cat => {
              const isSelected = selectedCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={{
                    marginRight: 18,
                    paddingHorizontal: 10,
                    paddingVertical: 2,
                    borderRadius: 16,
                    backgroundColor: isSelected ? '#D95F1E' : 'transparent',
                    alignSelf: 'flex-start',
                  }}
                  onPress={() => setSelectedCategory(cat.key)}
                  activeOpacity={0.7}
                >
                  <Text style={{
                    color: isSelected ? 'white' : '#D95F1E',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    fontSize: 15,
                  }}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {/* Recipe Cards or category-specific no results */}
          {categoryResults.length > 0 ? (
            <FlatList
              data={categoryResults}
              renderItem={renderRecipe}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 150, paddingTop: 0, marginTop: 0 }}
            />
          ) : (
            <View style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'flex-start',
              marginTop: 60,
            }}>
              <Text style={{ color: 'gray', fontSize: 16 }}>
                No recipes found for "{search}" in this category.
              </Text>
            </View>
          )}
        </>
      )}

      {/* 3. After a search, if there are no results in any category, show the generic no results message */}
      {search.trim() !== '' && allSearchResults.length === 0 && (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Text style={{ color: 'gray', fontSize: 16 }}>
            No recipes found for "{search}".
          </Text>
        </View>
      )}
      
    {/*FILTROS*/}
      <Modal visible={filterVisible} transparent animationType="slide">
        <View style={styles.bottomSheetOverlay}>
          <View style={styles.bottomSheetContainer}>
            <Text style={styles.modalTitle}>Add a Filter</Text>

            <Text style={styles.sectionTitle}>Exclude Ingredients</Text>

            <View style={styles.ingredientInputContainer}>
              <TextInput
                style={styles.ingredientInput}
                value={ingredientInput}
                placeholder="Onion"
                placeholderTextColor="#ccc"
                onChangeText={setIngredientInput}
              />
              <TouchableOpacity onPress={handleAddIngredient}>
                <Ionicons name="add-circle" size={22} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.chipRow}>
              {excludedIngredients.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.chipSelected}
                  onPress={() => handleRemoveIngredient(item)}
                >
                  <Text style={{ color: 'white' }}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Sort</Text>

            <View style={styles.chipRow}>
              {[{ key: 'new', label: 'newly listed' }, { key: 'latest', label: 'latest listed' }, { key: 'username', label: 'username' }].map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.chip, sortOption === key && styles.chipSelected]}
                  onPress={() => setSortOption(key)}
                >
                  <Text style={{ color: sortOption === key ? 'white' : '#333' }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>
              Cooking Duration <Text style={styles.subtitle}>(in minutes)</Text>
            </Text>

            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0}
              maximumValue={60}
              step={5}
              minimumTrackTintColor="orangered"
              maximumTrackTintColor="#eee"
              thumbTintColor="orangered"
              value={duration}
              onValueChange={setDuration}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={[styles.subtitle, { color: 'tomato' }]}>{'<10'}</Text>
              <Text style={[styles.subtitle, { fontWeight: 'bold', fontSize: 14 }]}>{duration} min</Text>
              <Text style={[styles.subtitle, { color: 'gray' }]}>{'>60'}</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setFilterVisible(false)} style={[styles.cancelButton, { backgroundColor: '#FBE18D' }]}> 
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFilterVisible(false)} style={[styles.doneButton, { backgroundColor: '#142E8B' }]}> 
                <Text style={{ color: 'white' }}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={favoritesVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add to Favorites</Text>

            {/* New Collection */}
            <TouchableOpacity
              style={styles.newCollectionButton}
              onPress={() => setCreateModalVisible(true)}
            >
              <Text style={styles.newCollectionText}>+  New Collection</Text>
            </TouchableOpacity>

            {/* Colecciones existentes */}
            <View style={styles.favoriteCollections}>
              {[{ name: 'Salty', image: require('../assets/french-toast.jpg') }, { name: 'Sweet', image: require('../assets/french-toast.jpg') }].map((col, idx) => (
                <View style={styles.collectionRow} key={col.name}>
                  <Image source={col.image} style={styles.collectionImage} />
                  <TouchableOpacity
                    style={[
                      styles.collectionLabel,
                      selectedCollection === col.name && { backgroundColor: '#D95F1E', borderColor: '#D95F1E' }
                    ]}
                    onPress={() => setSelectedCollection(selectedCollection === col.name ? null : col.name)}
                  >
                    <Text style={{
                      color: selectedCollection === col.name ? 'white' : '#D95F1E',
                      fontSize: 15,
                      fontWeight: 'bold',
                    }}>{col.name}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Botones */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setFavoritesVisible(false)}
                style={[styles.cancelButton, { backgroundColor: '#FBE18D' }]}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setFavoritesVisible(false);
                  if (selectedRecipe && selectedCollection) {
                    setSavedRecipes(prev => prev.includes(selectedRecipe.id) ? prev : [...prev, selectedRecipe.id]);
                  }
                }}
                style={[styles.doneButton, { backgroundColor: '#142E8B' }]}
              >
                <Text style={{ color: 'white' }}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={createModalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>New Collection</Text>

            <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Collection name"
              placeholderTextColor="#888"
              value={newCollectionName}
              onChangeText={setNewCollectionName}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: '#FBE18D' }]}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.doneButton, { backgroundColor: '#F4843B' }]}
                onPress={() => {
                  console.log('Nueva colección:', newCollectionName);
                  setCreateModalVisible(false);
                  setNewCollectionName('');
                }}
              >
                <Text style={{ color: 'white' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#E5E5E5',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 10,
    fontSize: 14,
    color: '#333'
  },
  newCollectionButton: {
    backgroundColor: '#F4843B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignSelf: 'flex-start',
    marginBottom: 20,
    marginLeft: 5,
  },

  newCollectionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },

  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginLeft: 5,
  },

  collectionImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 10,
  },

  collectionLabel: {
    borderWidth: 1,
    borderColor: '#D95F1E',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },

  // Y agregá este estilo al texto si no lo tenés separado:

  collectionLabelText: {
    color: '#D95F1E',
    fontSize: 15,
    fontWeight: 'bold',
  },
  favoritesPopupContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 24,
    alignItems: 'center'
  },
  newCollectionButton: {
    flexDirection: 'row',
    backgroundColor: '#F4843B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    marginVertical: 12
  },
  collectionList: {
    width: '100%',
    marginTop: 10,
    marginBottom: 20
  },
  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  collectionImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12
  },
  collectionPill: {
    borderWidth: 1,
    borderColor: '#F4843B',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6
  },
  cancelButton: {
    padding: 12,
    borderRadius: 12,
    width: '45%',
    alignItems: 'center',
    backgroundColor: '#FBE18D'
  },
  doneButton: {
    padding: 12,
    borderRadius: 12,
    width: '45%',
    alignItems: 'center',
    backgroundColor: '#142E8B'
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16
  },
  searchBarPill: {
    flexDirection: 'row',
    backgroundColor: '#F4843B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
    alignItems: 'center',
    flex: 1
  },
  pillText: {
    color: 'white',
    fontWeight: 'bold'
  },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  tag: { backgroundColor: '#FBE18D', padding: 10, borderRadius: 20 },
  recipeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  recipeImage: {
    width: '100%',
    height: 180,
  },
  recipeContent: {
    padding: 12,
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userAvatar: {
    width: 35,
    height: 35,
    borderRadius: 20,
    marginRight: 10,
  },
  recipeUser: {
    fontWeight: 'bold',
    color: '#142E8B',
  },
  recipeTime: {
    fontSize: 12,
    color: '#999',
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  recipeDescription: {
    fontSize: 13,
    color: '#555',
    marginBottom: 10,
  },
  recipeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  recipeActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end', // 👈 Esto lo manda abajo
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingBottom: 30,
    width: '100%',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#F4843B',
    textAlign: 'center',
    marginBottom: 10
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 4
  },
  subtitle: {
    fontSize: 13,
    color: 'gray',
    fontWeight: '400',
  },
  cancelButton: { padding: 12, borderRadius: 12, width: '45%', alignItems: 'center' },
  doneButton: { padding: 12, borderRadius: 12, width: '45%', alignItems: 'center' },
  favoriteCollections: {
    flexDirection: 'column',
    gap: 10, // antes 16
    marginVertical: 16,
  },

  collectionItem: { padding: 10, borderWidth: 1, borderRadius: 10 },
  ingredientInputContainer: {
    backgroundColor: '#999',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 10
  },
  ingredientInput: {
    flex: 1,
    paddingVertical: 8,
    color: 'white'
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12
  },
  chip: {
    backgroundColor: '#eee',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 40,
    marginBottom: 6
  },
  chipSelected: {
    backgroundColor: '#F4843B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 40,
    marginBottom: 6
  },
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  bottomSheetContainer: {
    width: '100%',
    height: '67%',
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
    justifyContent: 'space-between'
  }
});
