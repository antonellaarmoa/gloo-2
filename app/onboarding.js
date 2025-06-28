import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ImageBackground, StatusBar, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(40);
  const logoScale = new Animated.Value(0.9);

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
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Error saving onboarding state:', error);
      router.replace('/(auth)/sign-in');
    }
  };

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
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter',
    marginTop: 8,
    marginBottom: 0,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  buttonIcon: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startIcon: {
    width: 22,
    height: 22,
    tintColor: '#fff',
  },
  glooLogoXLarge: {
    width: 270,
    height: 100,
    marginTop: -10,
    marginBottom: 0,
  },
  glooCharacterXLarge: {
    width: 210,
    height: 210,
    marginBottom: 0,
  },
  glooLogoXXLarge: {
    width: 320,
    height: 120,
    marginTop: -10,
    marginBottom: 0,
  },
  welcomeTextImpact: {
    color: '#1e293b',
    fontSize: 32,
    fontWeight: '900',
    fontFamily: 'Inter',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.95)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    letterSpacing: 1.2,
  },
  subtitleOnboardingImpact: {
    color: '#1e40af',
    fontSize: 18,
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 0,
    fontWeight: '600',
    textShadowColor: 'rgba(255,255,255,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    lineHeight: 26,
  },
  glooLogoHuge: {
    width: 370,
    height: 140,
    marginTop: -10,
    marginBottom: 0,
  },
  welcomeTextPlayful: {
    color: '#f97316',
    fontSize: 36,
    fontWeight: '900',
    fontFamily: 'DynaPuff',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.95)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    letterSpacing: 1.5,
  },
  subtitleOnboardingShort: {
    color: '#1e40af',
    fontSize: 20,
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 0,
    fontWeight: '700',
    textShadowColor: 'rgba(255,255,255,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    lineHeight: 26,
  },
  glooLogoMassive: {
    width: 440,
    height: 170,
    marginTop: -10,
    marginBottom: 0,
  },
  welcomeTextModern: {
    color: '#1e40af',
    fontSize: 38,
    fontWeight: '900',
    fontFamily: 'Inter',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.95)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    letterSpacing: 1.1,
  },
  subtitleOnboardingWarm: {
    color: '#1e293b',
    fontSize: 20,
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 0,
    fontWeight: '600',
    textShadowColor: 'rgba(255,255,255,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    lineHeight: 28,
  },
  logoBlockTight: {
    alignItems: 'center',
    marginBottom: 8,
    gap: -16,
  },
  glooLogoMassiveTight: {
    width: 440,
    height: 170,
    marginTop: -32,
    marginBottom: 0,
  },
  inviteText: {
    color: '#1e40af',
    fontSize: 30,
    fontWeight: '900',
    fontFamily: 'Inter',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,1)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
    letterSpacing: 1.1,
  },
  subtitleOnboardingReadable: {
    color: '#1e293b',
    fontSize: 22,
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 0,
    fontWeight: '700',
    textShadowColor: 'rgba(255,255,255,1)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
    lineHeight: 30,
  },
  welcomeToText: {
    color: '#1e40af',
    fontSize: 34,
    fontWeight: '900',
    fontFamily: 'Inter',
    marginTop: 8,
    marginBottom: 0,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,1)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
    letterSpacing: 1.1,
  },
  foodieMessageText: {
    color: '#f97316',
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'DynaPuff',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 0,
    textShadowColor: 'rgba(255,255,255,0.95)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    lineHeight: 30,
    letterSpacing: 1.2,
  },
  welcomeMain: {
    color: '#1e40af',
    fontSize: 28,
    fontWeight: '900',
    fontFamily: 'Inter',
    marginTop: 8,
    marginBottom: 0,
    textAlign: 'center',
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 20,
    letterSpacing: 1.1,
  },
  foodieShortMessage: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 0,
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
    letterSpacing: 1.1,
  },
  whiteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.65)',
    zIndex: 1,
  },
});



// ...

