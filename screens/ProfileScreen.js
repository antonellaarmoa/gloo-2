import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import RecipeCard from '../components/RecipeCard'; // 🔹 Usamos el componente

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Image source={require('../assets/user.jpeg')} style={styles.avatar} />

      <Text style={styles.name}>Anto Armoa</Text>
      <Text style={styles.username}>@anto.armoa</Text>

      <Text style={styles.bio}>it's simple</Text>

      <TouchableOpacity style={styles.followButton}>
        <Text style={styles.followText}>Following</Text>
      </TouchableOpacity>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>120</Text>
          <Text style={styles.statLabel}>Recipes</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>120</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>250</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.shareButton]}>
          <Text style={styles.actionButtonText}>Share Profile</Text>
        </TouchableOpacity>
      </View>

      {/* 🔹 Sección de recetas usando RecipeCard */}
      <Text style={styles.sectionTitle}>My Recipes</Text>
      <RecipeCard
        recipe={{
          title: 'CheeseBURGA',
          description: 'Cheesy and tasty',
          image: require('../assets/hamburguesa.png'),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 80,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  username: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  bio: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#444',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  followButton: {
    backgroundColor: '#142E8B',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  followText: {
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginBottom: 24,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  statLabel: {
    fontSize: 13,
    color: '#777',
    fontFamily: 'Inter',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#142E8B',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  shareButton: {
    backgroundColor: '#E2773C',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
    fontFamily: 'Inter',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter',
    alignSelf: 'flex-start',
    marginLeft: 24,
    marginTop: 20,
    marginBottom: 10,
    color: '#142E8B',
  },
});
