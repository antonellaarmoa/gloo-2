import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ImageBackground
} from 'react-native';
import { Ionicons, FontAwesome, Feather } from '@expo/vector-icons';

const { height, width } = Dimensions.get('window');

const posts = [
  {
    id: '1',
    username: 'facupotti',
    time: '15 min ago',
    title: 'French Toast',
    description: 'Golden, fluffy French toast with a hint of cinnamon and vanilla.',
    image: require('../assets/french-toast.jpg'),
    avatar: require('../assets/user.jpeg'),
    duration: '45 min',
    likes: 4146,
    stars: 5,
  },
];

function PostItem({ item, navigation }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes);

  const toggleLike = () => {
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    setLiked(!liked);
  };

  return (
    <ImageBackground source={item.image} style={styles.postContainer}>
      <View style={styles.overlay}>
        <View style={styles.userInfoContainer}>
          <Image source={item.avatar} style={styles.avatar} />
          <View>
            <Text style={styles.username}>@{item.username}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
        </View>

        <View style={styles.bottomContent}>
        <TouchableOpacity
  style={styles.viewRecipeButton}
  onPress={() => navigation.navigate('RecipeDetail', { post: item })}
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
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionIcon} onPress={toggleLike}>
            <Ionicons name="heart" size={30} color={liked ? 'red' : 'white'} />
            <Text style={styles.actionText}>{likeCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionIcon} onPress={() => navigation.navigate('Comments', { post: item })}>
            <Ionicons name="chatbubble-ellipses" size={30} color="white" />
            <Text style={styles.actionText}>20</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionIcon}>
            <Ionicons name="bookmark" size={30} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionIcon}>
            <Ionicons name="arrow-redo" size={30} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState('For You');
  const navigation = useNavigation()
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
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <PostItem item={item} navigation={navigation} />}
        pagingEnabled
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.navBar}>
        <Ionicons name="home" size={24} color="#9FA5C0" />
        <Feather name="search" size={24} color="#9FA5C0" />
        <View style={styles.addButton}>
          <Text style={styles.plus}>+</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={24} color="#9FA5C0" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <FontAwesome name="user" size={24} color="#9FA5C0" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  postContainer: { height: height - 90, width, justifyContent: 'space-between' },
  overlay: { flex: 1, justifyContent: 'space-between', padding: 16, backgroundColor: 'rgba(0,0,0,0.3)' },
  tabHeader: {
    position: 'absolute',
    top: 70,
    zIndex: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  tabText: { color: '#888', fontSize: 16 },
  activeTab: { color: 'white', textDecorationLine: 'underline', fontWeight: 'bold' },
  userInfoContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 550 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  username: { color: 'white', fontWeight: 'bold' },
  time: { color: '#ccc', fontSize: 12 },
  bottomContent: { paddingBottom: 40 },
  viewRecipeButton: {
    backgroundColor: '#142E8B',
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 15,
    height: 30,
    alignSelf: 'flex-start',
    top: 10,
    marginBottom: 10
  },
  viewRecipeText: { fontWeight: 'bold', color: '#fff', fontSize: 12, top: 3 },
  title: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  description: { color: 'white', fontSize: 14, marginVertical: 4 },
  metaContainer: { flexDirection: 'row', gap: 16, alignItems: 'center', marginTop: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: 'white', fontSize: 14 },
  actionsContainer: { position: 'absolute', right: 12, bottom: 200, alignItems: 'center', gap: 16 },
  actionIcon: { alignItems: 'center' },
  actionText: { color: 'white', fontSize: 12 },
  navBar: {
    position: 'absolute',
    bottom: 0,
    height: 90,
    backgroundColor: 'white',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  addButton: {
    width: 60,
    height: 60,
    backgroundColor: '#DE6E3C',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  plus: { color: 'white', fontSize: 35 },
});
