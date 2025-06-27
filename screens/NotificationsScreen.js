import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';

const notifications = [
  {
    section: 'New',
    data: [
      {
        id: 1,
        user: 'Juan Pedro',
        avatar: require('../assets/logo.png'),
        action: 'now following you',
        time: '1h',
        followed: true,
      },
    ],
  },
  {
    section: 'Today',
    data: [
      {
        id: 2,
        user: 'Facundo Potti and Nicole Zieman',
        avatar: require('../assets/user.jpeg'),
        action: 'liked your recipe',
        time: '20 min',
        image: require('../assets/french-toast.jpg'),
      },
      {
        id: 3,
        user: 'Facundo Potti',
        avatar: require('../assets/user.jpeg'),
        action: 'now following you',
        time: '1h',
        followed: true,
      },
      {
        id: 4,
        user: 'Mariana Lopez and Daniel Torres',
        avatar: require('../assets/user.jpeg'),
        action: 'liked your recipe',
        time: '20 min',
        image: require('../assets/french-toast.jpg'),
      },
    ],
  },
  {
    section: 'Yesterday',
    data: [
      {
        id: 5,
        user: 'Paulina Cocina',
        avatar: require('../assets/user-ej.png'),
        action: 'now following you',
        time: '1h',
        followed: false,
      },
      {
        id: 6,
        user: 'Miriam',
        avatar: require('../assets/gloo.png'),
        action: 'now following you',
        time: '1h',
        followed: true,
      },
    ],
  },
];

const NotificationCard = ({ item, onToggleFollow }) => (
  <View style={styles.card}>
    <Image source={item.avatar} style={styles.avatar} />
    <View style={{ flex: 1 }}>
      <Text style={styles.userText}>{item.user}</Text>
      <Text style={styles.actionText}>{item.action}  ·  <Text style={styles.timeText}>{item.time}</Text></Text>
    </View>
    {item.image && <Image source={item.image} style={styles.recipeImage} />}
    {item.followed !== undefined && (
      <TouchableOpacity
        style={[styles.followButton, item.followed ? styles.followed : styles.follow]}
        onPress={onToggleFollow}
      >
        <Text style={[styles.followButtonText, item.followed ? styles.followedText : styles.followText]}>{item.followed ? 'Followed' : 'Follow'}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const NotificationsScreen = () => {
  const [notifState, setNotifState] = useState(notifications);

  const handleToggleFollow = (sectionIdx, itemIdx) => {
    setNotifState(prev => prev.map((section, sIdx) =>
      sIdx !== sectionIdx ? section : {
        ...section,
        data: section.data.map((item, iIdx) =>
          iIdx !== itemIdx ? item : { ...item, followed: !item.followed }
        )
      }
    ));
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {notifState.map((section, sectionIdx) => (
          <View key={section.section}>
            <Text style={section.section === 'Today' ? styles.todayTitle : styles.sectionTitle}>{section.section}</Text>
            {section.data.map((item, itemIdx) => (
              <NotificationCard
                key={item.id}
                item={item}
                onToggleFollow={item.followed !== undefined ? () => handleToggleFollow(sectionIdx, itemIdx) : undefined}
              />
            ))}
          </View>
        ))}
      </ScrollView>
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabText}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={[styles.tabText, styles.activeTab]}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  todayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5FFF',
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  actionText: {
    color: '#444',
    fontSize: 13,
    marginTop: 2,
  },
  timeText: {
    color: '#888',
    fontSize: 12,
  },
  recipeImage: {
    width: 54,
    height: 54,
    borderRadius: 12,
    marginLeft: 10,
  },
  followButton: {
    marginLeft: 10,
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followed: {
    backgroundColor: '#163BA1',
  },
  follow: {
    backgroundColor: '#E97B43',
  },
  followButtonText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  followedText: {
    color: '#fff',
  },
  followText: {
    color: '#fff',
  },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    color: '#888',
    marginTop: 6,
  },
  activeTab: {
    color: '#E97B43',
    fontWeight: 'bold',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E97B43',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    shadowColor: '#E97B43',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: -2,
  },
});

export default NotificationsScreen; 