import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URLS } from '../config/api';
import { useFocusEffect } from '@react-navigation/native';
import * as ImageManipulator from 'expo-image-manipulator';
import { Video } from 'expo-av';

// Función robusta para hacer peticiones a la API
const makeApiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...options,
    });
    
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      data = null;
    }
    
    return {
      success: response.ok,
      status: response.status,
      data,
      response,
    };
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    return {
      success: false,
      error,
      status: 0,
    };
  }
};

export default function EditRecipeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isSignedIn, userId } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [steps, setSteps] = useState([{ key: '1', text: '', media: null }]);
  const [recipeImage, setRecipeImage] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [recipeId, setRecipeId] = useState(null);
  const [originalRecipe, setOriginalRecipe] = useState(null);

  // Cargar datos de la receta al abrir la pantalla
  useEffect(() => {
    if (params.recipeData) {
      try {
        const recipeData = JSON.parse(params.recipeData);
        loadRecipeForEditing(recipeData);
      } catch (error) {
        console.error('Error parsing recipe data:', error);
        Alert.alert('Error', 'No se pudo cargar la receta para editar');
        router.back();
      }
    }
  }, [params.recipeData]);

  const loadRecipeForEditing = (recipeData) => {
    console.log('Cargando receta para editar:', recipeData);
    
    setOriginalRecipe(recipeData);
    setTitle(recipeData.title || '');
    setDescription(recipeData.description || '');
    setPrepTime(recipeData.estimatedTime ? Math.floor(recipeData.estimatedTime / 2).toString() : '');
    setCookTime(recipeData.servings ? recipeData.servings.toString() : '');
    setRecipeImage(recipeData.image || recipeData.media || null);
    setRecipeId(recipeData.id);
    
    // Cargar ingredientes
    if (recipeData.ingredients && Array.isArray(recipeData.ingredients)) {
      setIngredients(recipeData.ingredients);
    }
    
    // Cargar instrucciones/pasos
    if (recipeData.instructions && Array.isArray(recipeData.instructions)) {
      const stepsWithKeys = recipeData.instructions.map((instruction, index) => ({
        key: (index + 1).toString(),
        text: instruction.description || instruction.text || '',
        media: instruction.image || instruction.media || null,
      }));
      setSteps(stepsWithKeys.length > 0 ? stepsWithKeys : [{ key: '1', text: '', media: null }]);
    }
  };

  // Función para convertir imagen local a base64
  const convertImageToBase64 = async (imageUri) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const extension = imageUri.split('.').pop().toLowerCase();
      let mimeType = 'image/jpeg';
      if (extension === 'png') mimeType = 'image/png';
      else if (extension === 'gif') mimeType = 'image/gif';
      else if (extension === 'webp') mimeType = 'image/webp';
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return null;
    }
  };

  // Función para actualizar la receta en el backend
  const updateRecipe = async (recipeData) => {
    try {
      const media = recipeData.recipeImage || null;
      const instructions = (recipeData.instructions || []).map((inst) => ({
        description: inst.text || inst.description || '',
        image: inst.media || null,
      }));
      const payload = {
        title: recipeData.title,
        description: recipeData.description,
        estimatedTime: recipeData.estimatedTime,
        servings: recipeData.servings,
        media,
        ingredients: recipeData.ingredients,
        instructions,
      };
      console.log('Payload para actualizar receta:', payload);
      const url = API_URLS.RECIPES.UPDATE(recipeId);
      const result = await makeApiRequest(url, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      console.log('Respuesta del backend (actualización):', result);
      return result;
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error;
    }
  };

  const MAX_FILE_SIZE_MB = 30;

  const pickMediaType = async (type, index = null) => {
    let mediaTypes = ImagePicker.MediaTypeOptions.All;
    if (type === 'image') mediaTypes = ImagePicker.MediaTypeOptions.Images;
    if (type === 'video') mediaTypes = ImagePicker.MediaTypeOptions.Videos;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets?.length > 0) {
      let uri = result.assets[0].uri;
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'El archivo seleccionado ya no está disponible. Por favor, selecciona otro.');
        return;
      }
      if (fileInfo.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        Alert.alert('Error', 'El archivo es demasiado grande. Selecciona uno menor a 30MB.');
        return;
      }
      const extension = uri.split('.').pop().toLowerCase();
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
      const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension);
      let base64 = null;
      if (isImage) {
        try {
          const manipulated = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 720 } }],
            { compress: 0.2, format: ImageManipulator.SaveFormat.JPEG }
          );
          uri = manipulated.uri;
        } catch (e) {
          console.error('Error al comprimir la imagen:', e);
          Alert.alert('Error', 'No se pudo comprimir la imagen. Intenta con otra.');
          return;
        }
        base64 = await convertImageToBase64(uri);
      } else if (isVideo) {
        try {
          const videoBase64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          let mimeType = 'video/mp4';
          if (extension === 'mov') mimeType = 'video/quicktime';
          else if (extension === 'webm') mimeType = 'video/webm';
          else if (extension === 'avi') mimeType = 'video/x-msvideo';
          else if (extension === 'mkv') mimeType = 'video/x-matroska';
          base64 = `data:${mimeType};base64,${videoBase64}`;
        } catch (e) {
          console.error('Error al procesar el video:', e);
          Alert.alert('Error', 'No se pudo procesar el video. Intenta nuevamente.');
          return;
        }
      } else {
        Alert.alert('Error', 'Solo se permiten imágenes o videos.');
        return;
      }
      if (!base64) {
        Alert.alert('Error', 'No se pudo procesar el archivo. Intenta nuevamente.');
        return;
      }
      if (index === null) {
        setRecipeImage(base64);
      } else {
        if (!isImage) {
          Alert.alert('Error', 'Solo se permiten imágenes en los pasos.');
          return;
        }
        const newSteps = [...steps];
        newSteps[index].media = base64;
        setSteps(newSteps);
      }
    }
  };

  const addStep = () => {
    const newKey = (steps.length + 1).toString();
    setSteps([...steps, { key: newKey, text: '', media: null }]);
  };

  const removeStep = (stepKey) => {
    if (steps.length > 1) {
      setSteps(steps.filter(step => step.key !== stepKey));
    }
  };

  const renderStep = ({ item, drag }) => {
    const index = steps.findIndex(step => step.key === item.key);
    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <TouchableOpacity onLongPress={drag} style={styles.dragHandle}>
            <MaterialCommunityIcons name="drag" size={24} color="#9ca3af" />
          </TouchableOpacity>
          <Text style={styles.stepNumber}>Paso {item.key}</Text>
          {steps.length > 1 && (
            <TouchableOpacity onPress={() => removeStep(item.key)} style={styles.removeStepButton}>
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
        <TextInput
          style={styles.stepInput}
          placeholder="Describe este paso..."
          placeholderTextColor="#9ca3af"
          multiline
          value={item.text}
          onChangeText={(text) => {
            const newSteps = [...steps];
            newSteps[index].text = text;
            setSteps(newSteps);
          }}
        />
        <TouchableOpacity 
          style={styles.stepMediaButton} 
          onPress={() => pickMediaType('image', index)}
        >
          <Ionicons name="image-outline" size={20} color="#f97316" />
          <Text style={styles.stepMediaText}>Agregar imagen</Text>
        </TouchableOpacity>
        {item.media && (
          <View style={styles.stepMediaPreview}>
            <Image source={{ uri: item.media }} style={styles.stepMediaImage} />
            <TouchableOpacity 
              style={styles.removeMediaButton}
              onPress={() => {
                const newSteps = [...steps];
                newSteps[index].media = null;
                setSteps(newSteps);
              }}
            >
              <Ionicons name="close-circle" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const addIngredient = () => {
    if (newIngredient.trim() && newAmount.trim()) {
      const ingredient = {
        name: newIngredient.trim(),
        amount: newAmount.trim(),
        unit: newUnit.trim(),
        description: '',
      };
      setIngredients([...ingredients, ingredient]);
      setNewIngredient('');
      setNewAmount('');
      setNewUnit('');
    }
  };

  const removeIngredient = (index) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
  };

  const handleUpdate = async () => {
    // Validar campos requeridos
    if (!title.trim()) {
      Alert.alert('Error', 'El título es requerido');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'La descripción es requerida');
      return;
    }

    if (ingredients.length === 0) {
      Alert.alert('Error', 'Debes agregar al menos un ingrediente');
      return;
    }

    const validSteps = steps.filter(step => step.text.trim());
    if (validSteps.length === 0) {
      Alert.alert('Error', 'Debes agregar al menos un paso');
      return;
    }

    setIsUpdating(true);

    try {
      const recipeData = {
        title: title.trim(),
        description: description.trim(),
        estimatedTime: parseInt(prepTime) + parseInt(cookTime) || 30,
        servings: parseInt(cookTime) || 4,
        ingredients: ingredients,
        instructions: steps.map((step, index) => ({
          text: step.text,
          media: step.media,
        })),
        recipeImage,
        userId,
        createdBy: userId,
        updatedBy: userId,
      };

      const result = await updateRecipe(recipeData);

      if (result.success) {
        Alert.alert(
          "¡Éxito!",
          "Tu receta ha sido actualizada correctamente.",
          [
            {
              text: "Ver mi receta",
              onPress: () => {
                router.push(`/recipe/${recipeId}`);
              }
            },
            {
              text: "OK",
              onPress: () => {
                router.back();
              }
            }
          ]
        );
      } else {
        const errorMsg = result.data?.error || 'No se pudo actualizar la receta. Intenta nuevamente.';
        Alert.alert('Error', errorMsg);
      }
    } catch (error) {
      console.error('Error updating recipe:', error);
      Alert.alert(
        "Error",
        "No se pudo actualizar la receta. Por favor, intenta nuevamente.",
        [{ text: "OK" }]
      );
    } finally {
      setIsUpdating(false);
    }
  };

  if (!originalRecipe) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#E2773C" />
        <Text style={{ marginTop: 16, color: '#666' }}>Cargando receta...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerContainer}>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color="#1e293b" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Edit Recipe</Text>
                <Text style={styles.headerSubtitle}>Update your recipe</Text>
              </View>
              <View style={{ width: 24 }} />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={[styles.headerBtn, isUpdating && styles.headerBtnDisabled]} 
                onPress={handleUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <View style={styles.publishingContainer}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.headerBtnText}>Actualizando...</Text>
                  </View>
                ) : (
                  <Text style={styles.headerBtnText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Recipe Image */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 8 }}>
              <TouchableOpacity style={[styles.imagePicker, { flex: 1 }]} onPress={() => pickMediaType('image', null)}>
                <Ionicons name="image-outline" size={32} color="#f97316" />
                <Text style={styles.uploadText}>Cambiar foto</Text>
              </TouchableOpacity>
            </View>

            {recipeImage && (
              <View style={{ alignItems: 'center', marginVertical: 16 }}>
                {recipeImage.startsWith('data:video') ? (
                  <Video
                    source={{ uri: recipeImage }}
                    style={{ width: 200, height: 200, borderRadius: 16 }}
                    useNativeControls
                    resizeMode="contain"
                    isLooping
                  />
                ) : (
                  <Image
                    source={{ uri: recipeImage }}
                    style={{ width: 200, height: 200, borderRadius: 16, resizeMode: 'cover' }}
                  />
                )}
                <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
                  {recipeImage.startsWith('data:video') ? 'Vista previa de video' : 'Vista previa de la imagen'}
                </Text>
              </View>
            )}

            {/* Recipe Details */}
            <TextInput
              style={styles.inputOrange}
              placeholder="Recipe Title"
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={styles.textArea}
              placeholder="Recipe Description"
              placeholderTextColor="#9ca3af"
              multiline
              value={description}
              onChangeText={setDescription}
            />
            <View style={styles.timeContainer}>
              <TextInput
                style={styles.timeInput}
                placeholder="Prep Time (min)"
                placeholderTextColor="#9ca3af"
                value={prepTime}
                onChangeText={setPrepTime}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.timeInput}
                placeholder="Servings"
                placeholderTextColor="#9ca3af"
                value={cookTime}
                onChangeText={setCookTime}
                keyboardType="numeric"
              />
            </View>

            {/* Ingredients Section */}
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {ingredients && ingredients.map((item, i) => (
              <View key={i} style={styles.ingredientItemContainer}>
                <View style={styles.ingredientInfo}>
                  <Text style={styles.ingredientName}>{item.name}</Text>
                  <Text style={styles.ingredientAmount}>
                    {item.amount} {item.unit}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeIngredient(i)} style={styles.removeIngredientButton}>
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addIngredientContainer}>
              <TextInput
                style={styles.ingredientInput}
                placeholder="Ingredient name"
                placeholderTextColor="#9ca3af"
                value={newIngredient}
                onChangeText={setNewIngredient}
              />
              <TextInput
                style={styles.amountInput}
                placeholder="Amount"
                placeholderTextColor="#9ca3af"
                value={newAmount}
                onChangeText={setNewAmount}
              />
              <TextInput
                style={styles.unitInput}
                placeholder="Unit"
                placeholderTextColor="#9ca3af"
                value={newUnit}
                onChangeText={setNewUnit}
              />
              <TouchableOpacity onPress={addIngredient} style={styles.addIngredientButton}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Instructions Section */}
            <Text style={styles.sectionTitle}>Instructions</Text>
            <DraggableFlatList
              data={steps}
              keyExtractor={(item) => item.key}
              renderItem={renderStep}
              onDragEnd={({ data }) => setSteps(data)}
              scrollEnabled={false}
            />
            <TouchableOpacity onPress={addStep} style={styles.addStepButton}>
              <Ionicons name="add-circle-outline" size={24} color="#f97316" />
              <Text style={styles.addStepText}>Add Step</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fefefe',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E2773C',
    fontFamily: 'Inter',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  headerBtn: {
    backgroundColor: '#E2773C',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#E2773C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  headerBtnDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  headerBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Inter',
  },
  publishingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imagePicker: {
    backgroundColor: '#fff7ed',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2773C',
    borderStyle: 'dashed',
    shadowColor: '#E2773C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    color: '#E2773C',
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  inputOrange: {
    borderWidth: 2,
    borderColor: '#E2773C',
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
    fontFamily: 'Inter',
    shadowColor: '#E2773C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textArea: {
    borderWidth: 2,
    borderColor: '#E2773C',
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
    minHeight: 120,
    textAlignVertical: 'top',
    fontFamily: 'Inter',
    shadowColor: '#E2773C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  timeInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E2773C',
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    backgroundColor: '#fff',
    fontFamily: 'Inter',
    shadowColor: '#E2773C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E2773C',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  ingredientItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    shadowColor: '#E2773C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    fontFamily: 'Inter',
  },
  ingredientAmount: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  removeIngredientButton: {
    padding: 4,
  },
  addIngredientContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  ingredientInput: {
    flex: 2,
    borderWidth: 2,
    borderColor: '#E2773C',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    backgroundColor: '#fff',
    fontFamily: 'Inter',
    shadowColor: '#E2773C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  amountInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E2773C',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    backgroundColor: '#fff',
    fontFamily: 'Inter',
    shadowColor: '#E2773C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  unitInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E2773C',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    backgroundColor: '#fff',
    fontFamily: 'Inter',
    shadowColor: '#E2773C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  addIngredientButton: {
    backgroundColor: '#E2773C',
    borderRadius: 12,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E2773C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stepContainer: {
    backgroundColor: '#fff7ed',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fed7aa',
    shadowColor: '#E2773C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dragHandle: {
    marginRight: 12,
  },
  stepNumber: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E2773C',
    fontFamily: 'Inter',
  },
  removeStepButton: {
    padding: 4,
  },
  stepInput: {
    borderWidth: 2,
    borderColor: '#E2773C',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
    fontFamily: 'Inter',
    shadowColor: '#E2773C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  stepMediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2773C',
    marginBottom: 16,
    shadowColor: '#E2773C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  stepMediaText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#E2773C',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  stepMediaPreview: {
    position: 'relative',
    alignItems: 'center',
  },
  stepMediaImage: {
    width: 140,
    height: 140,
    borderRadius: 12,
    resizeMode: 'cover',
    borderWidth: 2,
    borderColor: '#fed7aa',
  },
  removeMediaButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff7ed',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2773C',
    borderStyle: 'dashed',
    shadowColor: '#E2773C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addStepText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#E2773C',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
}); 