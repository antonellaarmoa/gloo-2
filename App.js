import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from './screens/OnboardingScreen';
import * as Font from 'expo-font';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

import FAQCScreen from './screens/FAQCScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import LoginScreen from './screens/LoginScreen';
import FollowersScreen from './screens/FollowersScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import AccountDetailsScreen from './screens/AccountDetailsScreen';
import CommentScreen from './screens/CommentScreen';
import RecipeDetailScreen from './screens/RecipeDetailScreen';
import StepByStepScreen from './screens/StepByStepScreen';
import FinishScreen from './screens/FinishScreen';
import FollowingScreen from './screens/FollowingScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import PublicProfileScreen from './screens/PublicProfileScreen';
const Stack = createNativeStackNavigator();



export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      'DynaPuff': require('./assets/fonts/DynaPuff.ttf'),
      'Inter': require('./assets/fonts/Inter.ttf'),
    }).then(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Cargando fuentes...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Onboarding" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Following" component={FollowingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Comments" component={CommentScreen} />
        <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} />
        <Stack.Screen name="StepByStep" component={StepByStepScreen} />
        <Stack.Screen name="Finish" component={FinishScreen} />
        <Stack.Screen name="AccountDetails" component={AccountDetailsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Followers" component={FollowersScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="FAQC" component={FAQCScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}