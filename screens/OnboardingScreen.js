import React from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ImageBackground,
  Dimensions
} from 'react-native';

const { height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const navigation = useNavigation();
  return (
    <ImageBackground
      source={require('../assets/background.jpeg')}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={styles.container}>
        <Image
          source={require('../assets/gloo.png')}
          style={styles.image}
        />
        <Image
          source={require('../assets/logo.png')}
          style={styles.image2}
        />
        <Text style={styles.subtitle}>
          Let’s join our community to cook better food!
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Start Cooking</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: height * 0.1
  },
  image: {
    width: 250,
    height: 250,
    marginBottom: -50,
    resizeMode: 'contain',
  },
  image2: {
    width: 350,
    height: 250,
    marginBottom: -30,
    resizeMode: 'contain'
  },
  subtitle: {
    fontSize: 22,
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Inter',
    marginBottom: 40,
    paddingHorizontal: 12,
    textShadowColor: '#ffffff',
    textShadowOffset: { width: 2, height: 1},
    textShadowRadius: 6
  },
  button: {
    backgroundColor: '#142E8B',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 32,
    elevation: 2
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter'
  }
});