import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function RecipeCard({ recipe, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={recipe.image} style={styles.image} />
      <Text style={styles.title}>{recipe.title}</Text>
      <Text style={styles.description}>{recipe.description}</Text>
      <View style={styles.footer}>
        <Text style={styles.meta}>⭐ 4</Text>
        <Text style={styles.meta}>⏱ 20min</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: width / 2 - 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 6,
    padding: 8,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 100,
    borderRadius: 12,
  },
  title: {
    fontWeight: 'bold',
    marginTop: 6,
    fontFamily: 'Inter',
  },
  description: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Inter',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  meta: {
    fontSize: 12,
    color: '#E2773C',
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
});
