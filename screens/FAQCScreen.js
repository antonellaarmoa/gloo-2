import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function FAQCScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      {/* Encabezado con flecha y título */}
      <View style={styles.headerContainer}>
        <View style={styles.backButton}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <Text style={styles.header}>FAQ Center</Text>
      </View>

      {/* Sección: Account And Profile */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account And Profile</Text>
        {[
          {
            question: 'How do I create an account?',
            answer: `You can sign up with your email or use your Google/Apple account. Just fill in some basic info.`,
          },
          {
            question: 'I forgot my password. What should I do?',
            answer: `On the login screen, tap "forgot your password?" and follow the steps to reset it.`,
          },
          {
            question: 'Can I edit my profile?',
            answer: `Yes. Go to your profile, tap the settings icon, and you can update your name, photo, bio, and more.`,
          },
        ].map((item, index) => (
          <View key={index} style={styles.qaItem}>
            <Text style={styles.question}>
              • <Text style={styles.bold}>{item.question}</Text>
            </Text>
            <Text style={styles.answer}>{item.answer}</Text>
          </View>
        ))}
      </View>

      <View style={styles.separator} />

      {/* Sección: Interaction & Community */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Interaction & Community</Text>
        {[
          {
            question: 'How can I follow other users?',
            answer: `From their profile, just tap the "follow" button. You'll see their new recipes on your home feed.`,
          },
          {
            question: 'Can I comment on or rate recipes?',
            answer: `Yes! At the bottom of each recipe, you can leave a comment and rate it with stars.`,
          },
          {
            question: 'Can I save recipes to view later?',
            answer: `Absolutely. Tap the save icon to add them to your favorites or a custom collection.`,
          },
        ].map((item, index) => (
          <View key={index} style={styles.qaItem}>
            <Text style={styles.question}>
              • <Text style={styles.bold}>{item.question}</Text>
            </Text>
            <Text style={styles.answer}>{item.answer}</Text>
          </View>
        ))}
      </View>

      <View style={styles.separator} />

      {/* Sección: Search And Discover */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Search And Discover</Text>
        {[
          {
            question: 'How do I find specific recipes?',
            answer: `Use the search bar to look for recipes by name, ingredient, or category (e.g., "Gluten-Free", "Quick Meals", "Desserts").`,
          },
          {
            question: 'Can I search using ingredients I have at home?',
            answer: `Yes! Use the advanced search to enter ingredients you have, and we'll show you matching recipes.`,
          },
        ].map((item, index) => (
          <View key={index} style={styles.qaItem}>
            <Text style={styles.question}>
              • <Text style={styles.bold}>{item.question}</Text>
            </Text>
            <Text style={styles.answer}>{item.answer}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 36,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    position: 'relative',
    minHeight: 32,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    zIndex: 2,
    padding: 4,
  },
  header: {
    fontSize: 20,
    fontFamily: 'DynaPuff',
    color: '#E2773C',
    textAlign: 'center',
    flex: 1,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginHorizontal: 16,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    marginBottom: 24,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: 'bold',
    color: '#1B1B8A',
    marginBottom: 10,
    marginTop: 8,
  },
  qaItem: {
    marginBottom: 14,
  },
  question: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: '#000',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  bold: {
    fontWeight: 'bold',
  },
  answer: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: '#444',
    marginLeft: 16,
    marginTop: 2,
  },
  separator: {
    height: 2,
    width: 110,
    backgroundColor: '#E2773C',
    alignSelf: 'center',
    marginVertical: 16,
    borderRadius: 2,
  },
});
