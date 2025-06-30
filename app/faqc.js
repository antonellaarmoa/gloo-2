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
        <Text style={styles.sectionTitle}>Cuenta y Perfil</Text>
        {[
          {
            question: '¿Cómo puedo crear una cuenta?',
            answer: `Puedes registrarte con tu email o usar tu cuenta de Google/Apple. Solo llena información básica.`,
          },
          {
            question: 'Olvidé mi contraseña. ¿Qué debo hacer?',
            answer: `En la pantalla de login, toca "¿Olvidaste tu contraseña?" y sigue los pasos para restablecerla.`,
          },
          {
            question: '¿Puedo editar mi perfil?',
            answer: `Sí. Ve a tu perfil, toca el ícono de configuración, y puedes actualizar tu nombre, foto, biografía y más.`,
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
        <Text style={styles.sectionTitle}>Interacción y Comunidad</Text>
        {[
          {
            question: '¿Cómo puedo seguir a otros usuarios?',
            answer: `Desde su perfil, solo toca el botón "seguir". Verás sus nuevas recetas en tu feed principal.`,
          },
          {
            question: '¿Puedo comentar o calificar recetas?',
            answer: `¡Sí! Al final de cada receta, puedes dejar un comentario y calificarla con estrellas.`,
          },
          {
            question: '¿Puedo guardar recetas para ver después?',
            answer: `Absolutamente. Toca el ícono de guardar para agregarlas a tus favoritos o una colección personalizada.`,
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
        <Text style={styles.sectionTitle}>Búsqueda y Descubrimiento</Text>
        {[
          {
            question: '¿Cómo encuentro recetas específicas?',
            answer: `Usa la barra de búsqueda para buscar recetas por nombre, ingrediente o categoría (ej. "Sin Gluten", "Comidas Rápidas", "Postres").`,
          },
          {
            question: '¿Puedo buscar usando ingredientes que tengo en casa?',
            answer: `¡Sí! Usa la búsqueda avanzada para ingresar ingredientes que tienes, y te mostraremos recetas que coincidan.`,
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

      {/* Sección: Creación de Recetas */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Creación de Recetas</Text>
        {[
          {
            question: '¿Cómo puedo crear una receta?',
            answer: `Ve a la pestaña "Create" en la barra de navegación inferior. Allí podrás agregar título, ingredientes, instrucciones y una foto.`,
          },
          {
            question: '¿Puedo editar mis recetas después de publicarlas?',
            answer: `Sí, puedes editar tus recetas desde tu perfil. Busca la receta y toca el ícono de editar.`,
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