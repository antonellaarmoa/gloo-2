import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, TouchableOpacity, Text, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useState } from 'react';

const TABS = [
  {
    name: 'home',
    label: 'Home',
    icon: 'home-outline',
    guestAllowed: true,
  },
  {
    name: 'search',
    label: 'Search',
    icon: 'search-outline',
    guestAllowed: false,
  },
  {
    name: 'create-recipe',
    label: 'Create',
    icon: 'add',
    isCreate: true,
    guestAllowed: false,
  },
  {
    name: 'notification',
    label: 'Notifications',
    icon: 'notifications-outline',
    guestAllowed: false,
  },
  {
    name: 'profile',
    label: 'Profile',
    icon: 'person-outline',
    guestAllowed: false,
  },
];

export default function NavBar({ state, descriptors, navigation }) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [showGuestOverlay, setShowGuestOverlay] = useState(false);
  const isGuest = !isSignedIn;

  const handleTabPress = (tab) => {
    if (isGuest && !tab.guestAllowed) {
      setShowGuestOverlay(true);
      return;
    }
    
    const isFocused = state.index === TABS.findIndex(t => t.name === tab.name);
    if (!isFocused) {
      router.push(`/(tabs)/${tab.name}`);
    }
  };

  return (
    <View style={styles.tabBar}>
      {TABS.map((tab, idx) => {
        const isFocused = state.index === idx;
        
        if (tab.isCreate) {
          return (
            <TouchableOpacity
              key={tab.name}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={() => handleTabPress(tab)}
              style={styles.createButtonContainer}
            >
              <View style={styles.createButton}>
                <Ionicons name={tab.icon} size={28} color="#fff" />
              </View>
              <Text style={[styles.tabLabel, { color: isFocused ? '#f97316' : '#9ca3af', marginTop: 48 }]}>Add</Text>
            </TouchableOpacity>
          );
        }
        return (
          <TouchableOpacity
            key={tab.name}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={() => handleTabPress(tab)}
            style={styles.tabButton}
          >
            <Ionicons
              name={tab.icon}
              size={24}
              color={isFocused ? '#f97316' : '#9ca3af'}
            />
            <Text style={[styles.tabLabel, { color: isFocused ? '#f97316' : '#9ca3af' }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
      
      {/* Overlay para guest users */}
      <Modal
        visible={showGuestOverlay}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGuestOverlay(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.7)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', maxWidth: 320 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#F9690E', marginBottom: 12, textAlign: 'center' }}>Create an account to unlock all features!</Text>
            <Text style={{ fontSize: 16, color: '#333', marginBottom: 24, textAlign: 'center' }}>
              Sign up or log in to search, create recipes, view notifications, and access your profile.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: '#142E8B', borderRadius: 50, paddingVertical: 12, paddingHorizontal: 32, marginBottom: 12 }}
              onPress={() => router.replace('/(auth)/sign-in')}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Sign In / Create Account</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowGuestOverlay(false)}>
              <Text style={{ color: '#F9690E', fontWeight: 'bold', fontSize: 16, marginTop: 8 }}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    height: 80,
    paddingBottom: 12,
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  createButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
  },
  createButton: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#f97316',
    borderRadius: 32,
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
}); 