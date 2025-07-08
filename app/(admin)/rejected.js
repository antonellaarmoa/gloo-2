import { View, Text, StyleSheet } from 'react-native';

export default function AdminRejected() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>❌</Text>
      <Text style={styles.title}>Receta rechazada</Text>
      <Text style={styles.subtitle}>La receta fue rechazada.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888' },
}); 