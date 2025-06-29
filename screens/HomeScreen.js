import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import RecipeCard from '../components/RecipeCard';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Welcome to Gloo!</Text>
      <View style={styles.cardsContainer}>
        <RecipeCard
          recipe={{
            title: 'CheeseBURGA',
            description: 'Cheesy and tasty',
            image: require('../assets/hamburguesa.png'),
          }}
        />
        <RecipeCard
          recipe={{
            title: 'French Toast',
            description: 'Golden, fluffy French toast with a hint of cinnamon and vanilla.',
            image: require('../assets/french-toast.jpg'),
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E2773C',
    marginBottom: 20,
    textAlign: 'center',
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
});
