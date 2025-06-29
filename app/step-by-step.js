import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

const { width } = Dimensions.get('window');

const API_URL = 'https://gloo-api-production.up.railway.app/api/v1/recipes';

function fetchRecipes() {
  console.log('Fetching all recipes from:', API_URL);
  return fetch(API_URL)
    .then(res => {
      console.log('All recipes response status:', res.status);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(json => {
      console.log('All recipes response:', json);
      return json.data || [];
    })
    .catch(error => {
      console.log('Fetch all recipes error:', error);
      throw error;
    });
}

function fetchRecipeById(id) {
  console.log('Fetching recipe with ID:', id);
  console.log('Full URL:', `${API_URL}/${id}`);
  
  return fetch(`${API_URL}/${id}`)
    .then(res => {
      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);
      
      if (!res.ok) {
        console.log('Response not ok, throwing error');
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      return res.json();
    })
    .then(json => {
      console.log('Response JSON:', json);
      return json.data;
    })
    .catch(error => {
      console.log('Fetch error:', error);
      throw error;
    });
}

export default function StepByStepScreen() {
  const router = useRouter();
  const { steps, stepImages, recipeTitle = 'Recipe', stepIngredients, post, id, ingredients } = useLocalSearchParams();

  // Si viene el id, buscar del backend, si no, usar los datos serializados (para compatibilidad)
  const recipeId = id || (post && JSON.parse(post)?.id);
  
  console.log('=== STEP BY STEP DEBUG ===');
  console.log('Received params:', { steps, stepImages, recipeTitle, stepIngredients, post, id });
  console.log('Recipe ID calculated:', recipeId);
  console.log('Recipe ID type:', typeof recipeId);
  console.log('Recipe ID is valid:', recipeId && recipeId !== 'undefined' && recipeId !== 'null');
  console.log('Post parsed:', post ? JSON.parse(post) : 'No post');
  
  // Obtener todas las recetas (el endpoint individual no existe)
  const { data: allRecipes, isLoading: loadingAll, error: allRecipesError } = useQuery({
    queryKey: ['all-recipes'],
    queryFn: fetchRecipes,
    enabled: true,
  });

  // Buscar la receta específica en la lista general
  const recipe = allRecipes ? allRecipes.find(r => r.id.toString() === recipeId?.toString()) : null;

  console.log('All recipes available:', allRecipes);
  console.log('Found recipe:', recipe);
  console.log('Recipe ID to find:', recipeId);

  // fallback para compatibilidad con navegación anterior
  const parsedPost = recipe || (post ? JSON.parse(post) : {});
  
  // Usar datos del backend o los pasados por parámetros
  const stepsData = recipe?.instructions || JSON.parse(steps || '[]');
  const stepImagesData = recipe?.stepImages || JSON.parse(stepImages || '[]');
  const stepIngredientsData = recipe?.stepIngredients || JSON.parse(stepIngredients || '[]');
  const recipeTitleData = recipe?.title || recipeTitle;

  // Ingredientes modificados (si existen)
  const modifiedIngredients = ingredients ? JSON.parse(ingredients) : (recipe?.ingredients || parsedPost.ingredients || []);

  // DEBUG: Mostrar ingredientes recibidos
  useEffect(() => {
    console.log('Ingredientes recibidos en step-by-step:', modifiedIngredients);
  }, [ingredients]);

  // Procesar los pasos para extraer solo el texto
  const processedSteps = Array.isArray(stepsData) ? stepsData.map(step => {
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

  // Procesar imágenes por paso
  const processedStepImages = [];
  if (Array.isArray(recipe?.stepImages) && recipe.stepImages.length > 0) {
    // Si hay stepImages específicos del backend, usarlos
    processedStepImages.push(...recipe.stepImages.map(img => {
      if (typeof img === 'string') {
        return img;
      } else if (typeof img === 'object' && img.image) {
        return img.image;
      } else {
        return null;
      }
    }));
  } else if (Array.isArray(stepImagesData) && stepImagesData.length > 0) {
    // Si hay stepImages pasados por parámetros, usarlos
    processedStepImages.push(...stepImagesData.map(img => {
      if (typeof img === 'string') {
        return img;
      } else if (typeof img === 'object' && img.image) {
        return img.image;
      } else {
        return null;
      }
    }));
  } else {
    // Si no hay stepImages específicos, usar la imagen principal de la receta
    const mainImage = recipe?.image || null;
    for (let i = 0; i < processedSteps.length; i++) {
      processedStepImages.push(mainImage);
    }
  }

  // Procesar ingredientes por paso usando los ingredientes modificados
  const processedStepIngredients = [];
  if (Array.isArray(modifiedIngredients)) {
    const totalSteps = processedSteps.length;
    const isIngredientMentionedInStep = (ingredient, stepText) => {
      const stepLower = stepText.toLowerCase();
      const ingredientNameLower = ingredient.name.toLowerCase();
      if (stepLower.includes(ingredientNameLower)) return true;
      const ingredientWords = ingredientNameLower.split(/\s+/);
      const stepWords = stepLower.split(/\s+/);
      for (const ingredientWord of ingredientWords) {
        if (ingredientWord.length > 3) {
          const wordFound = stepWords.some(stepWord =>
            stepWord === ingredientWord ||
            stepWord.startsWith(ingredientWord) ||
            ingredientWord.startsWith(stepWord)
          );
          if (wordFound) {
            const hasActionContext = stepWords.some(word =>
              ['agregar', 'añadir', 'poner', 'cocinar', 'freír', 'dorar', 'mezclar', 'batir', 'cortar', 'picar'].includes(word)
            );
            if (hasActionContext) return true;
          }
        }
      }
      return false;
    };
    for (let i = 0; i < totalSteps; i++) {
      const stepText = processedSteps[i];
      const stepIngredients = [];
      modifiedIngredients.forEach(ing => {
        if (isIngredientMentionedInStep(ing, stepText)) {
          stepIngredients.push({ ...ing });
        }
      });
      processedStepIngredients.push(stepIngredients);
    }
  }

  console.log('Total steps:', processedSteps.length);
  console.log('Total ingredients:', recipe?.ingredients?.length || 0);
  console.log('Ingredients per step:', processedStepIngredients.map((ingredients, index) => 
    `Step ${index + 1}: ${ingredients.length} ingredients - ${ingredients.map(ing => ing.name).join(', ')}`
  ));
  console.log('Images per step:', processedStepImages.map((img, index) => 
    `Step ${index + 1}: ${img ? 'Has image' : 'No image'}`
  ));

  const [currentStep, setCurrentStep] = useState(0);
  const progress = ((currentStep + 1) / processedSteps.length) * 100;
  const currentIngredients = processedStepIngredients[currentStep] || [];

  // Debug logs
  console.log('Final data:', {
    processedSteps,
    processedStepImages,
    processedStepIngredients,
    recipeTitleData,
    currentStep,
    currentIngredients
  });

  console.log('=== RECIPE DATA STRUCTURE ===');
  console.log('Full recipe object:', recipe);
  console.log('Ingredients:', recipe?.ingredients);
  console.log('Instructions:', recipe?.instructions);
  console.log('Step ingredients:', recipe?.stepIngredients);
  console.log('Step images:', recipe?.stepImages);
  console.log('Main image:', recipe?.image);

  console.log('Processed step ingredients:', processedStepIngredients);

  const handleNext = () => {
    if (currentStep < processedSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      router.push('/finish');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (loadingAll) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading recipes list...</Text>
      </View>
    );
  }

  if (allRecipesError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading recipes: {allRecipesError.message}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Si no hay datos del backend ni datos serializados, mostrar error
  if (!recipe && !post) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Recipe not found</Text>
        <Text style={styles.errorText}>Recipe ID: {recipeId}</Text>
        <Text style={styles.errorText}>Available recipes: {allRecipes?.length || 0}</Text>
        {allRecipes && allRecipes.length > 0 && (
          <Text style={styles.errorText}>
            Available IDs: {allRecipes.map(r => r.id).join(', ')}
          </Text>
        )}
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Función para obtener la fuente de imagen del paso actual
  const getCurrentStepImageSource = () => {
    const currentImage = processedStepImages[currentStep];
    
    console.log('Getting image for step', currentStep, ':', currentImage);
    
    if (!currentImage) {
      console.log('No image for current step, using fallback');
      return require('../assets/avocado-toast.jpg');
    }
    
    if (typeof currentImage === 'string') {
      console.log('Using URL image:', currentImage);
      return { uri: currentImage };
    }
    
    if (typeof currentImage === 'object' && currentImage.uri) {
      console.log('Using object with URI:', currentImage);
      return currentImage;
    }
    
    console.log('Using fallback image');
    return require('../assets/avocado-toast.jpg');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push({ pathname: '/recipe', params: { id: recipeId } })} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.recipeTitle}>{recipeTitleData}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image
          source={getCurrentStepImageSource()}
          style={styles.image}
          resizeMode="cover"
          onError={(error) => console.log('Image loading error:', error.nativeEvent)}
          onLoad={() => console.log('Image loaded successfully')}
        />
        <View style={styles.stepContainer}>
          <View style={styles.stepCircle}><Text style={styles.stepCircleText}>{currentStep + 1}</Text></View>
          <Text style={styles.stepLabel}>Instrucción</Text>
          <Text style={styles.stepText}>{processedSteps[currentStep]}</Text>
        </View>
        <View style={styles.ingredientCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="restaurant" size={20} color="#F9690E" style={{ marginRight: 6 }} />
            <Text style={styles.ingredientCardTitle}>Ingredientes para este paso</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {processedStepIngredients[currentStep]?.length > 0 ? (
              processedStepIngredients[currentStep].map((ing, idx) => (
                <View key={idx} style={styles.ingredientPill}>
                  <Text style={styles.ingredientPillText}>{ing.quantity} {ing.unit} {ing.name}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.ingredientItem}>No hay ingredientes para este paso.</Text>
            )}
          </View>
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => {
          if (currentStep === 0) {
            router.push({ pathname: '/recipe', params: { id: recipeId } });
          } else {
            setCurrentStep(prev => prev - 1);
          }
        }} disabled={currentStep === 0}>
          <Text style={styles.cancelButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>{currentStep === processedSteps.length - 1 ? 'Done' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    paddingTop: 50,
    paddingHorizontal: 20
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  backButton: {
    padding: 8
  },
  recipeTitle: {
    fontSize: 24,
    fontFamily: 'DynaPuff',
    alignSelf: 'center',
    marginBottom: 12,
    color: '#333'
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#34C759',
    borderRadius: 4
  },
  scrollContent: {
    paddingBottom: 140
  },
  image: {
    width: width - 40,
    height: 220,
    borderRadius: 16,
    marginBottom: 20
  },
  ingredientCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginTop: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  ingredientCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F9690E',
  },
  ingredientPill: {
    backgroundColor: '#FFF8F0',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#F9690E',
  },
  ingredientPillText: {
    color: '#F9690E',
    fontWeight: '600',
    fontSize: 14,
  },
  ingredientItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4
  },
  stepContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderColor: '#ddd',
    borderWidth: 1
  },
  stepLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8
  },
  stepText: {
    fontSize: 16,
    color: '#444',
    lineHeight: 22
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#142E8B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  stepCircleText: {
    color: 'white',
    fontWeight: 'bold'
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 50,
    width: '48%',
    alignItems: 'center'
  },
  continueButton: {
    backgroundColor: '#F9690E',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 50,
    width: '48%',
    alignItems: 'center'
  },
  cancelButtonText: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 16
  },
  continueButtonText: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 16
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#333'
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#dc2626'
  },
  retryButton: {
    backgroundColor: '#F9690E',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 50,
    width: '48%',
    alignItems: 'center'
  },
  retryButtonText: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 16
  },
  nextButton: {
    backgroundColor: '#F9690E',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 50,
    width: '48%',
    alignItems: 'center'
  },
  nextButtonText: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 16
  }
});
