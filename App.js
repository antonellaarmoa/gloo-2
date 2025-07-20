import { ClerkProvider } from '@clerk/clerk-expo';
import { Slot } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { Modal, View, Text, Image, StyleSheet, LogBox } from 'react-native';
import React from 'react';
import { AdminHistoryProvider } from './context/AdminHistoryContext';

LogBox.ignoreLogs(['Accessing element.ref was removed in React 19']);

export default function App() {
  const [isOffline, setIsOffline] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  return (
    <ClerkProvider publishableKey="pk_test_Y29taWMtbGVtbWluZy0xMi5jbGVyay5hY2NvdW50cy5kZXYk">
      <AdminHistoryProvider>
      {/* Modal de sin conexión */}
      <Modal visible={isOffline} transparent animationType="fade">
        <View style={stylesOffline.overlay}>
          <View style={stylesOffline.card}>
            <Image source={require('./assets/glooenojado.png')} style={stylesOffline.image} />
            <Text style={stylesOffline.title}>¡Ups!</Text>
            <Text style={stylesOffline.text}>Parece que no tienes conexión a internet.</Text>
            <Text style={stylesOffline.textSmall}>Por favor, revisa tu conexión para continuar usando Gloo.</Text>
          </View>
        </View>
      </Modal>
        <Slot />
      </AdminHistoryProvider>
      </ClerkProvider>
  );
}

const stylesOffline = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#E2773C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 300,
    maxWidth: 340,
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: 18,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E2773C',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  text: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: 'Inter',
  },
  textSmall: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 2,
    fontFamily: 'Inter',
  },
}); 