import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity, Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
const { width } = Dimensions.get('window');

export default function FollowingScreen() {
  const navigation = useNavigation();

  const [followingData, setFollowingData] = useState([
    { id: '1', username: '@martuugomez', name: 'Martina Gomez', status: 'Follow', avatar: require('../assets/user.jpeg') },
    { id: '2', username: '@facu.martinez', name: 'Facundo Martinez', status: 'Following', avatar: require('../assets/user.jpeg') },
    { id: '3', username: '@paulina_cocina', name: 'Paulina Cocina', status: 'Following', avatar: require('../assets/user.jpeg') },
    { id: '4', username: '@facu.potti', name: 'Facundo Potti', status: 'Following', avatar: require('../assets/user.jpeg') },
    { id: '5', username: '@miriam_soñar', name: 'Miriam', status: 'Following', avatar: require('../assets/user.jpeg') },
    { id: '6', username: '@daniel_torres', name: 'Daniel Torres', status: 'Following', avatar: require('../assets/user.jpeg') },
    { id: '7', username: '@señorDanette', name: 'German', status: 'Following', avatar: require('../assets/user.jpeg') },
    { id: '8', username: '@nicki.zieman', name: 'Nicole Zieman', status: 'Following', avatar: require('../assets/user.jpeg') },
  ]);

  const toggleFollow = (id) => {
    const updated = followingData.map(user =>
      user.id === id
        ? { ...user, status: user.status === 'Follow' ? 'Following' : 'Follow' }
        : user
    );
    setFollowingData(updated);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={{ position: 'absolute', top: 60, left: 20 }}
        onPress={() => navigation.navigate('Profile')}
      >
        <Text style={{ fontSize: 24, color: '#E2773C' }}>{'<'}</Text>
      </TouchableOpacity>

      <Text style={styles.header}>@anto.armoa</Text>
      <View style={styles.tabs}>
        <Text style={[styles.tab, styles.activeTab]}>120 Following</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Followers')}>
          <Text style={styles.tab}>250 Followers</Text>
        </TouchableOpacity>
      </View>

      <TextInput placeholder="Search" style={styles.search} />

      <FlatList
        data={followingData}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.followerRow}
            onPress={() => navigation.navigate('PublicProfile', { user: item })}
          >
            <Image source={item.avatar} style={styles.avatar} />
            <View style={styles.info}>
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.name}>{item.name}</Text>
            </View>
            <TouchableOpacity
              style={styles.followButton}
              onPress={() => toggleFollow(item.id)}
            >
              <Text style={styles.followText}>{item.status}</Text>
            </TouchableOpacity>
            <Text style={styles.menuDots}>⋮</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, backgroundColor: '#fff', paddingHorizontal: 16 },
  header: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, color: '#E2773C' },
  tabs: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  tab: { fontSize: 14, color: '#888' },
  activeTab: { color: '#142E8B', borderBottomWidth: 2, borderBottomColor: '#142E8B' },
  search: {
    backgroundColor: '#E2773C',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 20,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  followerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  info: { flex: 1 },
  username: { fontWeight: 'bold' },
  name: { color: '#555' },
  followButton: {
    backgroundColor: '#E2773C',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
  },
  followText: { color: 'white', fontSize: 12 },
  menuDots: { fontSize: 20, marginLeft: 8, color: '#888' },
});
