import React from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const mockNotifications = [
  { id: '1', title: 'Nueva receta pendiente', message: 'Revisa la receta "Cheddar Burger"', time: '2h', read: false, image: require('../../../assets/french-toast.jpg'), avatar: require('../../../assets/user-ej.png') },
  { id: '2', title: 'Receta aprobada', message: 'Aprobaste "Avocado Toast"', time: '1d', read: true, image: require('../../../assets/avocado-toast.jpg'), avatar: require('../../../assets/user-ej.png') },
];

export default function AdminNotificationsScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Notificaciones admin</Text>
      <FlatList
        data={mockNotifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/(admin)/recipe')}
            style={{ marginBottom: 18 }}
          >
            <View
              style={[
                styles.card,
                { backgroundColor: item.read ? '#f8fafc' : '#fff7ed' }
              ]}
            >
              <View style={styles.avatarBlock}>
                <Image source={item.avatar} style={styles.avatar} />
                <View style={styles.avatarBorder} />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.message}>{item.message}</Text>
                <View style={styles.rowBetween}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="time-outline" size={16} color="#9ca3af" style={{ marginRight: 4 }} />
                    <Text style={styles.time}>{item.time}</Text>
                  </View>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(admin)/recipe')}>
                    <Ionicons name="eye-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.actionBtnText}>View</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Image source={item.image} style={styles.recipeImage} />
            </View>
            <View style={styles.separator} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No notifications</Text>}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingTop: 20,
  },
  header: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 18,
    marginLeft: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
    backgroundColor: '#fff',
  },
  avatarBlock: {
    position: 'relative',
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eee',
    zIndex: 2,
  },
  avatarBorder: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#f97316',
    zIndex: 1,
  },
  recipeImage: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#eee',
    marginLeft: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontFamily: 'Inter',
    fontWeight: 'bold',
    fontSize: 18,
    color: '#1e293b',
    marginBottom: 2,
  },
  message: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 6,
  },
  time: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#9ca3af',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  actionBtn: {
    backgroundColor: '#f97316',
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  actionBtnText: {
    color: '#fff',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 15,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 48,
    fontFamily: 'Inter',
    fontSize: 16,
  },
  separator: {
    height: 8,
  },
}); 