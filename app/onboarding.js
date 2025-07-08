import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ImageBackground, StatusBar, Platform, Animated } from 'react-native';
import * as Font from 'expo-font';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(40);
  const logoScale = new Animated.Value(0.9);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontError, setFontError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    Font.loadAsync({
      'DynaPuff': require('../assets/fonts/DynaPuff.ttf'),
      'Inter': require('../assets/fonts/Inter.ttf'),
    })
      .then(() => {
        if (isMounted) setFontsLoaded(true);
      })
      .catch((err) => {
        console.error('Error loading fonts:', err);
        if (isMounted) setFontError(err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleStartCooking = async () => {
    try {
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Error navigating:', error);
      router.replace('/(tabs)/home');
    }
  };

  if (fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ color: 'red', fontSize: 16, marginBottom: 8 }}>Error cargando fuentes</Text>
        <Text>{fontError.message || String(fontError)}</Text>
      </View>
    );
  }

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Cargando fuentes...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/background.jpeg')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* White translucent overlay for legibility */}
      <View style={styles.whiteOverlay} pointerEvents="none" />
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View style={styles.contentCentered}>
        {/* Logo Section */}
        <View style={styles.logoBlockTight}>
          <Image
            source={require('../assets/gloo.png')}
            style={styles.glooCharacterXLarge}
            resizeMode="contain"
          />
          <Image
            source={require('../assets/logo.png')}
            style={styles.glooLogoMassiveTight}
            resizeMode="contain"
          />
        </View>
        {/* Title and subtitle */}
        <View style={styles.textBlock}>
          <Text style={styles.welcomeMain}>Welcome foodie!</Text>
          <Text style={styles.foodieShortMessage}>Join our community to cook better food. Are you ready?</Text>
        </View>
        {/* Button Section */}
        <View style={styles.buttonSectionCentered}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleStartCooking}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Start Cooking</Text>
            <View style={styles.buttonIcon}><Ionicons name="play" size={24} color="#fff" /></View>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentCentered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 0,
    zIndex: 2,
  },
  logoBlock: {
    alignItems: 'center',
    marginBottom: 12,
  },
  glooCharacter: {
    width: 120,
    height: 120,
    marginBottom: 0,
  },
  glooLogo: {
    width: 160,
    height: 60,
    marginTop: -10,
    marginBottom: 0,
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  itsSimpleText: {
    color: '#1e40af',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: -2,
    fontFamily: 'Inter',
  },
  glooText: {
    color: '#f97316',
    fontSize: 44,
    fontWeight: '900',
    fontFamily: 'DynaPuff',
    marginBottom: 8,
    letterSpacing: 1.5,
  },
  subtitleOnboarding: {
    color: '#1e40af',
    fontSize: 15,
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 0,
  },
  buttonSectionCentered: {
    width: '100%',
    alignItems: 'center',
    marginTop: 32,
  },
  button: {
    backgroundColor: '#f97316',
    borderRadius: 32,
    paddingVertical: 18,
    paddingHorizontal: 45,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 210,
    maxWidth: width * 0.75,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: Math.min(width * 0.044, 18),
    fontWeight: '600',
    letterSpacing: 0.3,
    fontFamily: 'Inter',
  },
  glooCharacterLarge: {
    width: 170,
    height: 170,
    marginBottom: 0,
  },
  glooLogoLarge: {
    width: 220,
    height: 80,
    marginTop: -10,
    marginBottom: 0,
  },
  welcomeText: {
    color: '#1e293b',
  },
  whiteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  logoBlockTight: {
    alignItems: 'center',
    marginBottom: 0,
    marginTop: -40,
  },
  glooCharacterXLarge: {
    width: 200,
    height: 200,
    marginBottom: 0,
  },
  glooLogoMassiveTight: {
    width: 260,
    height: 90,
    marginTop: -10,
    marginBottom: 0,
  },
  foodieShortMessage: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 0,
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
    letterSpacing: 1.1,
  },
  welcomeMain: {
    color: '#1e40af',
    fontSize: 32,
    fontWeight: '900',
    fontFamily: 'Inter',
    marginBottom: 8,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  buttonIcon: {
    marginLeft: 12,
  },
}); 