import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import RecipeCard from '../components/RecipeCard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const sampleRecipes = [
  {
    title: 'Chicken Wings',
    description: 'Delicious and juicy wings',
    image: require('../assets/french-toast.jpg'),
  },
  {
    title: 'Chicken Teriyaki',
    description: 'A feast for the senses',
    image: require('../assets/french-toast.jpg'),
  },
  {
    title: 'Color Macarons',
    description: 'Sweet bites',
    image: require('../assets/french-toast.jpg'),
  },
  {
    title: 'CheeseBURGA',
    description: 'Cheesy and tasty',
    image: require('../assets/hamburguesa.png'),
  },
  {
    title: 'Spring Rolls',
    description: 'Full of flavor',
    image: require('../assets/french-toast.jpg'),
  },
  {
    title: 'French Toast',
    description: 'Delicious slices of bread',
    image: require('../assets/french-toast.jpg'),
  },
];

export default function PublicProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  let user = params.user;
  if (typeof user === 'string') {
    try {
      user = JSON.parse(user);
    } catch (e) {
      user = {};
    }
  }
  const [isFollowing, setIsFollowing] = useState(true);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ alignItems: 'center' }}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color="#E2773C" />
      </TouchableOpacity>
      <Image source={user.avatar} style={styles.avatar} />
      <Text style={styles.name}>{user.name || 'User Name'}</Text>
      <Text style={styles.username}>{user.username}</Text>
      <Text style={styles.bio}>it's simple ;)</Text>
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>120</Text>
          <Text style={styles.statLabel}>Recipes</Text>
        </View>
        <TouchableOpacity style={styles.statBox} onPress={() => router.push('/following')}>
          <Text style={styles.statNumber}>120</Text>
          <Text style={styles.statLabel}>Following</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statBox} onPress={() => router.push('/followers')}>
          <Text style={styles.statNumber}>250</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.followButton, isFollowing ? styles.following : styles.notFollowing]}
        onPress={() => setIsFollowing(f => !f)}
      >
        <Text style={styles.followButtonText}>{isFollowing ? 'Following' : 'Follow'}</Text>
      </TouchableOpacity>
      <Text style={styles.tabTitle}>My Recipes</Text>
      <View style={styles.grid}>
        {sampleRecipes.map((recipe, idx) => (
          <RecipeCard key={idx} recipe={recipe} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    marginTop: 40,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E2773C',
    marginTop: 4,
  },
  username: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  bio: {
    fontSize: 13,
    color: '#444',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginBottom: 16,
  },
  statBox: { alignItems: 'center' },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 13,
    color: '#777',
  },
  followButton: {
    paddingVertical: 8,
    paddingHorizontal: 40,
    borderRadius: 20,
    marginBottom: 16,
  },
  following: {
    backgroundColor: '#163BA1',
  },
  notFollowing: {
    backgroundColor: '#E2773C',
  },
  followButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  tabTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
    marginLeft: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: width,
    marginBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
}); 