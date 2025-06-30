import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Modal } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { API_CONFIG, buildApiUrl } from '../config/api';

const API_URL = buildApiUrl(API_CONFIG.ENDPOINTS.RECIPES);

export default function FinishScreen() {
  const { recipeId } = useLocalSearchParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const router = useRouter();
  const [favModalVisible, setFavModalVisible] = useState(false);

  useEffect(() => {
    if (recipeId) {
      fetch(`${API_URL}/${recipeId}`)
        .then(res => res.json())
        .then(data => {
          setRecipe(data.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [recipeId]);

  const handleRate = (value) => {
    setRating(value);
  };

  if (loading) {
    return <Text style={{ color: 'black', textAlign: 'center', marginTop: 40 }}>Cargando receta...</Text>;
  }

  return (
    <View style={styles.container}>
      <ConfettiCannon
        count={120}
        origin={{ x: -10, y: 0 }}
        explosionSpeed={400}
        fallSpeed={3000}
        fadeOut={true}
        autoStart
      />

      <Text style={styles.title}>{recipe?.title || '¡Receta finalizada!'}</Text>
      <Image
        source={require('../assets/gloofeliz.png')}
        style={{ width: 260, height: 260, alignSelf: 'center', marginVertical: 24 }}
        resizeMode="contain"
      />
      {recipe?.image && (
        <Image source={{ uri: recipe.image }} style={{ width: 220, height: 140, alignSelf: 'center', borderRadius: 16, marginBottom: 16 }} resizeMode="cover" />
      )}
      <Text style={styles.congrats}>🎉 ¡Felicidades! Has completado la receta. 🎉</Text>

      <Text style={styles.subtitle}>Share Your Opinion With Others</Text>

      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((i) => (
          <TouchableOpacity key={i} onPress={() => handleRate(i)}>
            <Ionicons
              name={i <= rating ? 'star' : 'star-outline'}
              size={32}
              color="#FF9800"
            />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.favButton} onPress={() => setFavModalVisible(true)}>
        <Text style={styles.favText}>Add To Favorites</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.recipesButton}
        onPress={() => router.push('/home')}
      >
        <Text style={styles.recipesText}>See More Recipes</Text>
      </TouchableOpacity>

      <Modal
        visible={favModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFavModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="star" size={60} color="#FFD700" style={{ marginBottom: 16 }} />
            <Text style={styles.modalTitle}>¡Receta añadida a favoritos!</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setFavModalVisible(false)}>
              <Text style={styles.modalButtonText}>OK</Text>
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
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#F9690E',
  },
  image: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
  },
  congrats: {
    fontFamily: 'DynaPuff',
    fontSize: 18,
    color: '#DE6E3C',
    fontWeight: 'bold',
    marginVertical: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  favButton: {
    backgroundColor: '#1B3DE2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: 16,
  },
  favText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  recipesButton: {
    backgroundColor: '#F9690E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  recipesText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F9690E',
    marginBottom: 18,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#F9690E',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginTop: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
