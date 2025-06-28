import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ImageBackground, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height, width } = Dimensions.get('window');

const posts = [
  {
    id: '1',
    username: 'chef_maria',
    time: '2 hours ago',
    title: 'Delicious Avocado Toast',
    description: 'A healthy and tasty breakfast option that will keep you energized all morning!',
    image: require('../../assets/avocado-toast.jpg'),
    avatar: require('../../assets/user.jpeg'),
    likes: 245,
    duration: '10 min',
    stars: 4.8
  },
  {
    id: '2',
    username: 'food_lover',
    time: '4 hours ago',
    title: 'French Toast Delight',
    description: 'Classic French toast with a modern twist. Perfect for weekend brunches!',
    image: require('../../assets/french-toast.jpg'),
    avatar: require('../../assets/user.jpeg'),
    likes: 189,
    duration: '15 min',
    stars: 4.6
  },
  {
    id: '3',
    username: 'asian_kitchen',
    time: '6 hours ago',
    title: 'Teriyaki Chicken Bowl',
    description: 'Authentic Japanese teriyaki chicken with steamed rice and vegetables.',
    image: require('../../assets/teriyaki.jpg'),
    avatar: require('../../assets/user.jpeg'),
    likes: 312,
    duration: '25 min',
    stars: 4.9
  }
];

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function PostItem({ item }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes);
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const toggleLike = () => {
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    setLiked(!liked);
  };

  const toggleSaved = () => {
    setSaved(!saved);
  };

  const toggleShared = () => {
    setShared(!shared);
  };

  return (
    <ImageBackground source={item.image} style={styles.postContainer}>
      <View style={styles.overlay}>
        <View style={styles.bottomContent}>
          <View style={styles.userInfoContainer}>
            <Image source={item.avatar} style={styles.avatar} />
            <View>
              <Text style={styles.username}>@{item.username}</Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.viewRecipeButton}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/recipe',
                params: { post: JSON.stringify(item) }
              })
            }
          >
            <Text style={styles.viewRecipeText}>View recipe</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={18} color="white" />
              <Text style={styles.metaText}>{item.duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={18} color="white" />
              <Text style={styles.metaText}>{item.stars}</Text>
            </View>
          </View>
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionIcon} onPress={toggleLike}>
              <Ionicons name="heart" size={30} color={liked ? '#ef4444' : 'white'} />
              <Text style={styles.actionText}>{likeCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon} onPress={() =>
              router.push({
                pathname: '/comment', 
                params: { post: JSON.stringify(item) }
              })
            }>
              <Ionicons name="chatbubble-ellipses" size={30} color="white" />
              <Text style={styles.actionText}>20</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon} onPress={toggleSaved}>
              <Ionicons name="bookmark" size={30} color={saved ? '#fbbf24' : 'white'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon} onPress={toggleShared}>
              <Ionicons name="arrow-redo" size={30} color={shared ? '#10b981' : 'white'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState('For You');
  const [shuffledPosts, setShuffledPosts] = useState(() => shuffleArray(posts));

  // Optional: reshuffle on every mount
  // useEffect(() => { setShuffledPosts(shuffleArray(posts)); }, []);

  return (
    <View style={styles.container}>
      <View style={styles.tabHeader}>
        <TouchableOpacity onPress={() => setActiveTab('For You')}>
          <Text style={[styles.tabText, activeTab === 'For You' && styles.activeTab]}>For You</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('Following')}>
          <Text style={[styles.tabText, activeTab === 'Following' && styles.activeTab]}>Following</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={shuffledPosts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <PostItem item={item} />}
        pagingEnabled
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'black' 
  },
  postContainer: { 
    height: height, 
    width: width, 
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  tabHeader: {
    position: 'absolute',
    top: 50,
    zIndex: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 20,
  },
  tabText: { 
    color: 'rgba(255, 255, 255, 0.4)', 
    fontSize: 18,
    fontWeight: '600',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  activeTab: { 
    color: '#fff', 
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20 
  },
  username: { 
    color: 'white', 
    fontWeight: 'bold',
    fontSize: 16,
  },
  time: { 
    color: '#ccc', 
    fontSize: 12 
  },
  bottomContent: {
    marginBottom: 100,
    marginLeft: 8,
    marginRight: 0,
    paddingHorizontal: 0,
    borderRadius: 20,
  },
  viewRecipeButton: {
    backgroundColor: '#f97316',
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 15,
    height: 32,
    alignSelf: 'flex-start',
    top: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  viewRecipeText: { 
    fontWeight: 'bold', 
    color: '#fff', 
    fontSize: 12, 
    top: 3 
  },
  title: { 
    color: 'white', 
    fontSize: 24, 
    fontWeight: 'bold',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  description: { 
    color: 'white', 
    fontSize: 16, 
    marginVertical: 8,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  metaContainer: { 
    flexDirection: 'row', 
    gap: 20, 
    alignItems: 'center', 
    marginTop: 12 
  },
  metaItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  metaText: { 
    color: 'white', 
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  actionsContainer: { 
    position: 'absolute', 
    right: 20, 
    bottom: 250, 
    alignItems: 'center', 
    gap: 20 
  },
  actionIcon: { 
    alignItems: 'center' 
  },
  actionText: { 
    color: 'white', 
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
