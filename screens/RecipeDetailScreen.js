import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

const ingredientsData = [
  { id: '1', name: 'slices of bread', quantity: 4, unit: 'slices' },
  { id: '2', name: 'large eggs', quantity: 2, unit: 'eggs' },
  { id: '3', name: 'milk', quantity: 0.5, unit: 'cup' },
  { id: '4', name: 'vanilla extract', quantity: 1, unit: 'tsp' },
  { id: '5', name: 'ground cinnamon', quantity: 0.5, unit: 'tsp' },
  { id: '6', name: 'sugar (optional)', quantity: 1, unit: 'tbsp' },
  { id: '7', name: 'salt', quantity: 1, unit: 'pinch' },
  { id: '8', name: 'butter or oil for cooking', quantity: 1, unit: 'tbsp' },
  { id: '9', name: 'Maple syrup, fruits, or sugar', quantity: 1, unit: 'optional' }
];

export default function RecipeScreen() {
  const [ingredients, setIngredients] = useState(ingredientsData);
  const [originalIngredients, setOriginalIngredients] = useState(ingredientsData);
  const [selectedOption, setSelectedOption] = useState(null);
  const [servings, setServings] = useState(2);
  const [modalVisible, setModalVisible] = useState(false);
  const [manualQuantities, setManualQuantities] = useState({});
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const navigation = useNavigation();

  const handleOptionToggle = (option) => {
    if (selectedOption === option) {
      setSelectedOption(null);
      setIngredients(originalIngredients);
      setServings(2);
      setManualQuantities({});
      return;
    }

    setSelectedOption(option);

    if (option === 'half') {
      setIngredients(originalIngredients.map(i => ({ ...i, quantity: i.quantity / 2 })));
    } else if (option === 'duplicate') {
      setIngredients(originalIngredients.map(i => ({ ...i, quantity: i.quantity * 2 })));
    } else if (option === 'set') {
      handleSetServings(servings);
    } else if (option === 'custom') {
      setModalVisible(true);
    }
  };

  const handleSetServings = (value) => {
    const ratio = value / 2;
    setServings(value);
    setIngredients(originalIngredients.map(i => ({ ...i, quantity: +(i.quantity * ratio).toFixed(2) })));
  };

  const handleManualChange = (id, newQuantity) => {
    const original = originalIngredients.find(i => i.id === id);
    const ratio = newQuantity / original.quantity;

    const updated = originalIngredients.map(i => {
      if (i.id === id) {
        return { ...i, quantity: newQuantity };
      } else {
        return { ...i, quantity: +(i.quantity * ratio).toFixed(2) };
      }
    });

    setIngredients(updated);
    setManualQuantities(prev => ({ ...prev, [id]: newQuantity }));
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const newEntry = {
      id: Date.now().toString(),
      user: 'You',
      text: newComment.trim()
    };
    setComments([...comments, newEntry]);
    setNewComment('');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
        <Image source={require('../assets/french-toast.jpg')} style={styles.image} />

        <View style={styles.headerInfo}>
          <Text style={styles.title}>French Toast</Text>
          <Text style={styles.subtitle}><Ionicons name="time-outline" size={16} /> 45 min</Text>
        </View>

        <View style={styles.userSection}>
          <Image source={require('../assets/user.jpeg')} style={styles.avatar} />
          <View>
            <Text style={styles.username}>@facu.petti</Text>
            <Text>Facundo Petti</Text>
          </View>
          <TouchableOpacity style={styles.followButton}><Text style={styles.followText}>Following</Text></TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Details</Text>
        <Text style={styles.description}>This recipe can be adjusted based on your spice preferences. Feel free to add more vegetables or adjust the level of heat by adding chili flakes or fresh chili peppers.</Text>

        <Text style={styles.sectionTitle}>Ingredients</Text>
        <Text style={{ color: '#666', marginBottom: 4 }}>Choose one of the options to modify the recipe</Text>
        <View style={styles.switchRow}>
          {['half', 'duplicate', 'set', 'custom'].map(opt => (
            <View key={opt} style={styles.switchContainer}>
              <Text style={styles.switchLabel}>{opt === 'set' ? 'Set Servings' : opt === 'custom' ? 'Amount Of Ingredients' : opt.charAt(0).toUpperCase() + opt.slice(1)}</Text>
              <Switch
                value={selectedOption === opt}
                onValueChange={() => handleOptionToggle(opt)}
              />
            </View>
          ))}
        </View>

        {selectedOption === 'set' && (
          <View style={styles.servingsInputRow}>
            <Text>Servings:</Text>
            <TextInput
              style={styles.input}
              value={String(servings)}
              keyboardType="numeric"
              onChangeText={text => handleSetServings(Number(text))}
            />
          </View>
        )}

        {ingredients.map(i => (
          <View key={i.id} style={styles.ingredientRow}>
            <Text style={styles.ingredientText}>{i.quantity} {i.unit} {i.name}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.saveButton}><Text style={styles.saveButtonText}>Save Changed Recipe</Text></TouchableOpacity>

        <Text style={styles.sectionTitle}>Steps</Text>
        {[1,2,3,4].map((num, index) => (
          <View key={num} style={styles.stepRow}>
            <Text style={styles.stepNum}>{num}</Text>
            <Text style={styles.stepText}>
              {[
                'Whisk eggs, milk, vanilla, cinnamon, sugar, and salt in a bowl until smooth.',
                'Dip bread slices into the mixture, soaking both sides evenly.',
                'Heat butter in a pan over medium heat. Cook each slice for 2–3 minutes per side until golden brown.',
                'Serve warm with your favorite toppings like syrup, fruits, or powdered sugar.'
              ][index]}
            </Text>
          </View>
        ))}

<TouchableOpacity
  style={styles.startButton}
  onPress={() => navigation.navigate('StepByStep')} 
>
  <Text style={styles.startText}>Start Cooking</Text>
</TouchableOpacity>

        <Text style={styles.sectionTitle}>Rate</Text>
        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <TouchableOpacity key={i} onPress={() => setRating(i)}>
              <FontAwesome
                name={i <= rating ? 'star' : 'star-o'}
                size={28}
                color="#F4C150"
                style={{ marginHorizontal: 4 }}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Comments</Text>
        {comments.map(comment => (
          <View key={comment.id} style={{ flexDirection: 'row', marginVertical: 6 }}>
            <Image source={require('../assets/user.jpeg')} style={{ width: 30, height: 30, borderRadius: 15, marginRight: 8 }} />
            <View style={{ backgroundColor: '#eee', padding: 8, borderRadius: 8, flex: 1 }}>
              <Text style={{ fontWeight: 'bold' }}>{comment.user}</Text>
              <Text>{comment.text}</Text>
            </View>
          </View>
        ))}

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <TextInput
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Add a comment"
            style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 }}
          />
          <TouchableOpacity onPress={handleAddComment} style={{ backgroundColor: '#F9690E', padding: 10, borderRadius: 20 }}>
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>

      </ScrollView>

      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={styles.modalContainer}>
          <Text style={styles.sectionTitle}>Adjust Ingredients</Text>
          {ingredients.map(i => (
            <View key={i.id} style={styles.modalRow}>
              <Text style={{ flex: 1 }}>{i.name}</Text>
              <TextInput
                keyboardType="numeric"
                style={styles.modalInput}
                value={manualQuantities[i.id]?.toString() || i.quantity.toString()}
                onChangeText={text => handleManualChange(i.id, Number(text))}
              />
            </View>
          ))}
          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white'
  },
  image: {
    width: '100%',
    height: 240,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  headerInfo: {
    marginTop: 12
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold'
  },
  subtitle: {
    color: '#888'
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25
  },
  username: {
    fontWeight: 'bold'
  },
  followButton: {
    backgroundColor: '#F9690E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginLeft: 'auto'
  },
  followText: {
    color: 'white'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20
  },
  description: {
    marginTop: 8,
    color: '#444'
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12
  },
  switchContainer: {
    alignItems: 'center',
    flex: 1
  },
  switchLabel: {
    fontSize: 10,
    marginBottom: 4,
    textAlign: 'center'
  },
  servingsInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 6,
    borderRadius: 6,
    width: 60
  },
  ingredientRow: {
    marginVertical: 4
  },
  ingredientText: {
    color: '#333'
  },
  saveButton: {
    backgroundColor: '#F9690E',
    padding: 10,
    marginTop: 12,
    alignItems: 'center',
    borderRadius: 8
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginVertical: 8
  },
  stepNum: {
    backgroundColor: '#F9690E',
    color: 'white',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontWeight: 'bold'
  },
  stepText: {
    flex: 1,
    color: '#333'
  },
  startButton: {
    backgroundColor: '#142E8B',
    padding: 12,
    marginTop: 16,
    borderRadius: 10,
    alignItems: 'center'
  },
  startText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  modalContainer: {
    padding: 16,
    backgroundColor: 'white'
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 6,
    width: 60,
    marginLeft: 10
  }
});
