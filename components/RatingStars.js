import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Text, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { API_CONFIG, buildApiUrl } from '../config/api';

const RATES_API_URL = buildApiUrl(API_CONFIG.ENDPOINTS.RATES);

export default function RatingStars({
  recipeId,
  initialRating = 0,
  size = 24,
  style = {},
  showCount = true,
  showAverage = true,
  interactive = true,
  onRatingChange,
}) {
  const { userId } = useAuth();
  const [userRating, setUserRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recipeId) {
      fetchRatingStats();
      if (userId) {
        fetchUserRating();
      }
    }
  }, [recipeId, userId]);

  const fetchRatingStats = async () => {
    try {
      const response = await fetch(`${RATES_API_URL}/recipe/${recipeId}`);
      const data = await response.json();
      
      if (data.success) {
        setAverageRating(data.data.stats.averageRating);
        setTotalRatings(data.data.stats.totalRatings);
      }
    } catch (error) {
      console.error('Error fetching rating stats:', error);
    }
  };

  const fetchUserRating = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`${RATES_API_URL}/${userId}/status/${recipeId}`);
      const data = await response.json();
      
      if (data.success && data.data.hasRated) {
        setUserRating(data.data.rating.rate);
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  const handleRating = async (rating) => {
    if (!interactive || !userId || !recipeId) return;

    setLoading(true);
    try {
      let response;
      
      if (userRating === 0) {
        // Crear nuevo rating
        response = await fetch(`${RATES_API_URL}/${userId}/rate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipeId: parseInt(recipeId),
            rate: rating,
          }),
        });
      } else {
        // Actualizar rating existente
        response = await fetch(`${RATES_API_URL}/${userId}/rate`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipeId: parseInt(recipeId),
            rate: rating,
          }),
        });
      }

      const data = await response.json();
      
      if (data.success) {
        setUserRating(rating);
        setAverageRating(data.data.stats.averageRating);
        setTotalRatings(data.data.stats.totalRatings);
        
        if (onRatingChange) {
          onRatingChange(rating, data.data.stats);
        }
        
        Alert.alert(
          '¡Calificación enviada!',
          `Has calificado esta receta con ${rating} estrellas.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', data.error || 'Error al calificar la receta');
      }
    } catch (error) {
      console.error('Error rating recipe:', error);
      Alert.alert('Error', 'Error de conexión al calificar la receta');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    const ratingToShow = userRating > 0 ? userRating : (showAverage ? averageRating : 0);
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          style={styles.starButton}
          onPress={() => handleRating(i)}
          disabled={!interactive || loading}
          activeOpacity={interactive ? 0.7 : 1}
        >
          <Ionicons
            name={i <= ratingToShow ? "star" : "star-outline"}
            size={size}
            color={i <= ratingToShow ? "#fbbf24" : "#ccc"}
            style={loading ? styles.disabledStar : {}}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.starsContainer}>
        {renderStars()}
      </View>
      
      {showCount && totalRatings > 0 && (
        <Text style={[styles.countText, { fontSize: size * 0.4 }]}>
          ({totalRatings} calificaciones)
        </Text>
      )}
      
      {showAverage && averageRating > 0 && (
        <Text style={[styles.averageText, { fontSize: size * 0.4 }]}>
          Promedio: {averageRating.toFixed(1)}/5
        </Text>
      )}
      
      {userRating > 0 && (
        <Text style={[styles.userRatingText, { fontSize: size * 0.4 }]}>
          Tu calificación: {userRating}/5
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starButton: {
    marginHorizontal: 2,
  },
  disabledStar: {
    opacity: 0.5,
  },
  countText: {
    marginTop: 4,
    color: '#666',
    fontWeight: '500',
  },
  averageText: {
    marginTop: 2,
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  userRatingText: {
    marginTop: 2,
    color: '#059669',
    fontWeight: 'bold',
  },
}); 