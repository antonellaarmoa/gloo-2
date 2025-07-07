import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Modal } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { API_CONFIG, buildApiUrl } from '../config/api';
import RatingStars from '../components/RatingStars';

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

      <RatingStars
        recipeId={recipeId}
        size={32}
        showCount={true}
        showAverage={true}
        interactive={true}
        onRatingChange={(rating, stats) => {
          console.log('Rating submitted:', rating, stats);
        }}
      />

      <TouchableOpacity
        style={styles.recipesButton}
        onPress={() => router.push('/home')}
      >
        <Text style={styles.recipesText}>See More Recipes</Text>
      </TouchableOpacity>
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
});
