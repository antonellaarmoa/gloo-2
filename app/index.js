import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ImageBackground, StatusBar, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();
  useEffect(() => {
    router.replace('onboarding');
  }, []);
  return null;
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
    color: '#1e40af',
    fontSize: 16,
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 0,
    marginTop: 8,
  },
  welcomeMain: {
    color: '#f97316',
    fontSize: 32,
    fontWeight: '900',
    fontFamily: 'DynaPuff',
    marginBottom: 8,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  buttonIcon: {
    marginLeft: 12,
  },
});
