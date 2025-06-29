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
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://gloo-api-production.up.railway.app/api/v1/recipes';

function fetchRecipes() {
  return fetch(API_URL)
    .then(res => {
      if (!res.ok) throw new Error('Error fetching recipes');
      return res.json();
    })
    .then(json => json.data || []);
}

function fetchRecipeById(id) {
  return fetch(`${API_URL}/${id}`)
    .then(res => {
      if (!res.ok) throw new Error('Error fetching recipe');
      return res.json();
    })
    .then(json => json.data);
}

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
  const { post, id } = useLocalSearchParams();
  const { isSignedIn, userId } = useAuth();

  // Si viene el id, buscar del backend, si no, usar el post serializado (para compatibilidad)
  const recipeId = id || (post && JSON.parse(post)?.id);
  
  // Obtener todas las recetas (el endpoint individual no existe)
  const { data: allRecipes, isLoading, error } = useQuery({
    queryKey: ['all-recipes'],
    queryFn: fetchRecipes,
    enabled: true,
  });

  // Buscar la receta específica en la lista general
  const recipe = allRecipes ? allRecipes.find(r => r.id.toString() === recipeId?.toString()) : null;

  // fallback para compatibilidad con navegación anterior
  const parsedPost = recipe || (post ? JSON.parse(post) : {});

  // Adaptar los datos para la UI
  const ingredients = parsedPost.ingredients || [];
  const steps = parsedPost.instructions || [];
  const stepImages = parsedPost.stepImages || [];
  const stepIngredients = parsedPost.stepIngredients || [];

  // Procesar los pasos para extraer solo el texto
  const processedSteps = Array.isArray(steps) ? steps.map(step => {
    if (typeof step === 'string') {
      return step;
    } else if (typeof step === 'object' && step.description) {
      return step.description;
    } else if (typeof step === 'object' && step.step) {
      return step.step;
    } else {
      return 'Step description not available';
    }
  }) : [];

  // Procesar los ingredientes para extraer solo los datos necesarios
  const processedIngredients = Array.isArray(ingredients) ? ingredients.map(ing => {
    if (typeof ing === 'object' && ing.name) {
      return {
        id: ing.id || Math.random().toString(),
        name: ing.name,
        quantity: ing.quantity || ing.amount || 1,
        unit: ing.unit || ''
      };
    } else {
      return {
        id: Math.random().toString(),
        name: 'Ingredient',
        quantity: 1,
        unit: ''
      };
    }
  }) : [];

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
  const [showGuestOverlay, setShowGuestOverlay] = useState(false);
  const [currentIngredients, setCurrentIngredients] = useState(processedIngredients);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);

  // Función para obtener imagen de receta con fallback
  const getRecipeImageSource = () => {
    const title = parsedPost.title?.toLowerCase() || '';
    console.log('Recipe title for image detection:', title);
    
    // Forzar fallback para tacos de carnitas mexicanos
    if (title.includes('carnitas') || title.includes('tacos de carnitas')) {
      console.log('Using carnitas specific image for:', title);
      return require('../../assets/french-toast.jpg'); // Imagen específica para carnitas
    }
    
    // Verificar si tiene imagen en el backend
    if (parsedPost.image && parsedPost.image !== 'null' && parsedPost.image !== '') {
      console.log('Using backend image for:', parsedPost.title, parsedPost.image);
      return typeof parsedPost.image === 'string' ? { uri: parsedPost.image } : parsedPost.image;
    }
    
    // Fallback basado en el título de la receta
    if (title.includes('teriyaki') || title.includes('chicken bowl')) {
      return require('../../assets/teriyaki.jpg');
    } else if (title.includes('avocado') || title.includes('toast')) {
      return require('../../assets/avocado-toast.jpg');
    } else if (title.includes('french') || title.includes('toast')) {
      return require('../../assets/french-toast.jpg');
    } else if (title.includes('tacos') || title.includes('mexican') || title.includes('taco') || title.includes('pork')) {
      console.log('Using taco fallback image for:', title);
      return require('../../assets/teriyaki.jpg'); // Usar teriyaki como fallback para otros tacos
    } else {
      console.log('Using default image for:', title);
      // Imagen por defecto
      return require('../../assets/avocado-toast.jpg');
    }
  };

  const handleOptionToggle = (option) => {
    if (selectedOption === option) {
      setSelectedOption(null);
      setCurrentIngredients(processedIngredients);
      setServings(2);
      setManualQuantities({});
      return;
    }

    setSelectedOption(option);

    if (option === 'half') {
      setCurrentIngredients(processedIngredients.map(i => ({ ...i, quantity: i.quantity / 2 })));
    } else if (option === 'duplicate') {
      setCurrentIngredients(processedIngredients.map(i => ({ ...i, quantity: i.quantity * 2 })));
    } else if (option === 'set') {
      handleSetServings(servings);
    } else if (option === 'custom') {
      setModalVisible(true);
    }
  };

  const handleSetServings = (value) => {
    const ratio = value / 2;
    setServings(value);
    setCurrentIngredients(processedIngredients.map(i => ({ ...i, quantity: +(i.quantity * ratio).toFixed(2) })));
  };

  const handleManualChange = (id, newQuantity) => {
    const original = processedIngredients.find(i => i.id === id);
    const ratio = newQuantity / original.quantity;

    const updated = processedIngredients.map(i => {
      if (i.id === id) {
        return { ...i, quantity: newQuantity };
      } else {
        return { ...i, quantity: +(i.quantity * ratio).toFixed(2) };
      }
    });

    setCurrentIngredients(updated);
    setManualQuantities(prev => ({ ...prev, [id]: newQuantity }));
  };

  const handleAddComment = () => {
    if (!isSignedIn) {
      setShowGuestOverlay(true);
      return;
    }
    if (!newComment.trim()) return;
    const newEntry = {
      id: Date.now().toString(),
      user: 'You',
      text: newComment.trim()
    };
    setComments([...comments, newEntry]);
    setNewComment('');
  };

  const handleStartCooking = () => {
    if (!isSignedIn) {
      setShowGuestOverlay(true);
      return;
    }
    
    // Siempre pasar los ingredientes actuales como JSON
    const ingredientsParam = JSON.stringify(currentIngredients);
    console.log('Ingredientes que se pasan a step-by-step:', currentIngredients);
    
    if (recipeId) {
      router.push({
        pathname: '/step-by-step',
        params: { id: recipeId, ingredients: ingredientsParam }
      });
    } else {
      router.push({
        pathname: '/step-by-step',
        params: {
          post: JSON.stringify(parsedPost),
          steps: JSON.stringify(steps),
          stepImages: JSON.stringify(stepImages),
          stepIngredients: JSON.stringify(stepIngredients),
          ingredients: ingredientsParam
        }
      });
    }
  };

  const handleRating = (value) => {
    if (!isSignedIn) {
      setShowGuestOverlay(true);
      return;
    }
    setRating(value);
  };

  const handleSaveRecipe = () => {
    if (!isSignedIn) {
      setShowGuestOverlay(true);
      return;
    }
    // Aquí iría la lógica de guardar cambios
  };

  const handleSaveModifiedRecipe = async () => {
    if (!isSignedIn) {
      setShowGuestOverlay(true);
      return;
    }

    // Verificar que algún switch esté activado
    if (!selectedOption) {
      Alert.alert('Error', 'Debes modificar la receta antes de guardarla');
      return;
    }

    setSavingRecipe(true);

    try {
      // Crear la receta modificada para guardar localmente
      const modifiedRecipe = {
        id: Date.now(), // ID único local
        title: `${parsedPost.title} (Modificada)`,
        description: `${parsedPost.description || 'Receta original'} - Modificada con ${selectedOption === 'half' ? 'mitad' : selectedOption === 'duplicate' ? 'doble' : selectedOption === 'set' ? `${servings} porciones` : 'cantidades personalizadas'}`,
        estimatedTime: parsedPost.estimatedTime || 30,
        image: parsedPost.image || null,
        ingredients: currentIngredients,
        instructions: processedSteps,
        originalRecipeId: parsedPost.id,
        modificationType: selectedOption,
        servings: selectedOption === 'set' ? servings : 2,
        createdAt: new Date().toISOString(),
        userId: userId,
        isModified: true, // Marcar como receta modificada
      };

      console.log('Saving modified recipe locally:', modifiedRecipe);

      // Guardar en AsyncStorage
      const existingModifiedRecipes = await AsyncStorage.getItem('@gloo:modifiedRecipes');
      const modifiedRecipes = existingModifiedRecipes ? JSON.parse(existingModifiedRecipes) : [];
      
      // Agregar la nueva receta modificada
      modifiedRecipes.push(modifiedRecipe);
      
      // Guardar en AsyncStorage
      await AsyncStorage.setItem('@gloo:modifiedRecipes', JSON.stringify(modifiedRecipes));
      
      console.log('Modified recipe saved locally successfully');
      setShowSaveModal(true);
      
    } catch (error) {
      console.error('Error saving modified recipe locally:', error);
      Alert.alert('Error', 'No se pudo guardar la receta modificada');
    } finally {
      setSavingRecipe(false);
    }
  };

  const userData = parsedPost.user || {};
  const username =
    parsedPost.username ||
    userData.username ||
    (userData.email ? userData.email.split('@')[0] : null) ||
    'Chef Anónimo';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Full-screen image with overlay content */}
          <View style={styles.imageContainer}>
            <Image 
              source={getRecipeImageSource()} 
              style={styles.image} 
            />
            
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
                  <Text style={styles.metaTextOverlay}>{parsedPost.duration || parsedPost.estimatedTime ? `${parsedPost.estimatedTime} min` : ''}</Text>
                </View>
                <View style={styles.metaItemOverlay}>
                  <Ionicons name="star" size={16} color="#fbbf24" />
                  <Text style={styles.metaTextOverlay}>{parsedPost.rates || 4.8} ({parsedPost.reviews || 124} reviews)</Text>
                </View>
              </View>
            </View>
          </View>

          {/* User Section */}
          <View style={styles.userSection}>
            <Image 
              source={parsedPost.avatar ? 
                (typeof parsedPost.avatar === 'string' ? { uri: parsedPost.avatar } : parsedPost.avatar) : 
                (parsedPost.user?.imageUrl ? { uri: parsedPost.user.imageUrl } : require('../../assets/user.jpeg'))
              } 
              style={styles.avatar} 
            />
            <View style={styles.userInfo}>
              <Text style={styles.username}>@{username}</Text>
              <Text style={styles.userHandle}>@{username}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.followButton, isFollowing && styles.followingButton]} 
              onPress={() => {
                if (!isSignedIn) {
                  setShowGuestOverlay(true);
                  return;
                }
                setIsFollowing(!isFollowing);
              }}
            >
              <Text style={[styles.followText, isFollowing && styles.followingText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => {
                if (!isSignedIn) {
                  setShowGuestOverlay(true);
                  return;
                }
                setIsLiked(!isLiked);
              }}
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={24} 
                color={isLiked ? "#ef4444" : "#64748b"} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => {
              if (!isSignedIn) {
                setShowGuestOverlay(true);
                return;
              }
              setIsSaved(!isSaved);
            }}>
              <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color={isSaved ? "#fbbf24" : "#64748b"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => {
              if (!isSignedIn) {
                setShowGuestOverlay(true);
                return;
              }
              setIsShared(!isShared);
            }}>
              <Ionicons name="share-outline" size={24} color={isShared ? "#10b981" : "#64748b"} />
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
                    onValueChange={() => {
                      if (!isSignedIn) {
                        setShowGuestOverlay(true);
                        return;
                      }
                      handleOptionToggle(opt);
                    }}
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
              {currentIngredients.map(i => (
                <View key={i.id} style={styles.ingredientItem}>
                  <View style={styles.ingredientBullet} />
                  <Text style={styles.ingredientText}>
                    {i.quantity} {i.unit} {i.name}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={[
                styles.saveButton, 
                !selectedOption && styles.saveButtonDisabled
              ]} 
              onPress={handleSaveModifiedRecipe}
              disabled={!selectedOption || savingRecipe}
            >
              <Text style={styles.saveButtonText}>
                {savingRecipe ? 'Guardando...' : 'Save Changed Recipe'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Steps Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <View style={styles.stepsList}>
              {processedSteps.map((step, index) => (
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
              onPress={handleStartCooking}
            >
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.startText}>Start Cooking</Text>
            </TouchableOpacity>
          </View>

          {/* Rating Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rate this recipe</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  style={styles.starButton}
                  onPress={() => handleRating(star)}
                >
                  <Ionicons
                    name={star <= rating ? "star" : "star-outline"}
                    size={24}
                    color={star <= rating ? "#fbbf24" : "#ccc"}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingText}>Your rating: {rating}/5</Text>
          </View>

          {/* Comments Section */}
          <View style={styles.section}>
            <View style={styles.commentsHeader}>
              <Text style={styles.sectionTitle}>Comments</Text>
              <TouchableOpacity 
                style={styles.viewAllCommentsButton}
                onPress={() => router.push({ pathname: '/comment', params: { id: recipeId } })}
              >
                <Text style={styles.viewAllCommentsText}>View All</Text>
                <Ionicons name="chevron-forward" size={16} color="#F9690E" />
              </TouchableOpacity>
            </View>
            <View style={styles.commentsList}>
              {comments.slice(0, 3).map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <Text style={styles.commentUser}>{comment.user}</Text>
                  <Text style={styles.commentText}>{comment.text}</Text>
                </View>
              ))}
            </View>
            {comments.length > 3 && (
              <TouchableOpacity 
                style={styles.moreCommentsButton}
                onPress={() => router.push({ pathname: '/comment', params: { id: recipeId } })}
              >
                <Text style={styles.moreCommentsText}>View {comments.length - 3} more comments</Text>
              </TouchableOpacity>
            )}
            <View style={styles.addCommentContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                value={newComment}
                onChangeText={setNewComment}
                multiline
              />
              <TouchableOpacity style={styles.addCommentButton} onPress={handleAddComment}>
                <Text style={styles.addCommentButtonText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Modal for custom ingredients */}
        <Modal visible={modalVisible} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Customize Ingredients</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              {currentIngredients.map(i => (
                <View key={i.id} style={styles.modalIngredientItem}>
                  <Text style={styles.modalIngredientName}>{i.name}</Text>
                  <TextInput
                    style={styles.modalIngredientInput}
                    value={String(i.quantity)}
                    keyboardType="numeric"
                    onChangeText={text => handleManualChange(i.id, Number(text))}
                  />
                  <Text>{i.unit}</Text>
                </View>
              ))}
              <TouchableOpacity style={styles.modalSaveButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalSaveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

        {/* Save Confirmation Modal */}
        <Modal visible={showSaveModal} animationType="fade" transparent>
          <View style={styles.saveModalOverlay}>
            <View style={styles.saveModalContent}>
              <View style={styles.saveModalIcon}>
                <Ionicons name="checkmark-circle" size={64} color="#10b981" />
              </View>
              <Text style={styles.saveModalTitle}>¡Receta Guardada!</Text>
              <Text style={styles.saveModalText}>
                La receta modificada se ha guardado en la sección "Changed" de tu perfil.
              </Text>
              <TouchableOpacity 
                style={styles.saveModalButton}
                onPress={() => setShowSaveModal(false)}
              >
                <Text style={styles.saveModalButtonText}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Overlay para guest users */}
        {showGuestOverlay && !isSignedIn && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', maxWidth: 320 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#F9690E', marginBottom: 12, textAlign: 'center' }}>Create an account to unlock all recipes!</Text>
              <Text style={{ fontSize: 16, color: '#333', marginBottom: 24, textAlign: 'center' }}>
                Sign up or log in to access all recipes, save, comment, and rate. Join our foodie community!
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: '#142E8B', borderRadius: 50, paddingVertical: 12, paddingHorizontal: 32, marginBottom: 12 }}
                onPress={() => router.replace('/(auth)/sign-in')}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Sign In / Create Account</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowGuestOverlay(false)}>
                <Text style={{ color: '#F9690E', fontWeight: 'bold', fontSize: 16, marginTop: 8 }}>Continue as Guest</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    fontWeight: 'bold',
    color: '#F9690E',
    fontSize: 18,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  userHandle: {
    color: '#888',
    fontSize: 13,
    marginBottom: 2,
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
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16
  },
  actionButtonText: {
    color: '#333',
    fontWeight: 'bold'
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12
  },
  addCommentButton: {
    backgroundColor: '#F9690E',
    padding: 10,
    borderRadius: 20
  },
  addCommentButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  viewAllCommentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  viewAllCommentsText: {
    color: '#F9690E',
    fontWeight: 'bold'
  },
  moreCommentsButton: {
    backgroundColor: '#F9690E',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center'
  },
  moreCommentsText: {
    color: 'white',
    fontWeight: 'bold'
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
    borderRadius: 50
  },
  saveModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  saveModalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    maxWidth: '80%',
    alignItems: 'center'
  },
  saveModalIcon: {
    backgroundColor: '#10b981',
    borderRadius: 50,
    padding: 20,
    marginBottom: 20
  },
  saveModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center'
  },
  saveModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24
  },
  saveModalButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25
  },
  saveModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  }
}); 