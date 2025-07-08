import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const mockArchive = [
  { id: '1', title: 'Cheddar Burger', status: 'aprobada', date: '2024-06-01' },
  { id: '2', title: 'Avocado Toast', status: 'rechazada', date: '2024-05-28' },
];

export default function ArchiveScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Historial admin</Text>
      <FlatList
        data={mockArchive}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              { backgroundColor: item.status === 'aprobada' ? '#f0fdf4' : '#fef2f2' }
            ]}
          >
            <Ionicons
              name={item.status === 'aprobada' ? 'checkmark-circle-outline' : 'close-circle-outline'}
              size={38}
              color={item.status === 'aprobada' ? '#22c55e' : '#ef4444'}
              style={{ marginRight: 16 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.rowBetween}>
                <View style={[styles.badge, item.status === 'aprobada' ? styles.approved : styles.rejected]}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
                <Text style={styles.date}>{item.date}</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No archive items yet</Text>}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </View>
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
    marginBottom: 18,
  },
  title: {
    fontFamily: 'Inter',
    fontWeight: 'bold',
    fontSize: 18,
    color: '#1e293b',
    marginBottom: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  badge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: 'Inter',
    fontWeight: 'bold',
    fontSize: 14,
    color: '#fff',
    textTransform: 'capitalize',
  },
  approved: {
    backgroundColor: '#22c55e',
  },
  rejected: {
    backgroundColor: '#ef4444',
  },
  date: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#9ca3af',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 48,
    fontFamily: 'Inter',
    fontSize: 16,
  },
}); 