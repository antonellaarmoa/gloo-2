import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CreateRecipe() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Create Recipe Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    color: '#333',
  },
}); 