import React, { useState, useEffect } from 'react';
import { Text, TextInput, TouchableOpacity, View, StyleSheet, ImageBackground, Dimensions, Image, Alert, Animated, StatusBar, Platform, KeyboardAvoidingView, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { useSignIn, useOAuth, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { handleSignIn, handleOAuth, checkExistingSession } from '../../utils/clerkErrorHandler';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1=email, 2=code+password
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

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

  // AuthGuard handles the redirect logic, so we don't need this here

  const onSignInPress = async () => {
    if (!emailAddress || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!isLoaded) return;

    // AuthGuard handles session checks
    setLoading(true);
    
    const result = await handleSignIn(signIn, setActive, { emailAddress, password }, router);
    
    if (!result.success && !result.redirected) {
      Alert.alert(result.error.title || 'Error', result.error.message);
    }
    
    setLoading(false);
  };

  const onGooglePress = async () => {
    if (!isLoaded) return;

    // AuthGuard handles session checks
    setGoogleLoading(true);
    
    const result = await handleOAuth(startOAuthFlow, setActive, router);
    
    if (!result.success) {
      Alert.alert(result.error.title || 'Error', result.error.message);
    }
    
    setGoogleLoading(false);
  };

  const handleForgotPassword = () => {
    setForgotModalVisible(true);
    setForgotStep(1);
    setForgotEmail('');
    setForgotCode('');
    setForgotNewPassword('');
    setForgotError('');
    setForgotSuccess(false);
  };

  const handleSendResetEmail = async () => {
    setForgotLoading(true);
    setForgotError('');
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: forgotEmail,
      });
      setForgotStep(2);
    } catch (err) {
      setForgotError(err?.errors?.[0]?.message || 'Could not send reset email.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setForgotLoading(true);
    setForgotError('');
    try {
      await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: forgotCode,
        password: forgotNewPassword,
      });
      setForgotSuccess(true);
    } catch (err) {
      setForgotError(err?.errors?.[0]?.message || 'Could not reset password.');
    } finally {
      setForgotLoading(false);
    }
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
              <Text style={styles.welcomeMain}>Welcome back foodie!</Text>
              <Text style={styles.foodieShortMessage}>Sign in to cook, share and enjoy.</Text>
            </View>
            {/* Form and buttons (keep existing styles) */}
            <View style={styles.form}>
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
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.signInButton, loading && styles.buttonDisabled]}
                onPress={onSignInPress}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.signInButtonText}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Text>
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.footerText}>or</Text>
                <View style={styles.divider} />
              </View>

              <TouchableOpacity 
                style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
                onPress={onGooglePress}
                disabled={googleLoading}
                activeOpacity={0.85}
              >
                <View style={styles.googleButtonContent}>
                  <Image source={require('../../assets/google-logo.png')} style={styles.googleLogo} />
                  <Text style={styles.googleButtonText}>
                    {googleLoading ? 'Signing In...' : 'Continue with Google'}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
                  <Text style={styles.linkText}>Sign Up</Text>
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
      {/* Forgot Password Modal */}
      <Modal
        visible={forgotModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <View style={styles.forgotModalOverlay}>
          <View style={styles.forgotModalContent}>
            {!forgotSuccess ? (
              <>
                {forgotStep === 1 && (
                  <>
                    <Text style={styles.forgotModalTitle}>Reset your password</Text>
                    <Text style={styles.forgotModalDesc}>Enter your email and we'll send you a code to reset your password.</Text>
                    <TextInput
                      style={[styles.input, styles.forgotModalEmailInput]}
                      placeholder="Email"
                      value={forgotEmail}
                      onChangeText={setForgotEmail}
                      keyboardType="email-address"
                      placeholderTextColor="#999"
                    />
                    {forgotError ? <Text style={styles.forgotModalError}>{forgotError}</Text> : null}
                    <TouchableOpacity style={styles.signInButton} onPress={handleSendResetEmail} disabled={forgotLoading}>
                      {forgotLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInButtonText}>Send Code</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setForgotModalVisible(false)} style={{ marginTop: 10 }}>
                      <Text style={{ color: '#1e40af', textAlign: 'center', textDecorationLine: 'underline' }}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}
                {forgotStep === 2 && (
                  <>
                    <Text style={styles.forgotModalTitle}>Enter code & new password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Code from email"
                      value={forgotCode}
                      onChangeText={setForgotCode}
                      autoCapitalize="none"
                      keyboardType="number-pad"
                      placeholderTextColor="#999"
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="New password"
                      value={forgotNewPassword}
                      onChangeText={setForgotNewPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      placeholderTextColor="#999"
                    />
                    {forgotError ? <Text style={styles.forgotModalError}>{forgotError}</Text> : null}
                    <TouchableOpacity style={styles.signInButton} onPress={handleResetPassword} disabled={forgotLoading}>
                      {forgotLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInButtonText}>Reset Password</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setForgotModalVisible(false)} style={{ marginTop: 10 }}>
                      <Text style={{ color: '#1e40af', textAlign: 'center', textDecorationLine: 'underline' }}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            ) : (
              <>
                <Text style={styles.forgotModalTitle}>Password reset!</Text>
                <Text style={styles.forgotModalDesc}>You can now sign in with your new password.</Text>
                <TouchableOpacity style={styles.signInButton} onPress={() => setForgotModalVisible(false)}>
                  <Text style={styles.signInButtonText}>Back to Sign In</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    marginTop: 6,
    marginBottom: 0,
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
    letterSpacing: 1.1,
  },
  form: {
    width: '100%',
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
  signInButton: {
    backgroundColor: '#f97316',
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    justifyContent: 'center',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 8,
    borderRadius: 1,
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
  googleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogo: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: 0,
    marginBottom: 8,
    width: '100%',
  },
  forgotPasswordText: {
    color: '#1e40af',
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  forgotModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotModalContent: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  forgotModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 8,
    textAlign: 'center',
  },
  forgotModalDesc: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 16,
    textAlign: 'center',
  },
  forgotModalError: {
    color: '#dc2626',
    marginTop: 6,
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: '600',
  },
  forgotModalEmailInput: {
    width: '100%',
    minWidth: 240,
    marginBottom: 8,
  },
});
