import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Ionicons } from '@expo/vector-icons';

export default function FinishScreen({ navigation }) {
  const [rating, setRating] = useState(0);

  const handleRate = (value) => {
    setRating(value);
  };

  return (
    <View style={styles.container}>
      <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} fadeOut={true} />

      <Text style={styles.title}>French Toast</Text>
      <Image source={require('../assets/gloo.png')} style={styles.image} />
      <Text style={styles.congrats}>🎉 Congratulations! You Nailed It! 🎉</Text>

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

      <TouchableOpacity style={styles.favButton}>
        <Text style={styles.favText}>Add To Favorites</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.recipesButton}
        onPress={() => navigation.navigate('Home')}
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
    fontSize: 18,
    color: '#E91E63',
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
});
