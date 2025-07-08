import React, { useState, useEffect } from 'react';
import { Text, TextInput, TouchableOpacity, View, StyleSheet, ImageBackground, Dimensions, Image, Alert, Animated, StatusBar, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useSignUp, useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter, usePathname } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { handleSignUp, checkExistingSession } from '../../utils/clerkErrorHandler';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const { user } = useUser();
  const pathname = usePathname();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Animations
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);
  const logoScale = new Animated.Value(0.9);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
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

  useEffect(() => {
    if (isSignedIn && isLoaded && user) {
      if (user?.publicMetadata?.role === 'admin') {
        if (!pathname.startsWith('/(admin)')) {
          router.replace('/(admin)/notifications');
        }
      } else {
        if (pathname !== '/home') {
          router.replace('/home');
        }
      }
    }
  }, [isSignedIn, isLoaded, user, pathname]);

  const onSignUpPress = async () => {
    if (!firstName || !lastName || !emailAddress || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    if (!isLoaded) return;

    setLoading(true);
    const result = await handleSignUp(signUp, setActive, { 
      firstName, 
      lastName, 
      emailAddress, 
      password 
    }, router);
    if (!result.success && !result.redirected) {
      Alert.alert(result.error.title || 'Error', result.error.message);
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('../../assets/background.jpeg')}
        style={styles.container}
        resizeMode="cover"
      >
        {/* White translucent overlay for legibility */}
        <View style={styles.whiteOverlay} pointerEvents="none" />
      </ImageBackground>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView style={styles.absoluteFill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={styles.contentCentered}>
            {/* Logo Section */}
            <View style={styles.logoBlockTight}>
              <Image source={require('../../assets/gloo.png')} style={styles.glooCharacterXLarge} resizeMode="contain" />
              <Image source={require('../../assets/logo.png')} style={styles.glooLogoMassiveTight} resizeMode="contain" />
            </View>
            {/* Title and subtitle */}
            <View style={styles.textBlock}>
              <Text style={styles.welcomeMain}>Join the foodie community!</Text>
              <Text style={styles.foodieShortMessage}>Create your account and start sharing recipes.</Text>
            </View>
            {/* Form and buttons (keep existing styles) */}
            <View style={styles.form}>
              <View style={styles.nameRow}>
                <TextInput
                  style={[styles.input, styles.nameInput]}
                  placeholder="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={[styles.input, styles.nameInput]}
                  placeholder="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  placeholderTextColor="#999"
                />
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={emailAddress}
                onChangeText={setEmailAddress}
                autoCapitalize="none"
                placeholderTextColor="#999"
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                placeholder="Password (min 8 characters)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#999"
                autoCapitalize="none"
              />

              <TouchableOpacity 
                style={[styles.signUpButton, loading && styles.buttonDisabled]}
                onPress={onSignUpPress}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.signUpButtonText}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
                  <Text style={styles.linkText}>Sign In</Text>
                </TouchableOpacity>
              </View>
              {/* Botón azul más pequeño para continuar como invitado */}
              <TouchableOpacity 
                onPress={() => router.replace('/(tabs)/home')}
                style={{
                  backgroundColor: '#142E8B',
                  borderRadius: 20,
                  paddingVertical: 10,
                  paddingHorizontal: 18,
                  alignItems: 'center',
                  marginTop: 12,
                  marginBottom: 8,
                  alignSelf: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.18,
                  shadowRadius: 6,
                  elevation: 4,
                }}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 0.2 }}>Continue as Guest</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
  },
  whiteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  contentCentered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 0,
  },
  logoBlockTight: {
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  glooCharacterXLarge: {
    width: 120,
    height: 120,
    marginBottom: 0,
  },
  glooLogoMassiveTight: {
    width: 220,
    height: 80,
    marginTop: -24,
    marginBottom: 0,
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeMain: {
    color: '#1e40af',
    fontSize: 24,
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
    marginTop: 8,
    marginBottom: 0,
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
    letterSpacing: 1.1,
  },
  form: {
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  nameInput: {
    marginBottom: 0,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  signUpButton: {
    backgroundColor: '#f97316',
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#1e293b',
    fontWeight: '400',
    fontSize: 15,
    textAlign: 'center',
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    letterSpacing: 1.05,
  },
  linkText: {
    color: '#f97316',
    fontSize: 15,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
  },
});
