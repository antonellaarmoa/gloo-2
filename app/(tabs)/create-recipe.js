import { useAuth } from '@clerk/clerk-expo';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URLS } from '../../config/api';

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

export default function CreateRecipeScreen() {
  const router = useRouter();
  const { isSignedIn, userId, getToken } = useAuth();
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showGuestOverlay, setShowGuestOverlay] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [recipeId, setRecipeId] = useState(null);
  const [userRecipes, setUserRecipes] = useState([]);
  // Guardar el ID de la receta a eliminar si el usuario elige reemplazar
  const [replaceRecipeId, setReplaceRecipeId] = useState(null);
  const [showVideoSizeModal, setShowVideoSizeModal] = useState(false);
  const [localVideoUri, setLocalVideoUri] = useState(null);
  const [mediaType, setMediaType] = useState(null);

  // Nuevo hook para el reproductor de video
  const videoPlayer = useVideoPlayer(recipeImage, (player) => {
    player.loop = true;
    player.play();
  });

  // Al cargar la pantalla, obtener recetas del usuario
  useEffect(() => {
    if (userId) {
      fetchUserRecipes();
    }
  }, [userId]);

  const fetchUserRecipes = async () => {
    try {
      const res = await fetch(API_URLS.RECIPES.BY_USER(userId));
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setUserRecipes(data.data);
      } else if (Array.isArray(data)) {
        setUserRecipes(data);
      } else if (data.data && Array.isArray(data.data.data)) {
        setUserRecipes(data.data.data);
      } else {
        setUserRecipes([]);
      }
    } catch (e) {
      setUserRecipes([]);
    }
  };

  // Cargar borrador al abrir la pantalla
  useEffect(() => {
    loadDraft();
  }, []);

  // Manejar modo de edición desde AsyncStorage
  useEffect(() => {
    const checkForEditingRecipe = async () => {
      try {
        const editingRecipeData = await AsyncStorage.getItem('@gloo:editingRecipe');
        if (editingRecipeData) {
          const recipeData = JSON.parse(editingRecipeData);
          console.log('Cargando receta para editar desde AsyncStorage:', recipeData);
          loadRecipeForEditing(recipeData);
          // Limpiar el dato de AsyncStorage después de cargarlo
          await AsyncStorage.removeItem('@gloo:editingRecipe');
        }
      } catch (error) {
        console.error('Error loading editing recipe from AsyncStorage:', error);
      }
    };
    
    checkForEditingRecipe();
  }, []);

  // Limpiar campos al entrar si no hay borrador
  useFocusEffect(
    React.useCallback(() => {
      const checkAndClear = async () => {
        const draftData = await AsyncStorage.getItem('@gloo:recipeDraft');
        if (!draftData) {
          setTitle('');
          setDescription('');
          setPrepTime('');
          setCookTime('');
          setIngredients([]);
          setSteps([{ key: '1', text: '', media: null }]);
          setRecipeImage(null);
          setNewIngredient('');
          setNewAmount('');
          setNewUnit('');
          setIsEditingExisting(false);
          setRecipeId(null);
        }
      };
      checkAndClear();
    }, [])
  );

  const loadDraft = async () => {
    try {
      const draftData = await AsyncStorage.getItem('@gloo:recipeDraft');
      if (draftData) {
        const recipeData = JSON.parse(draftData);
        setTitle(recipeData.title || '');
        setDescription(recipeData.description || '');
        setPrepTime(recipeData.prepTime || '');
        setCookTime(recipeData.cookTime || '');
        setIngredients(recipeData.ingredients || []);
        setSteps(recipeData.steps || [{ key: '1', text: '', media: null }]);
        setRecipeImage(recipeData.recipeImage || null);
        setNewIngredient(recipeData.newIngredient || '');
        setNewAmount(recipeData.newAmount || '');
        setNewUnit(recipeData.newUnit || '');
        // Los borradores son siempre recetas nuevas, no existentes
        setIsEditingExisting(false);
        setRecipeId(null);
      }
    } catch (error) {
      console.error('Error loading recipe draft:', error);
    }
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem('@gloo:recipeDraft');
    } catch (error) {
      console.error('Error clearing recipe draft:', error);
    }
  };

  const deleteRecipeFromBackend = async (id) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URLS.RECIPES.DELETE(id)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        // fallback local
        try {
          const existingRecipes = await AsyncStorage.getItem('@gloo:localRecipes');
          if (existingRecipes) {
            const recipes = JSON.parse(existingRecipes);
            const filteredRecipes = recipes.filter(recipe => recipe.id !== id);
            await AsyncStorage.setItem('@gloo:localRecipes', JSON.stringify(filteredRecipes));
          }
        } catch (storageError) {
          console.log('Error removing recipe from local storage:', storageError);
        }
        return true;
      }
      return true;
    } catch (error) {
      console.error('Error deleting recipe:', error);
      // fallback local
      try {
        const existingRecipes = await AsyncStorage.getItem('@gloo:localRecipes');
        if (existingRecipes) {
          const recipes = JSON.parse(existingRecipes);
          const filteredRecipes = recipes.filter(recipe => recipe.id !== id);
          await AsyncStorage.setItem('@gloo:localRecipes', JSON.stringify(filteredRecipes));
        }
      } catch (storageError) {
        console.log('Error removing recipe from local storage:', storageError);
      }
      return true;
    }
  };

  const clearForm = () => {
    setTitle('');
    setDescription('');
    setPrepTime('');
    setCookTime('');
    setIngredients([]);
    setSteps([{ key: '1', text: '', media: null }]);
    setRecipeImage(null);
    setNewIngredient('');
    setNewAmount('');
    setNewUnit('');
    setIsEditingExisting(false);
    setRecipeId(null);
  };

  const loadRecipeForEditing = (recipeData) => {
    console.log('Cargando receta para editar:', recipeData);
    
    setTitle(recipeData.title || '');
    setDescription(recipeData.description || '');
    setPrepTime(recipeData.estimatedTime ? Math.floor(recipeData.estimatedTime / 2).toString() : '');
    setCookTime(recipeData.servings ? recipeData.servings.toString() : '');
    setRecipeImage(recipeData.image || recipeData.media || null);
    setRecipeId(recipeData.id);
    setIsEditingExisting(true);
    
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

  // Función para convertir imagen local a base64 con compresión EXTREMA para evitar payload grande
  const convertImageToBase64 = async (imageUri, maxWidth = 200, quality = 0.1) => {
    try {
      console.log('Iniciando compresión EXTREMA para evitar payload grande...');
      
      // Compresión directa muy agresiva
      const compressed = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: maxWidth } }],
        { 
          compress: quality, 
          format: ImageManipulator.SaveFormat.JPEG 
        }
      );

      let base64 = await FileSystem.readAsStringAsync(compressed.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      let sizeInKB = (base64.length * 0.75) / 1024;
      console.log(`Imagen después de compresión extrema: ${sizeInKB.toFixed(2)} KB`);
      
      // Objetivo: máximo 100KB para evitar payloads grandes
      let currentUri = compressed.uri;
      let currentWidth = maxWidth;
      let currentQuality = quality;
      
      while (sizeInKB > 100 && currentWidth > 80) {
        currentWidth = Math.max(80, currentWidth * 0.8);
        currentQuality = Math.max(0.05, currentQuality * 0.8);
        
        console.log(`Reduciendo más: ancho=${Math.round(currentWidth)}, calidad=${currentQuality.toFixed(3)}`);
        
        const furtherCompressed = await ImageManipulator.manipulateAsync(
          currentUri,
          [{ resize: { width: Math.round(currentWidth) } }],
          { 
            compress: currentQuality, 
            format: ImageManipulator.SaveFormat.JPEG 
          }
        );
        
        base64 = await FileSystem.readAsStringAsync(furtherCompressed.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        sizeInKB = (base64.length * 0.75) / 1024;
        currentUri = furtherCompressed.uri;
        
        console.log(`Nuevo tamaño: ${sizeInKB.toFixed(2)} KB`);
      }
      
      console.log(`Imagen procesada para payload: ${sizeInKB.toFixed(2)} KB`);
      return `data:image/jpeg;base64,${base64}`;
      
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return null;
    }
  };

  // Función para crear la receta en el backend
  const createRecipe = async (recipeData) => {
    try {
      const token = await getToken();
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
        status: 'pending', // Siempre pendiente
      };
      console.log('Payload enviado al backend:', payload);
      const url = API_URLS.RECIPES.CREATE(recipeData.userId);
      const result = await makeApiRequest(url, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log('Respuesta del backend:', result);
      // Mostrar siempre el mensaje de pendiente de aprobación
        Alert.alert(
        'Creación pendiente',
        'Tu receta está pendiente de aprobación por un administrador. Te avisaremos cuando sea revisada.',
          [
            {
            text: 'OK',
              onPress: () => {
              router.replace('/(tabs)/home');
              }
            }
          ]
        );
      // Limpiar campos SIEMPRE después de enviar
        setTitle('');
        setDescription('');
        setPrepTime('');
        setCookTime('');
        setIngredients([]);
        setSteps([{ key: '1', text: '', media: null }]);
        setRecipeImage(null);
        setNewIngredient('');
        setNewAmount('');
        setNewUnit('');
        setIsEditingExisting(false);
        setRecipeId(null);
        clearDraft();
      return result;
    } catch (error) {
      console.error('Error creating recipe:', error);
      Alert.alert('Error', 'No se pudo crear la receta. Intenta nuevamente.');
      throw error;
    }
  };

  // Función para actualizar la receta en el backend
  const updateRecipe = async (recipeId, recipeData) => {
    try {
      const token = await getToken();
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
        status: 'pending', // Siempre pendiente
      };
      console.log('Payload para actualizar receta:', payload);
      const url = API_URLS.RECIPES.UPDATE(recipeId);
      const result = await makeApiRequest(url, {
        method: 'PUT',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log('Respuesta del backend (actualización):', result);
      // Mostrar siempre el mensaje de pendiente de aprobación
        Alert.alert(
        'Edición pendiente',
        'Tu edición está pendiente de aprobación por un administrador. Te avisaremos cuando sea revisada.',
          [
            {
            text: 'OK',
              onPress: () => {
                router.back();
              }
            }
          ]
        );
        clearForm();
        clearDraft();
      return result;
    } catch (error) {
      console.error('Error updating recipe:', error);
      Alert.alert('Error', 'No se pudo actualizar la receta. Intenta nuevamente.');
      throw error;
    }
  };

  const MAX_FILE_SIZE_MB = 10; // Límite reducido para evitar problemas de payload

  const pickMediaType = async (type, index = null) => {
    // Solo permitir imágenes para evitar problemas de tamaño
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    
    if (!result.canceled && result.assets?.length > 0) {
      let uri = result.assets[0].uri;
      
      // Verifica si el archivo existe
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'El archivo seleccionado ya no está disponible. Por favor, selecciona otro.');
        return;
      }
      
      // Límite más conservador para imágenes de pasos
      if (fileInfo.size > 8 * 1024 * 1024) { // 8MB para imágenes de pasos
        Alert.alert('Error', 'El archivo es demasiado grande. Selecciona una imagen menor a 8MB.');
        return;
      }

      try {
        console.log('Procesando imagen de paso, tamaño original:', (fileInfo.size / (1024 * 1024)).toFixed(2), 'MB');
        
        // Usar compresión EXTREMA para imágenes de pasos (máximo 80KB)
        const base64 = await convertImageToBase64(uri, 150, 0.05);
        
        if (!base64) {
          Alert.alert('Error', 'No se pudo procesar la imagen. Intenta nuevamente.');
          return;
        }

        // Verificar tamaño final en KB
        const finalSizeInKB = (base64.length * 0.75) / 1024;
        console.log(`Tamaño final de imagen de paso: ${finalSizeInKB.toFixed(2)} KB`);
        
        if (finalSizeInKB > 100) {
          Alert.alert('Imagen demasiado grande', 'La imagen procesada es muy grande. Selecciona una imagen más pequeña.');
          return;
        }

        if (index === null) {
          setRecipeImage(base64);
        } else {
          const updatedSteps = [...steps];
          if (updatedSteps[index]) {
            updatedSteps[index].media = base64;
            setSteps(updatedSteps);
          }
        }
      } catch (e) {
        console.error('Error al procesar la imagen:', e);
        Alert.alert('Error', 'No se pudo procesar la imagen. Intenta con otra.');
        return;
      }
    }
  };

  // Definir pickMedia antes del render principal
  const pickMedia = async () => {
    // Usar ImagePicker para acceder a la galería
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Solo imágenes para evitar problemas de tamaño
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8, // Reducir calidad inicial
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return; // El usuario canceló o no seleccionó nada
    }

    const asset = result.assets[0];
    let uri = asset.uri;

    // 1. Validar tamaño del archivo ANTES de procesar
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      Alert.alert('Error', 'El archivo seleccionado no está disponible.');
      return;
    }
    
    // Límite más conservador para archivos iniciales
    if (fileInfo.size > 10 * 1024 * 1024) { // Límite de 10MB
      Alert.alert('Archivo demasiado grande', 'El archivo no puede superar los 10MB. Por favor, selecciona una imagen más pequeña.');
      return;
    }

    // 2. Procesar imagen con compresión optimizada
    setMediaType('image');
          try {
        console.log('Procesando imagen original de tamaño:', (fileInfo.size / (1024 * 1024)).toFixed(2), 'MB');
        
        // Usar compresión EXTREMA para imagen principal (máximo 100KB)
        const base64 = await convertImageToBase64(uri, 200, 0.1);
        
        if (!base64) {
          Alert.alert('Error', 'No se pudo procesar la imagen. Intenta con otra.');
          return;
        }

        // Verificar tamaño final del base64 en KB
        const finalSizeInKB = (base64.length * 0.75) / 1024;
        console.log(`Tamaño final de la imagen: ${finalSizeInKB.toFixed(2)} KB`);
        
        if (finalSizeInKB > 150) {
          Alert.alert(
            'Imagen demasiado grande', 
            'La imagen procesada aún es muy grande. Por favor, selecciona una imagen más pequeña.'
          );
          return;
        }

        setRecipeImage(base64);
        
      } catch (e) {
      console.error('Error procesando la imagen:', e);
      Alert.alert('Error', 'No se pudo procesar la imagen. Intenta con otra.');
      return;
    }
  };

  const addStep = () => {
    const newStep = {
      key: `${Date.now()}-${Math.random()}`,
      text: '',
      media: null,
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (stepKey) => {
    const updatedSteps = steps.filter((step) => step.key !== stepKey);
    setSteps(updatedSteps);
  };

  const renderStep = ({ item, drag }) => {
    const index = steps.findIndex((s) => s.key === item.key);
    return (
      <TouchableOpacity
        onLongPress={drag}
        style={styles.stepContainer}
      >
        <View style={styles.stepHeader}>
          <Text style={styles.stepNumber}>{index + 1}</Text>
          <MaterialCommunityIcons name="drag" size={24} color="#9ca3af" />
        </View>
        <TextInput
          style={styles.stepInput}
          placeholder={`Descripción del paso ${index + 1}`}
          placeholderTextColor="#9ca3af"
          multiline
          value={item.text}
          onChangeText={(text) => {
            const updatedSteps = steps.map((s) =>
              s.key === item.key ? { ...s, text } : s
            );
            setSteps(updatedSteps);
          }}
        />
        {item.media && (
          item.media.startsWith('data:video') ? (
            <VideoView
              player={videoPlayer}
              style={styles.stepImage}
              allowsFullscreen
            />
          ) : (
            <Image source={{ uri: item.media }} style={styles.stepImage} />
          )
        )}
        <View style={styles.stepButtons}>
          <TouchableOpacity onPress={() => pickMediaType('image', index)}>
            <Ionicons name="image-outline" size={24} color="#f97316" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => removeStep(item.key)}>
            <Ionicons name="trash-outline" size={24} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const addIngredient = () => {
    if (newIngredient.trim() && newAmount.trim()) {
      setIngredients([...ingredients, { 
        name: newIngredient, 
        quantity: parseFloat(newAmount) || 1,
        unit: newUnit || ''
      }]);
      setNewIngredient('');
      setNewAmount('');
      setNewUnit('');
    }
  };

  const handleTryCreate = () => {
    if (!isSignedIn) {
      setShowGuestOverlay(true);
      return false;
    }
    return true;
  };

  const handlePublish = async () => {
    if (!handleTryCreate()) return;

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

    setIsPublishing(true);

    try {
      // Validar y limpiar campos numéricos con tipos exactos
      const prepTimeNum = parseInt(prepTime) || 0;
      const servingsNum = parseInt(cookTime) || 4; // cookTime se usa como servings en este contexto
      
      // Asegurar valores válidos y positivos
      const estimatedTime = Math.max(1, Math.min(600, prepTimeNum > 0 ? prepTimeNum : 30)); // Entre 1 y 600 minutos
      const servings = Math.max(1, Math.min(20, servingsNum)); // Entre 1 y 20 porciones
      
      console.log('Campos numéricos validados:', { estimatedTime, servings, prepTimeNum, servingsNum });

      // Función para sanitizar texto y evitar caracteres problemáticos en JSON
      const sanitizeText = (text) => {
        if (!text || typeof text !== 'string') return '';
        return text
          .trim()
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remover caracteres de control
          .replace(/[""'']/g, '"') // Normalizar comillas
          .replace(/[\r\n\t]/g, ' ') // Reemplazar saltos de línea y tabs con espacios
          .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
          .slice(0, 1000); // Limitar longitud para evitar textos muy largos
      };

      // Limpiar ingredientes con validación estricta y sanitización
      const cleanIngredients = ingredients.map(ingredient => {
        const cleaned = {
          name: sanitizeText(ingredient.name) || 'Ingrediente',
          quantity: parseFloat(ingredient.quantity) || 1,
          unit: sanitizeText(ingredient.unit) || ''
        };
        
        // Asegurar que quantity sea un número válido
        if (isNaN(cleaned.quantity) || cleaned.quantity <= 0) {
          cleaned.quantity = 1;
        }
        
        return cleaned;
      }).filter(ingredient => ingredient.name.trim()); // Filtrar ingredientes sin nombre

      // Limpiar instrucciones con la estructura correcta y sanitización
      const cleanInstructions = validSteps.map((step, index) => ({
        step: index + 1,
        description: sanitizeText(step.text) || '',
        image: step.media || null  // El backend puede manejar null en instrucciones
      }));

      // Crear payload simplificado para evitar problemas de parsing
      const payload = {
        title: sanitizeText(title) || 'Receta sin título',
        description: sanitizeText(description) || 'Sin descripción',
        estimatedTime: Number(estimatedTime),
        servings: Number(servings),
        ingredients: cleanIngredients,
        instructions: cleanInstructions,
        userId: userId, // Asegurar que userId esté incluido
        status: 'pending'
      };
      
      // Debug: crear un payload super simple para probar si el problema es la estructura
      const simplePayload = {
        title: "Test Recipe",
        description: "Test Description", 
        estimatedTime: 30,
        servings: 4,
        ingredients: [{ name: "Test Ingredient", quantity: 1, unit: "unit" }],
        instructions: [{ step: 1, description: "Test instruction", image: null }],
        userId: userId, // Incluir userId también en payload simple
        status: "pending"
      };
      
      console.log('Payload original vs simple:');
      console.log('Original ingredients count:', payload.ingredients.length);
      console.log('Original instructions count:', payload.instructions.length);
      console.log('Simple payload:', JSON.stringify(simplePayload));
      
      // Usar el payload original por ahora, pero tener el simple como backup
      let finalPayload = payload;

      // Solo agregar media si existe y es válida
              if (recipeImage && recipeImage.trim()) {
          try {
            // Validar que la imagen base64 esté bien formada
            if (recipeImage.startsWith('data:image/')) {
              // Verificar que el base64 sea válido
              const base64Part = recipeImage.split(',')[1];
              if (base64Part) {
                // Verificar que sea base64 válido
                const decoded = atob(base64Part.substring(0, 100)); // Solo verificar los primeros 100 caracteres
                finalPayload.media = recipeImage;
                console.log('Imagen base64 válida agregada al payload, tamaño:', recipeImage.length, 'caracteres');
              }
            }
          } catch (base64Error) {
            console.error('Error validando imagen base64:', base64Error);
            console.warn('Imagen inválida, enviando receta sin imagen');
            // No incluir la imagen si está mal formada
          }
        }

      // Validación final del payload
      if (!finalPayload.title || finalPayload.title.length === 0) {
        throw new Error('Título es requerido');
      }
      if (!finalPayload.description || finalPayload.description.length === 0) {
        throw new Error('Descripción es requerida');
      }
      if (!finalPayload.ingredients || finalPayload.ingredients.length === 0) {
        throw new Error('Al menos un ingrediente es requerido');
      }
      if (!finalPayload.instructions || finalPayload.instructions.length === 0) {
        throw new Error('Al menos una instrucción es requerida');
      }

      // Validar que el JSON sea serializable antes de enviarlo
      let payloadString;
      try {
        payloadString = JSON.stringify(finalPayload);
        console.log('JSON válido generado, tamaño:', payloadString.length, 'caracteres');
        
        // Verificar caracteres problemáticos adicionales
        const problematicChars = payloadString.match(/[\u0000-\u001F\u007F-\u009F]/g);
        if (problematicChars) {
          console.warn('Caracteres problemáticos encontrados:', problematicChars);
          // Limpiar caracteres problemáticos
          payloadString = payloadString.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
          console.log('Caracteres problemáticos removidos, nuevo tamaño:', payloadString.length);
        }
        
        // Verificar que se puede volver a parsear (validación de ida y vuelta)
        const testParse = JSON.parse(payloadString);
        console.log('JSON validation passed - payload puede ser parseado correctamente');
        
        // Verificar estructura del JSON parseado
        if (!testParse.title || !testParse.description || !testParse.ingredients || !testParse.instructions) {
          throw new Error('Estructura del payload inválida después de la serialización');
        }
        
      } catch (jsonError) {
        console.error('Error validando JSON del payload:', jsonError);
        throw new Error('Los datos contienen caracteres inválidos que impiden crear el JSON');
      }

      console.log('Payload final validado a enviar:', JSON.stringify(finalPayload, null, 2));

      // Validar tamaño total del payload antes de enviarlo (ya tenemos payloadString)
      const payloadSizeInKB = (payloadString.length) / 1024;
      const payloadSizeInMB = payloadSizeInKB / 1024;
      console.log(`Tamaño total del payload: ${payloadSizeInKB.toFixed(2)} KB (${payloadSizeInMB.toFixed(2)} MB)`);
      
      if (payloadSizeInMB > 2) { // Límite de 2MB para el payload completo con imágenes comprimidas
        Alert.alert(
          'Receta demasiado grande',
          'La receta es demasiado grande para enviar. Por favor, reduce el número de imágenes o pasos.',
          [{ text: 'OK' }]
        );
        return;
      }

      const token = await getToken();
      // Usar directamente la URL correcta que incluye userId
      let url = API_URLS.RECIPES.CREATE(userId);
      const originalUrl = url; // Guardar URL original para fallback

      console.log('URL del endpoint:', url);
      console.log('Token disponible:', !!token);

      // Usar el payloadString que ya validamos en lugar de volver a serializar
      console.log('Enviando payload con tamaño:', payloadString.length, 'caracteres');
      console.log('Primeros 200 caracteres del payload:', payloadString.substring(0, 200));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: payloadString, // Usar la cadena JSON ya validada
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      let result;
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      try {
        result = JSON.parse(responseText);
        console.log('Parsed response data:', result);
      } catch (parseError) {
        console.error('Error parsing response JSON:', parseError);
        console.error('Response was:', responseText);
        result = { error: 'Invalid response from server', rawResponse: responseText };
      }

      if (!response.ok) {
        console.error('Request failed with status:', response.status);
        console.error('Response headers:', Object.fromEntries(response.headers));
        console.error('Error details:', result);
        
        // Log más detalles para ayudar con debugging
        if (response.status === 500) {
          console.error('Server error 500 - detalles del payload enviado:');
          console.error('- URL:', url);
          console.error('- Method: POST');
          console.error('- Headers:', { 'Authorization': '***', 'Content-Type': 'application/json' });
          console.error('- Body length:', payloadString.length);
          
          // Intentar con payload simple para debugging
          console.log('Intentando con payload simplificado para debugging...');
          try {
            const simplePayloadString = JSON.stringify(simplePayload);
            const simpleResponse = await fetch(url, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: simplePayloadString,
            });
            
            const simpleResult = await simpleResponse.text();
            console.log('Resultado con payload simple:', simpleResponse.status, simpleResult);
            
            if (simpleResponse.ok) {
              console.log('Payload simple funcionó - el problema está en los datos complejos');
            } else {
              console.log('Payload simple también falló - intentando con URL original...');
              
              // Probar con URL original si la simple también falla
              const originalResponse = await fetch(originalUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: simplePayloadString,
              });
              
              const originalResult = await originalResponse.text();
              console.log('Resultado con URL original:', originalResponse.status, originalResult);
              
              if (originalResponse.ok) {
                console.log('URL original funcionó - usar esa para el payload real');
                url = originalUrl; // Cambiar a URL original para siguiente intento
              } else {
                console.log('Ambas URLs fallaron - problema más profundo');
              }
            }
          } catch (simpleError) {
            console.error('Error con payload simple:', simpleError);
          }
        }
        
        // Si determinamos que debemos usar la URL original, reintentamos
        if (url !== originalUrl && response.status === 500) {
          console.log('Reintentando con URL original después del test...');
          url = originalUrl;
          
          const retryResponse = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: payloadString,
          });
          
          const retryResponseText = await retryResponse.text();
          console.log('Resultado del reintento:', retryResponse.status, retryResponseText);
          
          if (retryResponse.ok) {
            try {
              const retryResult = JSON.parse(retryResponseText);
              console.log('¡Reintento exitoso con URL original!');
              result = retryResult;
              response = retryResponse; // Actualizar response para el flujo de éxito
            } catch (retryParseError) {
              console.error('Error parsing retry response:', retryParseError);
              throw new Error('Reintento exitoso pero respuesta inválida');
            }
          } else {
            throw new Error('Reintento también falló');
          }
        } else {
          throw new Error(result.error || result.message || `Error ${response.status}: Error al publicar la receta`);
        }
      }
      
      // Verificar si llegamos aquí exitosamente después del reintento
      if (!response.ok) {
        throw new Error(result.error || result.message || `Error ${response.status}: Error al publicar la receta`);
      }

      // El resto del flujo de éxito...
      Alert.alert(
        'Creación pendiente',
        'Tu receta está pendiente de aprobación por un administrador. Te avisaremos cuando sea revisada.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(tabs)/home');
            }
          }
        ]
      );
      
      // Limpiar campos SIEMPRE después de publicar
      setTitle('');
      setDescription('');
      setPrepTime('');
      setCookTime('');
      setIngredients([]);
      setSteps([{ key: '1', text: '', media: null }]);
      setRecipeImage(null);
      setNewIngredient('');
      setNewAmount('');
      setNewUnit('');
      setIsEditingExisting(false);
      setRecipeId(null);
      clearDraft();

    } catch (error) {
      console.error('Error publishing recipe:', error);
      
      // Mostrar mensaje de error más específico según el tipo de error
      let errorMessage = 'No se pudo publicar la receta. Por favor, intenta nuevamente.';
      let errorTitle = "Error";
      
      if (error.message && error.message.includes('JSON')) {
        errorTitle = "Error de formato";
        errorMessage = 'Hay un problema con el formato de los datos. Por favor, revisa que no haya caracteres especiales en el título, descripción o ingredientes.';
      } else if (error.message && error.message.includes('500')) {
        errorTitle = "Error del servidor";
        errorMessage = 'Hay un problema temporal en el servidor. Por favor, intenta nuevamente en unos momentos.';
      } else if (error.message && error.message.includes('caracteres inválidos')) {
        errorTitle = "Caracteres inválidos";
        errorMessage = 'El texto contiene caracteres especiales que no son permitidos. Por favor, revisa el título, descripción e ingredientes.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(errorTitle, errorMessage, [{ text: "OK" }]);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleSaveChanges = () => {
    setShowSaveModal(true);
  };

  // Confirmar eliminación: siempre status pending_delete y mensaje claro
  const confirmDelete = async () => {
    setShowDeleteModal(false);
    try {
      if (isEditingExisting && recipeId) {
        // Obtener los datos actuales de la receta para el payload
        const recipe = userRecipes.find(r => r.id === recipeId);
        if (!recipe) throw new Error('No se encontró la receta.');
        const token = await getToken();
        const url = API_URLS.RECIPES.UPDATE(recipeId);
        // Payload completo requerido por el backend
        const payload = {
          title: recipe.title,
          description: recipe.description,
          estimatedTime: recipe.estimatedTime,
          servings: recipe.servings,
          media: recipe.image || recipe.media || null,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          status: 'pending_delete', // Siempre pendiente de aprobación
        };
        const res = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        // Mensaje claro de pendiente de aprobación
          Alert.alert(
          'Eliminación pendiente',
            'La solicitud de eliminación fue enviada y está pendiente de aprobación del administrador.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
      } else {
        // Es una receta nueva - solo limpiar formulario y borradores
        clearForm();
        await clearDraft();
        Alert.alert(
          'Formulario Limpiado',
          'El formulario ha sido limpiado y los borradores eliminados.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Error confirming delete:', error);
      Alert.alert(
        'Error',
        'No se pudo completar la operación. Por favor, intenta nuevamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const confirmSave = async () => {
    setShowSaveModal(false);
    setIsSavingDraft(true);
    
    // Guardar cambios en AsyncStorage
    try {
      const recipeData = {
        title: title.trim(),
        description: description.trim(),
        prepTime: prepTime.trim(),
        cookTime: cookTime.trim(),
        ingredients: ingredients,
        steps: steps,
        recipeImage: recipeImage,
        newIngredient: newIngredient.trim(),
        newAmount: newAmount.trim(),
        newUnit: newUnit.trim(),
      };
      await AsyncStorage.setItem('@gloo:recipeDraft', JSON.stringify(recipeData));
      
      // Mostrar mensaje de éxito
      Alert.alert(
        "¡Borrador Guardado!",
        "Tu receta se ha guardado como borrador local. Puedes continuar editando o publicar cuando esté lista.",
        [
          {
            text: "OK",
            onPress: () => {
              console.log("Borrador guardado exitosamente");
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving recipe draft:', error);
      Alert.alert(
        "Error",
        "No se pudo guardar el borrador. Inténtalo de nuevo.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSavingDraft(false);
    }
  };

  const cancelSave = () => {
    setShowSaveModal(false);
  };

  // Verificar duplicado al cambiar el título
  const handleTitleChange = (newTitle) => {
    setTitle(newTitle);
    if (!newTitle.trim() || !userRecipes.length) return;
    const normalized = newTitle.trim().toLowerCase().replace(/\s+/g, ' ');
    const existing = userRecipes.find(r => (r.title || '').trim().toLowerCase().replace(/\s+/g, ' ') === normalized);
    if (existing && !isEditingExisting) {
      Alert.alert(
        'Receta duplicada',
        'Ya tienes una receta con ese nombre. ¿Qué deseas hacer?',
        [
          {
            text: 'Editar receta',
            onPress: () => loadRecipeForEditing(existing),
          },
          {
            text: 'Reemplazar',
            style: 'destructive',
            onPress: () => {
              setIsEditingExisting(false); // Para que el flujo sea de creación
              setReplaceRecipeId(existing.id); // Guardar el ID a eliminar
            },
          },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
    }
  };

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
                <Text style={styles.headerTitle}>
                  {isEditingExisting ? 'Edit Recipe' : 'New Recipe'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {isEditingExisting ? 'Update your recipe' : 'Create & share your recipe'}
                </Text>
              </View>
              <View style={{ width: 24 }} />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={[styles.headerBtn, isPublishing && styles.headerBtnDisabled]} 
                onPress={handlePublish}
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <View style={styles.publishingContainer}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.headerBtnText}>Publicando...</Text>
                  </View>
                ) : (
                  <Text style={styles.headerBtnText}>
                    {isEditingExisting ? 'Update' : 'Publish'}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.headerBtn, styles.deleteBtn, isPublishing && styles.headerBtnDisabled]} 
                onPress={handleDelete}
                disabled={isPublishing}
              >
                <Text style={[styles.headerBtnText, styles.deleteBtnText]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>

            {/* Recipe Image */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}>
              <TouchableOpacity style={styles.mediaPickerButton} onPress={pickMedia}>
                <Ionicons name="image-outline" size={32} color="#E2773C" />
                <Text style={styles.uploadText}>Elegir foto o video</Text>
              </TouchableOpacity>
            </View>
            {recipeImage && (
              <View style={{ alignItems: 'center', marginVertical: 16 }}>
                {mediaType === 'video' ? (
                  <VideoView
                    player={videoPlayer}
                    style={{ width: 200, height: 200, borderRadius: 16 }}
                    allowsFullscreen
                  />
                ) : (
                  <Image
                    source={{ uri: recipeImage }}
                    style={{ width: 200, height: 200, borderRadius: 16, resizeMode: 'cover' }}
                  />
                )}
                <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
                  {mediaType === 'video' ? 'Vista previa de video' : 'Vista previa de la imagen'}
                </Text>
              </View>
            )}

            {/* Recipe Details */}
            <TextInput
              style={styles.inputOrange}
              placeholder="Recipe Title"
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={handleTitleChange}
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
                <View style={styles.ingredientBox}>
                  <Text style={styles.ingredientText}>{item.quantity} {item.unit}</Text>
                </View>
                <View style={styles.ingredientBox}>
                  <Text style={styles.ingredientText}>{item.name}</Text>
                </View>
                <TouchableOpacity onPress={() => {
                  const updated = ingredients.filter((_, index) => index !== i);
                  setIngredients(updated);
                }}>
                  <Ionicons name="trash-outline" size={20} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.ingredientContainer}>
              <TextInput
                style={styles.ingredientAmountInput}
                placeholder="Amount"
                placeholderTextColor="#9ca3af"
                value={newAmount}
                onChangeText={setNewAmount}
              />
              <TextInput
                style={styles.ingredientInput}
                placeholder="Ingredient name..."
                placeholderTextColor="#9ca3af"
                value={newIngredient}
                onChangeText={setNewIngredient}
              />
              <TextInput
                style={styles.ingredientUnitInput}
                placeholder="Unit"
                placeholderTextColor="#9ca3af"
                value={newUnit}
                onChangeText={setNewUnit}
              />
              <TouchableOpacity style={styles.addIngredientBtn} onPress={addIngredient}>
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Instructions Section */}
            <Text style={styles.sectionTitle}>Instructions</Text>
            <DraggableFlatList
              data={steps}
              keyExtractor={(item) => item.key}
              onDragEnd={({ data }) => setSteps(data)}
              renderItem={renderStep}
              scrollEnabled={false}
            />

            <TouchableOpacity style={styles.addStepBtn} onPress={addStep}>
              <Ionicons name="add-circle-outline" size={24} color="#1e40af" />
              <Text style={styles.addStepText}>Add Step</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.saveChangesBtn, isSavingDraft && styles.headerBtnDisabled]} 
              onPress={handleSaveChanges}
              disabled={isSavingDraft}
            >
              {isSavingDraft ? (
                <View style={styles.publishingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.saveChangesText}>Guardando...</Text>
                </View>
              ) : (
                <Text style={styles.saveChangesText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={32} color="#dc2626" />
              <Text style={styles.modalTitle}>
                Delete Recipe
              </Text>
            </View>
            <Text style={styles.modalMessage}>
              {isEditingExisting 
                ? 'Are you sure you want to delete this recipe? This action cannot be undone and will remove it from the server.'
                : 'Are you sure you want to delete the form? This will delete all your current work and drafts.'
              }
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelDelete}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDeleteButton} onPress={confirmDelete}>
                <Text style={styles.confirmDeleteButtonText}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Save Changes Confirmation Modal */}
      <Modal
        visible={showSaveModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelSave}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="checkmark-circle" size={32} color="#10b981" />
              <Text style={styles.modalTitle}>Save Changes</Text>
            </View>
            <Text style={styles.modalMessage}>
              ¿Quieres guardar tu receta como borrador local? Podrás continuar editando después.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.continueEditingButton} onPress={cancelSave}>
                <Text style={styles.continueEditingButtonText}>Continue Editing</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmSaveButton} onPress={confirmSave}>
                <Text style={styles.confirmSaveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#F9690E', marginBottom: 12, textAlign: 'center' }}>Create an account to add recipes!</Text>
            <Text style={{ fontSize: 16, color: '#333', marginBottom: 24, textAlign: 'center' }}>
              Sign up or log in to add, save, comment, and rate recipes. Join our foodie community!
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: '#142E8B', borderRadius: 50, paddingVertical: 12, paddingHorizontal: 32, marginBottom: 12 }}
              onPress={() => router.push('/(auth)/sign-in')}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Sign In / Create Account</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowGuestOverlay(false)}>
              <Text style={{ color: '#F9690E', fontWeight: 'bold', fontSize: 16, marginTop: 8 }}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: '#ffffff',
  },
  stepContainer: {
    backgroundColor: '#fef3c7',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f97316',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ingredientContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  ingredientItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  ingredientText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#1e293b',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    fontFamily: 'Inter',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerBtn: {
    backgroundColor: '#f97316',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerBtnText: {
    color: '#fff',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteBtn: {
    backgroundColor: '#dc2626',
  },
  deleteBtnText: {
    color: '#fff',
  },
  imagePicker: {
    backgroundColor: '#fef3c7',
    borderRadius: 20,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#f97316',
    borderStyle: 'dashed',
  },
  addImageText: {
    fontSize: 48,
    color: '#f97316',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  inputOrange: {
    borderWidth: 1,
    borderColor: '#f97316',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#1e293b',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#f97316',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#1e293b',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#f97316',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#1e293b',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    fontFamily: 'Inter',
    marginBottom: 15,
  },
  ingredientAmountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#f97316',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#1e293b',
  },
  ingredientInput: {
    flex: 2,
    borderWidth: 1,
    borderColor: '#f97316',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#1e293b',
  },
  ingredientUnitInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#f97316',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#1e293b',
  },
  addIngredientBtn: {
    backgroundColor: '#f97316',
    borderRadius: 10,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingredientBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    backgroundColor: '#f97316',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
  },
  stepInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f97316',
    padding: 15,
    marginBottom: 12,
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#1e293b',
    minHeight: 80,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  stepImage: {
    width: '100%',
    height: 150,
    borderRadius: 15,
    marginBottom: 12,
  },
  stepButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  addStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#1e40af',
    borderStyle: 'dashed',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    gap: 8,
  },
  addStepText: {
    color: '#1e40af',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 16,
    color: '#9ca3af',
    fontFamily: 'Inter',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  saveChangesBtn: {
    backgroundColor: '#059669',
    padding: 18,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveChangesText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter',
    marginLeft: 10,
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    backgroundColor: '#dc2626',
    padding: 12,
    borderRadius: 20,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  confirmDeleteButton: {
    backgroundColor: '#f97316',
    padding: 12,
    borderRadius: 20,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteButtonText: {
    color: '#fff',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  continueEditingButton: {
    backgroundColor: '#f97316',
    padding: 12,
    borderRadius: 20,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueEditingButtonText: {
    color: '#fff',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  confirmSaveButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 20,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmSaveButtonText: {
    color: '#fff',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  publishingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtnDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  mediaPickerButton: {
    backgroundColor: '#fef3c7',
    borderRadius: 20,
    height: 300,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#f97316',
    borderStyle: 'dashed',
  },
  recipeImagePreview: {
    width: 340,
    height: 260,
    borderRadius: 16,
    marginTop: 12,
  },
});
