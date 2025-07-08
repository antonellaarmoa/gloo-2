import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function AdminRecipeDetail() {
  const router = useRouter();
  // Mock data
  const recipe = {
    id: '1',
    title: 'Cheddar Burger',
    description: 'Delicious burger with cheddar cheese and fresh ingredients. Perfect for any occasion!',
    image: require('../../assets/french-toast.jpg'),
    ingredients: ['Bun', 'Cheddar', 'Beef', 'Lettuce', 'Tomato'],
    steps: ['Toast bun', 'Cook beef', 'Assemble', 'Serve'],
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ paddingBottom: 32 }}>
      <Image source={recipe.image} style={styles.image} resizeMode="cover" />
      <View style={{ padding: 24 }}>
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.description}>{recipe.description}</Text>
        <View style={styles.cardBlock}>
          <Text style={styles.section}>Ingredients</Text>
          {recipe.ingredients.map((ing, i) => (
            <Text key={i} style={styles.ingredient}>• {ing}</Text>
          ))}
        </View>
        <View style={styles.cardBlock}>
          <Text style={styles.section}>Steps</Text>
          {recipe.steps.map((step, i) => (
            <Text key={i} style={styles.step}>{i + 1}. {step}</Text>
          ))}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.approve} onPress={() => router.push('/(admin)/success')}>
            <Text style={styles.actionText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reject} onPress={() => router.push('/(admin)/rejected')}>
            <Text style={styles.actionText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 220,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e40af',
    marginTop: 12,
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#374151',
    marginBottom: 18,
  },
  cardBlock: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  section: {
    fontFamily: 'Inter',
    fontWeight: 'bold',
    fontSize: 18,
    color: '#f97316',
    marginBottom: 8,
  },
  ingredient: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#1e293b',
    marginBottom: 4,
  },
  step: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#1e293b',
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  approve: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginRight: 8,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  reject: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginLeft: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  actionText: {
    color: '#fff',
    fontFamily: 'Inter',
    fontWeight: 'bold',
    fontSize: 17,
    textAlign: 'center',
  },
}); 