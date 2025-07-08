import { View, Text, FlatList, StyleSheet } from 'react-native';

const mockArchive = [
  { id: '1', title: 'Cheddar Burger', status: 'aprobada' },
  { id: '2', title: 'Avocado Toast', status: 'rechazada' },
];

export default function ArchiveScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de recetas</Text>
      <FlatList
        data={mockArchive}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.recipeTitle}>{item.title}</Text>
            <Text style={item.status === 'aprobada' ? styles.approved : styles.rejected}>
              {item.status}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text>No hay historial.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#f9f9f9', padding: 16, borderRadius: 8, marginBottom: 12 },
  recipeTitle: { fontSize: 18, fontWeight: '600' },
  approved: { color: 'green', fontWeight: 'bold' },
  rejected: { color: 'red', fontWeight: 'bold' },
}); 