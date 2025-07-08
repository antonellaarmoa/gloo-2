import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import NavBar from '../../components/NavBar';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export default function TabLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded || !userLoaded) return;
    if (isSignedIn && user?.publicMetadata?.role === 'admin') {
      router.replace('/(admin)/notifications');
      return;
    }
    setIsChecking(false);
  }, [isSignedIn, isLoaded, user, userLoaded, router]);

  if (!isLoaded || !userLoaded || isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={{ marginTop: 16 }}>Verificando permisos...</Text>
      </View>
    );
  }

  return (
    <Tabs
      tabBar={props => <NavBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create-recipe"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.createButton}>
              <Ionicons name="add" size={28} color="#fff" />
            </View>
          ),
          tabBarButton: (props) => (
            <TouchableOpacity {...props} style={styles.createButtonContainer}>
              <View style={styles.createButton}>
                <Ionicons name="add" size={28} color="#fff" />
              </View>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="notification"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipe"
        options={{
          href: null, // This hides the tab from the tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
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
