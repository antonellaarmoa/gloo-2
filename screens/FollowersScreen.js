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
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const followersData = [
  {
    id: '1',
    username: '@john_doe',
    name: 'John Doe',
    avatar: require('../assets/user.jpeg'),
    status: 'Following',
  },
  {
    id: '2',
    username: '@jane_smith',
    name: 'Jane Smith',
    avatar: require('../assets/user-ej.png'),
    status: 'Follow',
  },
];

export default function FollowersScreen() {
  const router = useRouter();
  const [followers, setFollowers] = useState(followersData);
  const [search, setSearch] = useState('');

  const toggleFollow = (id) => {
    setFollowers((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status: f.status === 'Follow' ? 'Following' : 'Follow' } : f
      )
    );
  };

  const filteredFollowers = followers.filter(f =>
    f.username.toLowerCase().includes(search.toLowerCase()) ||
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={{ position: 'absolute', top: 57, left: 20 }}
        onPress={() => router.back()}
      >
        <Text style={{ fontSize: 24, color: '#E2773C' }}>{'<'}</Text>
      </TouchableOpacity>

      <Text style={styles.header}>@anto.armoa</Text>

      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => router.push('/following')}>
          <Text style={styles.tab}>120 Following</Text>
        </TouchableOpacity>
        <Text style={[styles.tab, styles.activeTab]}>250 Followers</Text>
      </View>

      <TextInput
        placeholder="Search"
        style={styles.search}
        value={search}
        onChangeText={setSearch}
      />

      {filteredFollowers.length === 0 ? (
        <Text style={{ textAlign: 'center', color: '#888', marginTop: 24 }}>Users not found</Text>
      ) : (
        <FlatList
          data={filteredFollowers}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.followerRow}
              onPress={() => router.push({ pathname: '/public-profile', params: { user: JSON.stringify(item) } })}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, backgroundColor: '#fff', paddingHorizontal: 24 },
  header: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 24, color: '#E2773C' },
  tabs: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  tab: { fontSize: 14, color: '#888' },
  activeTab: { color: '#142E8B', borderBottomWidth: 2, borderBottomColor: '#142E8B' },
  search: {
    backgroundColor: '#E2773C',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 20,
    color: 'white',

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
