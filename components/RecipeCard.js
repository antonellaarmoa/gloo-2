import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function RecipeCard({ recipe, onPress, onEdit, isOwner = false }) {
  // Obtener rating promedio de diferentes posibles campos del backend
  const getRating = () => {
    const rating = recipe.averageRating || recipe.rating || recipe.stats?.averageRating || 0;
    return rating > 0 ? rating.toFixed(1) : '4.2';
  };
  
  // Obtener tiempo estimado del backend o usar tiempo por defecto
  const getCookingTime = () => {
    const cookingTime = recipe.estimatedTime || recipe.cookingTime || recipe.duration || 20;
    return cookingTime > 0 ? `${cookingTime}min` : '20min';
  };

  // Obtener contador de comentarios del backend
  const getCommentCount = () => {
    return recipe.comments || recipe.stats?.comments || 0;
  };

  // Obtener contador de likes del backend
  const getLikeCount = () => {
    return recipe.likes || recipe.stats?.likes || 0;
  };

  // Obtener imagen de la receta
  const getRecipeImage = () => {
    console.log('Imagen de la receta:', recipe.image);
    if (recipe.image && recipe.image !== 'null' && recipe.image !== '') {
      return { uri: recipe.image };
    }
    if (recipe.media && recipe.media !== 'null' && recipe.media !== '') {
      return { uri: recipe.media };
    }
    if (recipe.imageUrl && recipe.imageUrl !== 'null' && recipe.imageUrl !== '') {
      return { uri: recipe.imageUrl };
    }
    // Solo usar imagen genérica si no hay ninguna imagen disponible
    return require('../assets/hamburguesa.png');
  };

  const [imageError, setImageError] = React.useState(false);

  const handleEditPress = (e) => {
    e.stopPropagation(); // Evitar que se active el onPress de la card
    if (onEdit) {
      onEdit(recipe);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={imageError ? require('../assets/hamburguesa.png') : getRecipeImage()} style={styles.image} onError={() => setImageError(true)} />
        {isOwner && (
          <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
            <Ionicons name="pencil" size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
        {recipe.title || 'Sin título'}
      </Text>
      <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
        {recipe.description || 'Sin descripción'}
      </Text>
      <View style={styles.footer}>
        <View style={styles.metaItem}>
          <Ionicons name="star" size={12} color="#fbbf24" />
          <Text style={styles.meta}>{getRating()}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={12} color="#E2773C" />
          <Text style={styles.meta}>{getCookingTime()}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="heart-outline" size={12} color="#ef4444" />
          <Text style={styles.meta}>{getLikeCount()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: width / 2 - 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    elevation: 4,
    minHeight: 200,
    maxHeight: 200,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 90,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  editButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontWeight: 'bold',
    marginTop: 6,
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#222',
  },
  description: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Inter',
    marginTop: 2,
    lineHeight: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  meta: {
    fontSize: 11,
    color: '#E2773C',
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
});
