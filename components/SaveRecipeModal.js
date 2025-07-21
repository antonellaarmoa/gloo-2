import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCustomCollections, createCustomCollection, addRecipeToCustomCollection, isRecipeFavorite, addToFavorites, removeFromFavorites } from '../utils/favoritesManager';
import { API_URLS } from '../config/api';

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

export default function SaveRecipeModal({ visible, onClose, recipe, userId, onSaved }) {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (visible && userId) {
      const loadData = async () => {
        try {
          const cols = await getCustomCollections(userId);
          // Filtrar la colección Favoritos
          setCollections(cols.filter(col => col.name.toLowerCase() !== 'favoritos'));
          setSelectedCollection(null);
          setNewCollectionName('');
          await checkFavorite();
        } catch (error) {
          console.error('Error loading modal data:', error);
          setCollections([]);
        }
      };
      
      loadData();
    }
    // eslint-disable-next-line
  }, [visible, userId, recipe]);

  const checkFavorite = async () => {
    if (userId && recipe) {
      try {
        const fav = await isRecipeFavorite(userId, recipe.id);
        setIsFavorite(fav);
        console.log('Recipe favorite status:', recipe.title, fav);
      } catch (error) {
        console.error('Error checking favorite status:', error);
        setIsFavorite(false);
      }
    }
  };

  const handleToggleFavorite = async () => {
    setSavingRecipe(true);
    try {
      if (isFavorite) {
        // Remover de favoritos
        const localRemoved = await removeFromFavorites(userId, recipe.id);
        const backendRemoved = await makeApiRequest(API_URLS.FAVORITES.REMOVE(userId), {
          method: 'DELETE',
          body: JSON.stringify({ recipeId: recipe.id }),
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (localRemoved || backendRemoved.success) {
          setIsFavorite(false);
          if (onSaved) onSaved(recipe.id, false);
          console.log('Recipe removed from favorites:', recipe.title);
        }
      } else {
        // Agregar a favoritos
        const localAdded = await addToFavorites(userId, recipe);
        const backendAdded = await makeApiRequest(API_URLS.FAVORITES.ADD(userId), {
          method: 'POST',
          body: JSON.stringify({ recipeId: recipe.id }),
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (localAdded || backendAdded.success) {
          setIsFavorite(true);
          if (onSaved) onSaved(recipe.id, true);
          console.log('Recipe added to favorites:', recipe.title);
        }
      }
      
      // Refrescar perfil
      if (global.refreshProfileFavorites) {
        global.refreshProfileFavorites();
      }
      
      onClose();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'No se pudo actualizar favoritos');
    } finally {
      setSavingRecipe(false);
    }
  };

  const handleSaveToCollection = async (collectionId) => {
    setSavingRecipe(true);
    try {
      // Guardar en colección local
      const localSaved = await addRecipeToCustomCollection(userId, collectionId, recipe);
      
      // También agregar a favoritos backend
      const backendSaved = await makeApiRequest(API_URLS.FAVORITES.ADD(userId), {
        method: 'POST',
        body: JSON.stringify({ recipeId: recipe.id }),
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (localSaved || backendSaved.success) {
        setIsFavorite(true);
        if (onSaved) onSaved(recipe.id, true);
        console.log('Recipe saved to collection:', recipe.title);
      }
      
      // Refrescar perfil
      if (global.refreshProfileFavorites) {
        global.refreshProfileFavorites();
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving to collection:', error);
      Alert.alert('Error', 'No se pudo guardar en la colección');
    } finally {
      setSavingRecipe(false);
    }
  };

  const handleCreateCollectionAndSave = async () => {
    if (!newCollectionName.trim()) return;
    setSavingRecipe(true);
    try {
      // Crear colección en backend
      const res = await makeApiRequest(API_URLS.COLLECTIONS.CREATE(userId), {
        method: 'POST',
        body: JSON.stringify({ name: newCollectionName.trim(), icon: 'folder', color: '#E2773C', description: '', isPublic: 'false' }),
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (res.success && res.data && res.data.data && res.data.data.id) {
        // Crear colección local
        const localCollection = await createCustomCollection(userId, newCollectionName.trim(), newCollectionName.trim(), res.data.data.id);
        
        if (localCollection) {
          // Guardar receta en la nueva colección
          await handleSaveToCollection(res.data.data.id);
          console.log('Collection created and recipe saved:', newCollectionName);
        }
      } else {
        throw new Error('Failed to create collection');
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      Alert.alert('Error', 'No se pudo crear la colección');
    } finally {
      setSavingRecipe(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Guardar receta</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#E2773C" />
          </TouchableOpacity>
          <ScrollView style={{ maxHeight: 300 }}>
            <Text style={styles.sectionTitle}>⭐ Guardar en favoritos:</Text>
            <TouchableOpacity style={[styles.favoriteButton, isFavorite && { backgroundColor: '#fffbe6', borderColor: '#fbbf24' }]} onPress={handleToggleFavorite} disabled={savingRecipe}>
              <Ionicons name={isFavorite ? 'bookmark' : 'bookmark-outline'} size={20} color={isFavorite ? '#fbbf24' : '#E2773C'} />
              <Text style={[styles.favoriteButtonText, isFavorite && { color: '#fbbf24' }]}>{isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>📁 Guardar en colección:</Text>
            {collections.map(collection => (
              <TouchableOpacity
                key={collection.id}
                style={[styles.collectionItem, selectedCollection === collection.id && styles.collectionItemSelected]}
                onPress={() => setSelectedCollection(collection.id)}
              >
                <Text style={styles.collectionName}>{collection.displayName || collection.name}</Text>
                {selectedCollection === collection.id && <Ionicons name="checkmark-circle" size={20} color="#E2773C" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.collectionItem, selectedCollection === 'new' && styles.collectionItemSelected]}
              onPress={() => setSelectedCollection('new')}
            >
              <Text style={styles.collectionName}>+ Crear nueva colección</Text>
              {selectedCollection === 'new' && <Ionicons name="checkmark-circle" size={20} color="#E2773C" />}
            </TouchableOpacity>
            {selectedCollection === 'new' && (
              <View style={styles.newCollectionInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre de la colección"
                  value={newCollectionName}
                  onChangeText={setNewCollectionName}
                  maxLength={50}
                />
              </View>
            )}
          </ScrollView>
          <TouchableOpacity
            style={[styles.saveButton, (!selectedCollection || (selectedCollection === 'new' && !newCollectionName.trim()) || savingRecipe) && styles.saveButtonDisabled]}
            onPress={() => {
              if (selectedCollection === 'new') {
                handleCreateCollectionAndSave();
              } else if (selectedCollection) {
                handleSaveToCollection(selectedCollection);
              }
            }}
            disabled={!selectedCollection || (selectedCollection === 'new' && !newCollectionName.trim()) || savingRecipe}
          >
            {savingRecipe ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Guardar</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E2773C',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E2773C',
    marginTop: 16,
    marginBottom: 8,
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7f2',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2773C',
  },
  favoriteButtonText: {
    color: '#E2773C',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  collectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#f8f8f8',
  },
  collectionItemSelected: {
    borderColor: '#E2773C',
    borderWidth: 2,
    backgroundColor: '#fff7f2',
  },
  collectionName: {
    flex: 1,
    color: '#E2773C',
    fontWeight: 'bold',
  },
  newCollectionInputContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2773C',
    borderRadius: 8,
    padding: 8,
    width: 220,
  },
  saveButton: {
    backgroundColor: '#E2773C',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 18,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 