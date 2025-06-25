import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { auth, signInWithCredential } from '../firebase';
import { GoogleAuthProvider } from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const navigation = useNavigation();
    const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '575800558765-0lvps6s1t1i9h6fsljhia2l0v40lot0o.apps.googleusercontent.com',
    iosClientId: '575800558765-6h874ktrhctv11ng1d1ke0ubkc7sas22.apps.googleusercontent.com',
    webClientId: '575800558765-b2k3df3ncp7pqjf9ks7bj23ehtrgq1tt.apps.googleusercontent.com',
    redirectUri: AuthSession.makeRedirectUri({ useProxy: true })
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token, access_token } = response.authentication;
      const credential = GoogleAuthProvider.credential(id_token, access_token);
      
      signInWithCredential(auth, credential)
        .then(userCredential => {
          console.log('Usuario logueado en Firebase:', userCredential.user);
          // podés redirigir con navigation.navigate('Home');
        })
        .catch(error => {
          console.error('Error al autenticar con Firebase:', error);
        });
    }
  }, [response]);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/gloo.png')} style={styles.logo} />

      <Text style={styles.welcome}>Welcome Back!</Text>
      <Text style={styles.instruction}>Please enter your account here</Text>

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#888" style={styles.icon} />
        <TextInput
          placeholder="Email or phone number"
          style={styles.input}
          placeholderTextColor="#888"
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.icon} />
        <TextInput
          placeholder="Password"
          secureTextEntry
          style={styles.input}
          placeholderTextColor="#888"
        />
        <Ionicons name="eye-outline" size={20} color="#888" style={styles.iconRight} />
      </View>

      <TouchableOpacity>
        <Text style={styles.forgot}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
  style={styles.loginButton}
  onPress={() => navigation.navigate('Home')}

>
  <Text style={styles.loginText}>Login</Text>
</TouchableOpacity>

      <Text style={styles.or}>Or continue with</Text>

      <TouchableOpacity style={styles.googleButton} onPress={() => promptAsync()}>
        <View style={styles.googleContent}>
          <Ionicons name="logo-google" size={20} color="#fff" />
          <Text style={styles.googleText}>Google</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.signupPrompt}>
        Don’t have any account? <Text style={styles.signupLink}>Sign Up</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#142E8B',
    marginBottom: 8,
    fontFamily: 'InterCondensed'
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
    marginBottom: 24,
    fontFamily: 'InterCondensed'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    width: '100%',
    backgroundColor: '#F7F8F9'
  },
  icon: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 'auto',
  },
  input: {
    flex: 1,
    height: 48,
    fontFamily: 'InterCondensed'
  },
  forgot: {
    alignSelf: 'flex-end',
    color: '#888',
    fontSize: 13,
    marginBottom: 24,
    fontFamily: 'InterCondensed'
  },
  loginButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'InterCondensed'
  },
  or: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
    fontFamily: 'InterCondensed'
  },
  googleButton: {
    backgroundColor: '#1B3DE2',
    paddingVertical: 14,
    borderRadius: 28,
    width: '100%',
    marginBottom: 24,
    alignItems: 'center'
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  googleText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'InterCondensed'
  },
  signupPrompt: {
    fontSize: 13,
    color: '#888',
    fontFamily: 'InterCondensed'
  },
  signupLink: {
    color: '#1B3DE2',
    fontWeight: 'bold'
  }
});
