import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function FollowersScreen() {
  const navigation = useNavigation();

  const [followersData, setFollowersData] = useState([
    { id: '1', username: '@gabi_lopez', name: 'Gabriela Lopez', status: 'Follow', avatar: require('../assets/user-ej.png') },
    { id: '2', username: '@facu.martinez', name: 'Facundo Martinez', status: 'Following', avatar: require('../assets/user-ej.png') },
    { id: '3', username: '@tomas_cap', name: 'Tomas Campa', status: 'Follow', avatar: require('../assets/user-ej.png') },
    { id: '4', username: '@facu.potti', name: 'Facundo Potti', status: 'Following', avatar: require('../assets/user-ej.png') },
    { id: '5', username: '@gusti_dj', name: 'Gustavo DJ', status: 'Following', avatar: require('../assets/user-ej.png') },
    { id: '6', username: '@maria_torres', name: 'Maria Torres', status: 'Following', avatar: require('../assets/user-ej.png') },
    { id: '7', username: '@julian_hernan', name: 'Julian Hernan', status: 'Following', avatar: require('../assets/user-ej.png') },
    { id: '8', username: '@nicki.zieman', name: 'Nicole Zieman', status: 'Following', avatar: require('../assets/user-ej.png') },
  ]);

  const toggleFollow = (id) => {
    const updated = followersData.map(user =>
      user.id === id
        ? { ...user, status: user.status === 'Follow' ? 'Following' : 'Follow' }
        : user
    );
    setFollowersData(updated);
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
        <TouchableOpacity onPress={() => navigation.navigate('Following')}>
          <Text style={styles.tab}>120 Following</Text>
        </TouchableOpacity>
        <Text style={[styles.tab, styles.activeTab]}>250 Followers</Text>
      </View>

      <TextInput placeholder="Search" style={styles.search} />

      <FlatList
        data={followersData}
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
