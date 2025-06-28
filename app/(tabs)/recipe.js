import React, { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  Platform,
  SafeAreaView
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

const updateStepIngredients = (originalStepIngredients, newIngredients) => {
  return originalStepIngredients.map(stepGroup =>
    stepGroup.map(item => {
      const match = newIngredients.find(i => i.name === item.name);
      return match ? { ...item, quantity: match.quantity } : item;
    })
  );
};

export default function RecipeScreen() {
  const router = useRouter();
  const { post } = useLocalSearchParams();
  const parsedPost = JSON.parse(post);

  // Recipe-specific ingredients and steps
  const getRecipeData = (title) => {
    switch (title) {
      case 'Delicious Avocado Toast': {
        const ingredients = [
          { id: '1', name: 'Bread', quantity: 2, unit: 'slices' },
          { id: '2', name: 'Avocado', quantity: 1, unit: 'ripe' },
          { id: '3', name: 'Cherry tomatoes', quantity: 6, unit: 'pieces' },
          { id: '4', name: 'Red onion', quantity: 0.25, unit: 'small' },
          { id: '5', name: 'Lemon juice', quantity: 1, unit: 'tbsp' },
          { id: '6', name: 'Olive oil', quantity: 1, unit: 'tbsp' },
          { id: '7', name: 'Salt and pepper', quantity: 1, unit: 'to taste' },
          { id: '8', name: 'Microgreens', quantity: 1, unit: 'handful' }
        ];
        return {
          ingredients,
          steps: [
            'Toast the bread until golden brown',
            'Mash the avocado in a bowl and add lemon juice, salt, and pepper',
            'Spread the mashed avocado on the toasted bread',
            'Slice the cherry tomatoes and red onion',
            'Arrange the tomatoes and onion on top of the avocado',
            'Drizzle with olive oil and garnish with microgreens',
            'Serve immediately and enjoy!'
          ],
          stepImages: [
            require('../../assets/avocado-toast.jpg'),
            require('../../assets/avocado-toast.jpg'),
            require('../../assets/avocado-toast.jpg'),
            require('../../assets/avocado-toast.jpg'),
            require('../../assets/avocado-toast.jpg'),
            require('../../assets/avocado-toast.jpg'),
            require('../../assets/avocado-toast.jpg')
          ],
          stepIngredients: [
            [ingredients[0]],
            [ingredients[1], ingredients[4], ingredients[6]],
            [ingredients[1], ingredients[0]],
            [ingredients[2], ingredients[3]],
            [ingredients[2], ingredients[3], ingredients[1]],
            [ingredients[5]],
            [ingredients[7]],
          ]
        };
      }
      case 'French Toast Delight': {
        const ingredients = [
          { id: '1', name: 'Bread', quantity: 4, unit: 'thick slices' },
          { id: '2', name: 'Eggs', quantity: 2, unit: 'large' },
          { id: '3', name: 'Milk', quantity: 0.5, unit: 'cup' },
          { id: '4', name: 'Vanilla extract', quantity: 1, unit: 'tsp' },
          { id: '5', name: 'Cinnamon', quantity: 1, unit: 'tsp' },
          { id: '6', name: 'Butter', quantity: 2, unit: 'tbsp' },
          { id: '7', name: 'Maple syrup', quantity: 1, unit: 'to serve' },
          { id: '8', name: 'Fresh berries', quantity: 1, unit: 'handful' }
        ];
        return {
          ingredients,
          steps: [
            'In a shallow bowl, whisk together eggs, milk, vanilla, and cinnamon',
            'Dip each bread slice into the egg mixture, coating both sides',
            'Heat butter in a large skillet over medium heat',
            'Cook the bread slices for 2-3 minutes on each side until golden',
            'Transfer to a plate and keep warm',
            'Serve with maple syrup and fresh berries',
            'Enjoy your delicious French toast!'
          ],
          stepImages: [
            require('../../assets/french-toast.jpg'),
            require('../../assets/french-toast.jpg'),
            require('../../assets/french-toast.jpg'),
            require('../../assets/french-toast.jpg'),
            require('../../assets/french-toast.jpg'),
            require('../../assets/french-toast.jpg'),
            require('../../assets/french-toast.jpg')
          ],
          stepIngredients: [
            [ingredients[1], ingredients[3], ingredients[4], ingredients[2]], // Paso 1
            [ingredients[0], ingredients[1], ingredients[3], ingredients[4], ingredients[2]], // Paso 2
            [ingredients[5]], // Paso 3
            [ingredients[0], ingredients[5]], // Paso 4
            [ingredients[0]], // Paso 5
            [ingredients[6], ingredients[7]], // Paso 6
            [ingredients[7]], // Paso 7
          ]
        };
      }
      case 'Teriyaki Chicken Bowl': {
        const ingredients = [
          { id: '1', name: 'Chicken breast', quantity: 2, unit: 'pieces' },
          { id: '2', name: 'Soy sauce', quantity: 0.25, unit: 'cup' },
          { id: '3', name: 'Mirin', quantity: 2, unit: 'tbsp' },
          { id: '4', name: 'Brown sugar', quantity: 2, unit: 'tbsp' },
          { id: '5', name: 'Garlic', quantity: 2, unit: 'cloves' },
          { id: '6', name: 'Ginger', quantity: 1, unit: 'tbsp' },
          { id: '7', name: 'Rice', quantity: 1, unit: 'cup' },
          { id: '8', name: 'Broccoli', quantity: 1, unit: 'head' },
          { id: '9', name: 'Carrots', quantity: 2, unit: 'medium' },
          { id: '10', name: 'Sesame seeds', quantity: 1, unit: 'tbsp' }
        ];
        return {
          ingredients,
          steps: [
            'Cook rice according to package instructions',
            'Mix soy sauce, mirin, brown sugar, garlic, and ginger for teriyaki sauce',
            'Cut chicken into bite-sized pieces and marinate in half the sauce',
            'Heat oil in a pan and cook chicken until golden and cooked through',
            'Add remaining sauce and simmer until thickened',
            'Steam broccoli and carrots until tender',
            'Assemble bowl with rice, chicken, and vegetables',
            'Garnish with sesame seeds and serve hot'
          ],
          stepImages: [
            require('../../assets/teriyaki.jpg'),
            require('../../assets/teriyaki.jpg'),
            require('../../assets/teriyaki.jpg'),
            require('../../assets/teriyaki.jpg'),
            require('../../assets/teriyaki.jpg'),
            require('../../assets/teriyaki.jpg'),
            require('../../assets/teriyaki.jpg'),
            require('../../assets/teriyaki.jpg')
          ],
          stepIngredients: [
            [ingredients[6]], // Paso 1: Rice
            [ingredients[1], ingredients[2], ingredients[3], ingredients[4], ingredients[5]], // Paso 2: salsa
            [ingredients[0], ingredients[1], ingredients[2], ingredients[3], ingredients[4], ingredients[5]], // Paso 3: chicken + salsa
            [ingredients[0]], // Paso 4: chicken
            [ingredients[1], ingredients[3]], // Paso 5: salsa
            [ingredients[7], ingredients[8]], // Paso 6: broccoli, carrots
            [ingredients[6], ingredients[0], ingredients[7], ingredients[8]], // Paso 7: bowl
            [ingredients[9]], // Paso 8: sesame seeds
          ]
        };
      }
      default: {
        const ingredients = [
          { id: '1', name: 'Ingredient 1', quantity: 1, unit: 'cup' },
          { id: '2', name: 'Ingredient 2', quantity: 2, unit: 'tbsp' },
          { id: '3', name: 'Ingredient 3', quantity: 3, unit: 'pieces' }
        ];
        return {
          ingredients,
          steps: [
            'Step 1: Prepare your ingredients',
            'Step 2: Follow the cooking instructions',
            'Step 3: Serve and enjoy!'
          ],
          stepImages: [
            require('../../assets/avocado-toast.jpg'),
            require('../../assets/french-toast.jpg'),
            require('../../assets/teriyaki.jpg')
          ],
          stepIngredients: [
            [ingredients[0]],
            [ingredients[1]],
            [ingredients[2]],
          ]
        };
      }
    }
  };

  const recipeData = getRecipeData(parsedPost.title);
  const [ingredients, setIngredients] = useState(recipeData.ingredients);
  const [originalIngredients] = useState(recipeData.ingredients);
  const [selectedOption, setSelectedOption] = useState(null);
  const [servings, setServings] = useState(2);
  const [modalVisible, setModalVisible] = useState(false);
  const [manualQuantities, setManualQuantities] = useState({});
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isShared, setIsShared] = useState(false);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Full-screen image with overlay content */}
          <View style={styles.imageContainer}>
            <Image source={parsedPost.image} style={styles.image} />
            
            {/* Gradient overlay for better text contrast */}
            <View style={styles.imageOverlay} />
            
            {/* Back button over image */}
            <TouchableOpacity onPress={() => router.back()} style={styles.backButtonOverlay}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            {/* Recipe info over image */}
            <View style={styles.recipeInfoOverlay}>
              <Text style={styles.titleOverlay}>{parsedPost.title}</Text>
              <View style={styles.recipeMetaOverlay}>
                <View style={styles.metaItemOverlay}>
                  <Ionicons name="time-outline" size={16} color="#fff" />
                  <Text style={styles.metaTextOverlay}>{parsedPost.duration}</Text>
                </View>
                <View style={styles.metaItemOverlay}>
                  <Ionicons name="star" size={16} color="#fbbf24" />
                  <Text style={styles.metaTextOverlay}>4.8 (124 reviews)</Text>
                </View>
              </View>
            </View>
          </View>

          {/* User Section */}
          <View style={styles.userSection}>
            <Image source={parsedPost.avatar} style={styles.avatar} />
            <View style={styles.userInfo}>
              <Text style={styles.username}>{parsedPost.username}</Text>
              <Text style={styles.userHandle}>@{parsedPost.username}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.followButton, isFollowing && styles.followingButton]} 
              onPress={() => setIsFollowing(!isFollowing)}
            >
              <Text style={[styles.followText, isFollowing && styles.followingText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, isLiked && styles.actionButtonActive]} 
              onPress={() => setIsLiked(!isLiked)}
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={24} 
                color={isLiked ? "#ef4444" : "#64748b"} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, isSaved && styles.actionButtonActive]} 
              onPress={() => setIsSaved(!isSaved)}
            >
              <Ionicons 
                name={isSaved ? "bookmark" : "bookmark-outline"} 
                size={24} 
                color={isSaved ? "#fbbf24" : "#64748b"} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, isShared && styles.actionButtonActive]} 
              onPress={() => setIsShared(!isShared)}
            >
              <Ionicons 
                name={isShared ? "arrow-redo" : "arrow-redo-outline"} 
                size={24} 
                color={isShared ? "#10b981" : "#64748b"} 
              />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {parsedPost.description || 'This recipe can be adjusted based on your preferences.'}
            </Text>
          </View>

          {/* Ingredients Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <Text style={styles.sectionSubtitle}>Choose one of the options to modify the recipe</Text>
            
            <View style={styles.optionsContainer}>
              {['half', 'duplicate', 'set', 'custom'].map(opt => (
                <View key={opt} style={styles.optionContainer}>
                  <Text style={styles.optionLabel}>
                    {opt === 'set' ? 'Set Servings' : opt === 'custom' ? 'Custom Amount' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </Text>
                  <Switch
                    value={selectedOption === opt}
                    onValueChange={() => handleOptionToggle(opt)}
                    trackColor={{ false: '#e2e8f0', true: '#f97316' }}
                    thumbColor={selectedOption === opt ? '#fff' : '#f4f3f4'}
                  />
                </View>
              ))}
            </View>

            {selectedOption === 'set' && (
              <View style={styles.servingsContainer}>
                <Text style={styles.servingsLabel}>Servings:</Text>
                <TextInput
                  style={styles.servingsInput}
                  value={String(servings)}
                  keyboardType="numeric"
                  onChangeText={text => handleSetServings(Number(text))}
                />
              </View>
            )}

            <View style={styles.ingredientsList}>
              {ingredients.map(i => (
                <View key={i.id} style={styles.ingredientItem}>
                  <View style={styles.ingredientBullet} />
                  <Text style={styles.ingredientText}>
                    {i.quantity} {i.unit} {i.name}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save Changed Recipe</Text>
            </TouchableOpacity>
          </View>

          {/* Steps Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <View style={styles.stepsList}>
              {(parsedPost.steps || recipeData.steps).map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.startButton}
              onPress={() => {
                router.push({
                  pathname: '/step-by-step',
                  params: {
                    post: JSON.stringify(parsedPost),
                    steps: JSON.stringify(parsedPost.steps || recipeData.steps),
                    stepImages: JSON.stringify(parsedPost.stepImages || []),
                    stepIngredients: JSON.stringify(recipeData.stepIngredients || [])
                  }
                });
              }}
            >
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.startText}>Start Cooking</Text>
            </TouchableOpacity>
          </View>

          {/* Rating Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rate this Recipe</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map(i => (
                <TouchableOpacity key={i} onPress={() => setRating(i)} style={styles.starButton}>
                  <FontAwesome
                    name={i <= rating ? 'star' : 'star-o'}
                    size={28}
                    color="#fbbf24"
                  />
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && (
              <Text style={styles.ratingText}>You rated this recipe {rating} star{rating > 1 ? 's' : ''}</Text>
            )}
          </View>

          {/* Comments Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comments</Text>
            <View style={styles.commentsList}>
              {comments.map(comment => (
                <View key={comment.id} style={styles.commentItem}>
                  <Image source={require('../../assets/user.jpeg')} style={styles.commentAvatar} />
                  <View style={styles.commentContent}>
                    <Text style={styles.commentUser}>{comment.user}</Text>
                    <Text style={styles.commentText}>{comment.text}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.commentInputContainer}>
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Add a comment..."
                placeholderTextColor="#9ca3af"
                style={styles.commentInput}
              />
              <TouchableOpacity onPress={handleAddComment} style={styles.sendButton}>
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Modal for custom ingredients */}
        <Modal visible={modalVisible} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adjust Ingredients</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {ingredients.map(i => (
                <View key={i.id} style={styles.modalIngredientItem}>
                  <Text style={styles.modalIngredientName}>{i.name}</Text>
                  <TextInput
                    keyboardType="numeric"
                    style={styles.modalIngredientInput}
                    value={manualQuantities[i.id]?.toString() || i.quantity.toString()}
                    onChangeText={text => handleManualChange(i.id, Number(text))}
                  />
                </View>
              ))}
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalSaveButton}>
                <Text style={styles.modalSaveButtonText}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white'
  },
  imageContainer: {
    position: 'relative',
    height: 280,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden'
  },
  image: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  backButtonOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: 5
  },
  recipeInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10
  },
  titleOverlay: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white'
  },
  recipeMetaOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8
  },
  metaItemOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  metaTextOverlay: {
    color: 'white'
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
  userInfo: {
    flex: 1
  },
  username: {
    fontWeight: 'bold'
  },
  userHandle: {
    color: '#888'
  },
  followButton: {
    backgroundColor: '#F9690E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 'auto'
  },
  followText: {
    color: 'white'
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16
  },
  actionButton: {
    backgroundColor: '#f4f3f4',
    padding: 10,
    borderRadius: 20
  },
  actionButtonActive: {
    backgroundColor: '#f97316'
  },
  section: {
    marginTop: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8
  },
  sectionSubtitle: {
    color: '#888',
    marginBottom: 4
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  optionContainer: {
    alignItems: 'center',
    flex: 1
  },
  optionLabel: {
    fontSize: 10,
    marginBottom: 4,
    textAlign: 'center'
  },
  servingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10
  },
  servingsLabel: {
    fontWeight: 'bold'
  },
  servingsInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 6,
    borderRadius: 6,
    width: 60
  },
  ingredientsList: {
    marginBottom: 12
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4
  },
  ingredientBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333'
  },
  ingredientText: {
    color: '#333'
  },
  saveButton: {
    backgroundColor: '#F9690E',
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
    borderRadius: 50
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  stepsList: {
    marginBottom: 12
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginVertical: 8
  },
  stepNumber: {
    backgroundColor: '#F9690E',
    color: 'white',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontWeight: 'bold'
  },
  stepNumberText: {
    fontWeight: 'bold'
  },
  stepText: {
    flex: 1,
    color: '#333'
  },
  startButton: {
    backgroundColor: '#142E8B',
    padding: 14,
    marginTop: 16,
    borderRadius: 50,
    alignItems: 'center'
  },
  startText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16
  },
  starButton: {
    padding: 10
  },
  ratingText: {
    color: '#888',
    marginTop: 8
  },
  commentsList: {
    marginBottom: 12
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 6
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8
  },
  commentContent: {
    flex: 1
  },
  commentUser: {
    fontWeight: 'bold'
  },
  commentText: {
    color: '#333'
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  sendButton: {
    backgroundColor: '#F9690E',
    padding: 10,
    borderRadius: 20
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 'auto'
  },
  closeButton: {
    padding: 5
  },
  modalContent: {
    padding: 16
  },
  modalIngredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8
  },
  modalIngredientName: {
    flex: 1
  },
  modalIngredientInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 6,
    width: 60,
    marginLeft: 10
  },
  modalSaveButton: {
    backgroundColor: '#F9690E',
    padding: 12,
    alignItems: 'center',
    borderRadius: 50
  },
  modalSaveButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  followingButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 'auto'
  },
  followingText: {
    color: 'white'
  },
  description: {
    color: '#64748b',
    lineHeight: 20,
    marginTop: 4
  }
}); 