import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ImageBackground, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';

const { height, width } = Dimensions.get('window');

export default function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    {
      name: 'home',
      title: 'Home',
      icon: 'home-outline',
      href: '/(tabs)/home'
    },
    {
      name: 'search',
      title: 'Search',
      icon: 'search-outline',
      href: '/(tabs)/search'
    },
    {
      name: 'create-recipe',
      title: 'Create',
      icon: 'add',
      href: '/(tabs)/create-recipe',
      isCreate: true
    },
    {
      name: 'notification',
      title: 'Notifications',
      icon: 'notifications-outline',
      href: '/(tabs)/notification'
    },
    {
      name: 'profile',
      title: 'Profile',
      icon: 'person-outline',
      href: '/(tabs)/profile'
    }
  ];

  const handleTabPress = (tab) => {
    if (tab.href) {
      router.push(tab.href);
    }
  };

  const isActiveTab = (tab) => {
    return pathname === tab.href;
  };

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          style={styles.tabItem}
          onPress={() => handleTabPress(tab)}
        >
          {tab.isCreate ? (
            <View style={styles.createButton}>
              <Ionicons name={tab.icon} size={28} color="#fff" />
            </View>
          ) : (
            <>
              <Ionicons 
                name={tab.icon} 
                size={24} 
                color={isActiveTab(tab) ? '#f97316' : '#9ca3af'} 
              />
              <Text style={[
                styles.tabLabel, 
                { color: isActiveTab(tab) ? '#f97316' : '#9ca3af' }
              ]}>
                {tab.title}
              </Text>
            </>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    height: 80,
    paddingBottom: 12,
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  createButton: {
    backgroundColor: '#f97316',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}); 