import AsyncStorage from '@react-native-async-storage/async-storage';

// Clave para almacenar favoritos por usuario
const getFavoritesKey = (userId) => `@gloo:favorites:${userId}`;

// Función para agregar una receta a favoritos
export const addToFavorites = async (userId, recipe) => {
  try {
    const key = getFavoritesKey(userId);
    const existingFavorites = await AsyncStorage.getItem(key);
    let favorites = existingFavorites ? JSON.parse(existingFavorites) : [];
    
    // Verificar si la receta ya existe
    const recipeExists = favorites.find(fav => fav.id === recipe.id);
    if (!recipeExists) {
      favorites.push(recipe);
      await AsyncStorage.setItem(key, JSON.stringify(favorites));
      console.log('Recipe added to favorites:', recipe.title);
      return true;
    } else {
      console.log('Recipe already in favorites:', recipe.title);
      return false;
    }
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return false;
  }
};

// Función para remover una receta de favoritos
export const removeFromFavorites = async (userId, recipeId) => {
  try {
    const key = getFavoritesKey(userId);
    const existingFavorites = await AsyncStorage.getItem(key);
    if (existingFavorites) {
      let favorites = JSON.parse(existingFavorites);
      favorites = favorites.filter(fav => fav.id !== recipeId);
      await AsyncStorage.setItem(key, JSON.stringify(favorites));
      console.log('Recipe removed from favorites:', recipeId);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return false;
  }
};

// Función para obtener todas las recetas favoritas
export const getFavorites = async (userId) => {
  try {
    const key = getFavoritesKey(userId);
    const existingFavorites = await AsyncStorage.getItem(key);
    if (existingFavorites) {
      const favorites = JSON.parse(existingFavorites);
      console.log('Favorites loaded:', favorites.length, 'recipes');
      return favorites;
    }
    return [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

// Función para verificar si una receta está en favoritos
export const isRecipeFavorite = async (userId, recipeId) => {
  try {
    const key = getFavoritesKey(userId);
    const existingFavorites = await AsyncStorage.getItem(key);
    if (existingFavorites) {
      const favorites = JSON.parse(existingFavorites);
      return favorites.some(fav => fav.id === recipeId);
    }
    return false;
  } catch (error) {
    console.error('Error checking if recipe is favorite:', error);
    return false;
  }
};

// Función para sincronizar favoritos con el estado de guardado
export const syncFavoritesWithSavedState = async (userId, savedRecipes) => {
  try {
    const favorites = await getFavorites(userId);
    const favoritesMap = {};
    favorites.forEach(fav => {
      favoritesMap[fav.id] = true;
    });
    
    // Combinar con savedRecipes existentes
    const combinedSaved = { ...savedRecipes, ...favoritesMap };
    await AsyncStorage.setItem('@gloo:savedRecipes', JSON.stringify(combinedSaved));
    console.log('Favorites synced with saved state');
    return combinedSaved;
  } catch (error) {
    console.error('Error syncing favorites with saved state:', error);
    return savedRecipes;
  }
};

// Función para refrescar favoritos en el perfil
export const refreshProfileFavorites = () => {
  if (typeof global !== 'undefined' && global.refreshProfileFavorites) {
    global.refreshProfileFavorites();
    console.log('Profile favorites refreshed');
  }
};

// Función para limpiar favoritos (útil para logout)
export const clearFavorites = async (userId) => {
  try {
    const key = getFavoritesKey(userId);
    await AsyncStorage.removeItem(key);
    console.log('Favorites cleared for user:', userId);
  } catch (error) {
    console.error('Error clearing favorites:', error);
  }
};

// --- COLECCIONES PERSONALIZADAS (SOLO FRONTEND) ---

const getCollectionsKey = (userId) => `@gloo:collections:${userId}`;

// Obtener todas las colecciones personalizadas
export const getCustomCollections = async (userId) => {
  try {
    const key = getCollectionsKey(userId);
    const collections = await AsyncStorage.getItem(key);
    return collections ? JSON.parse(collections) : [];
  } catch (error) {
    console.error('Error getting custom collections:', error);
    return [];
  }
};

// Crear una nueva colección personalizada
export const createCustomCollection = async (userId, name, displayName, backendId = null) => {
  try {
    const key = getCollectionsKey(userId);
    let collections = await getCustomCollections(userId);
    // Normaliza el nombre para comparar igual que el backend
    const normalizedName = name.toLowerCase().replace(/\s+/g, '-');
    const existingIdx = collections.findIndex(c => (c.name && c.name.toLowerCase().replace(/\s+/g, '-') === normalizedName));
    if (existingIdx !== -1) {
      if (backendId && collections[existingIdx].id !== backendId) {
        collections[existingIdx].id = backendId;
        await AsyncStorage.setItem(key, JSON.stringify(collections));
        return collections[existingIdx];
      }
      return collections[existingIdx];
    }
    // Si no existe, créala
    const newCollection = {
      id: backendId || Date.now().toString(),
      name: normalizedName,
      displayName: displayName || name,
      recipes: [],
      createdAt: new Date().toISOString(),
    };
    collections.push(newCollection);
    await AsyncStorage.setItem(key, JSON.stringify(collections));
    return newCollection;
  } catch (error) {
    console.error('Error creating custom collection:', error);
    return false;
  }
};

// Guardar receta en una colección personalizada
export const addRecipeToCustomCollection = async (userId, collectionId, recipe) => {
  try {
    const key = getCollectionsKey(userId);
    let collections = await getCustomCollections(userId);
    const idx = collections.findIndex(c => c.id == collectionId);
    if (idx === -1) {
      console.log('DEBUG: Colección no encontrada en local', { collectionId, collections });
      return false;
    }
    // Evitar duplicados
    if (collections[idx].recipes.some(r => r.id == recipe.id)) {
      console.log('DEBUG: Receta ya existe en la colección', { recipeId: recipe.id, collection: collections[idx] });
      return false;
    }
    // Asegurar que la receta tenga todos los datos necesarios
    const safeRecipe = {
      id: recipe.id,
      title: recipe.title || 'Sin título',
      description: recipe.description || 'Sin descripción',
      imageUrl: recipe.imageUrl || recipe.image || '',
      image: recipe.image || recipe.imageUrl || '',
      averageRating: recipe.averageRating || recipe.rating || 4.2,
      estimatedTime: recipe.estimatedTime || recipe.duration || 30,
      user: recipe.user ? {
        id: recipe.user.id || '',
        username: recipe.user.username || '',
        imageUrl: recipe.user.imageUrl || ''
      } : null,
    };
    collections[idx].recipes.push(safeRecipe);
    await AsyncStorage.setItem(key, JSON.stringify(collections));
    console.log('DEBUG: Receta agregada correctamente a la colección', { collectionId, recipeId: recipe.id });
    return true;
  } catch (error) {
    console.error('Error adding recipe to custom collection:', error);
    return false;
  }
};

// Obtener recetas de una colección personalizada
export const getRecipesFromCustomCollection = async (userId, collectionId) => {
  try {
    const collections = await getCustomCollections(userId);
    const col = collections.find(c => c.id === collectionId);
    return col ? col.recipes : [];
  } catch (error) {
    console.error('Error getting recipes from custom collection:', error);
    return [];
  }
};

// Eliminar receta de una colección personalizada y eliminar la colección si queda vacía
export const removeRecipeFromCustomCollection = async (userId, collectionId, recipeId) => {
  try {
    const key = getCollectionsKey(userId);
    let collections = await getCustomCollections(userId);
    const idx = collections.findIndex(c => c.id === collectionId);
    if (idx === -1) return false;
    collections[idx].recipes = collections[idx].recipes.filter(r => r.id !== recipeId);
    // Si la colección queda vacía, eliminarla
    if (collections[idx].recipes.length === 0) {
      collections.splice(idx, 1);
    }
    await AsyncStorage.setItem(key, JSON.stringify(collections));
    return true;
  } catch (error) {
    console.error('Error removing recipe from custom collection:', error);
    return false;
  }
};

// Eliminar una colección personalizada
export const deleteCustomCollection = async (userId, collectionId) => {
  try {
    const key = getCollectionsKey(userId);
    let collections = await getCustomCollections(userId);
    collections = collections.filter(c => c.id !== collectionId);
    await AsyncStorage.setItem(key, JSON.stringify(collections));
    return true;
  } catch (error) {
    console.error('Error deleting custom collection:', error);
    return false;
  }
}; 