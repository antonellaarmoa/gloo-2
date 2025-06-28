import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const notifications = [
  {
    id: '1',
    type: 'approval',
    title: 'TheGlooTeam',
    message: 'Your recipe CheeseBURGA has been approved',
    time: '10 min',
    image: require('../../assets/french-toast.jpg'),
    logo: require('../../assets/logo.png')
  },
  {
    id: '2',
    type: 'like',
    names: ['Facundo Potti', 'Nicole Zieman'],
    message: 'liked your recipe',
    time: '20 min',
    image: require('../../assets/french-toast.jpg'),
    avatar: require('../../assets/user.jpeg')
  },
  {
    id: '3',
    type: 'follow',
    names: ['Facundo Potti'],
    message: 'now following you',
    time: '1h',
    avatar: require('../../assets/user.jpeg'),
    followed: true
  },
  {
    id: '4',
    type: 'like',
    names: ['Mariana Lopez', 'Daniel Torres'],
    message: 'liked your recipe',
    time: '20 min',
    image: require('../../assets/french-toast.jpg'),
    avatar: require('../../assets/user.jpeg')
  },
  {
    id: '5',
    type: 'follow',
    names: ['Paulina Cocina'],
    message: 'now following you',
    time: '1h',
    avatar: require('../../assets/user.jpeg'),
    followed: false
  },
  {
    id: '6',
    type: 'follow',
    names: ['Miriam'],
    message: 'now following you',
    time: '1h',
    avatar: require('../../assets/user.jpeg'),
    followed: true
  }
];

export default function NotificationScreen() {
  const [followStates, setFollowStates] = useState({});

  const toggleFollow = (id) => {
    setFollowStates(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderItem = ({ item }) => {
    const isFollowing = followStates[item.id] !== undefined ? followStates[item.id] : item.followed;

    return (
      <View style={styles.itemContainer}>
        {item.type === 'approval' ? (
          <View style={styles.row}>
            <Image source={item.logo} style={styles.logo} />
            <View style={styles.textContainer}>
              <Text style={styles.title}>
                <Text style={styles.bold}>{item.title}</Text> - Good News!
              </Text>
              <Text>{item.message}</Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>
            <Image source={item.image} style={styles.recipeThumb} />
          </View>
        ) : (
          <View style={styles.row}>
            <Image source={item.avatar} style={styles.avatar} />
            <View style={styles.textContainer}>
              <Text>
                <Text style={styles.bold}>{item.names.join(' and ')}</Text> {item.message}
              </Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>
            {item.image && <Image source={item.image} style={styles.recipeThumb} />}
            {item.hasOwnProperty('followed') && (
              <TouchableOpacity
                style={[
                  styles.followBtn,
                  { backgroundColor: isFollowing ? '#1e3a8a' : '#f97316' }
                ]}
                onPress={() => toggleFollow(item.id)}
              >
                <Text style={styles.followText}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.sectionTitle}>New</Text>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  itemContainer: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  bold: {
    fontWeight: 'bold',
  },
  time: {
    color: '#6b7280',
    fontSize: 12,
  },
  recipeThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginLeft: 8,
  },
  followBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  followText: {
    color: '#fff',
    fontFamily: 'Inter',
  },
});
