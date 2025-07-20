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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URLS } from '../../config/api';
import { useFocusEffect } from '@react-navigation/native';
import * as ImageManipulator from 'expo-image-manipulator';
import { Video } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';

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

  // Función para convertir imagen local a base64
  const convertImageToBase64 = async (imageUri) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      // Determinar el tipo MIME basado en la extensión del archivo
      const extension = imageUri.split('.').pop().toLowerCase();
      let mimeType = 'image/jpeg'; // default
      if (extension === 'png') mimeType = 'image/png';
      else if (extension === 'gif') mimeType = 'image/gif';
      else if (extension === 'webp') mimeType = 'image/webp';
      return `data:${mimeType};base64,${base64}`;
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
      // Verifica si el archivo existe
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'El archivo seleccionado ya no está disponible. Por favor, selecciona otro.');
        return;
      }
      // Limita el tamaño del archivo a 30MB
      if (fileInfo.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        Alert.alert('Error', 'El archivo es demasiado grande. Selecciona uno menor a 30MB.');
        return;
      }
      // Detecta si es imagen o video
      const extension = uri.split('.').pop().toLowerCase();
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
      const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension);
      let base64 = null;
      if (isImage) {
        // Comprime y redimensiona la imagen antes de convertir a base64
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
        base64 = await convertImageToBase64(uri); // ya incluye el mime-type correcto
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
        // Solo permitir imágenes en los pasos
        if (!isImage) {
          Alert.alert('Error', 'Solo se permiten imágenes en los pasos.');
          return;
        }
        const updatedSteps = [...steps];
        if (updatedSteps[index]) {
          updatedSteps[index].media = base64;
          setSteps(updatedSteps);
        }
      }
    }
  };

  // Definir pickMedia antes del render principal
  const pickMedia = async () => {
    if (Platform.OS === 'web') {
      alert('La carga de foto o video solo está disponible en la app móvil.');
      return;
    }
    if (!DocumentPicker) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'video/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.type === 'success') {
      if (result.mimeType && result.mimeType.startsWith('video')) {
        // Validar tamaño del video
        const fileInfo = await FileSystem.getInfoAsync(result.uri);
        if (fileInfo.size > 5 * 1024 * 1024) {
          setShowVideoSizeModal(true);
          setLocalVideoUri(result.uri);
          return;
        }
        setRecipeImage(result.uri);
        setMediaType('video');
      } else {
        setRecipeImage(result.uri);
        setMediaType('image');
      }
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
            <Video
              source={{ uri: item.media }}
              style={styles.stepImage}
              useNativeControls
              resizeMode="contain"
              isLooping
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
      // Si hay que reemplazar, eliminar primero la receta existente
      if (replaceRecipeId) {
        await deleteRecipeFromBackend(replaceRecipeId);
        setReplaceRecipeId(null); // Limpiar el estado
      }
      const recipeData = {
        title: title.trim(),
        description: description.trim(),
        estimatedTime: parseInt(prepTime) + parseInt(cookTime) || 30,
        servings: parseInt(cookTime) || 4, // ahora cookTime es servings
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

      let result;
      if (isEditingExisting && recipeId) {
        // Actualizar receta existente
        result = await updateRecipe(recipeId, recipeData);
      } else {
        // Crear nueva receta
        result = await createRecipe(recipeData);
      }

      // Mostrar mensaje de éxito y navegar
      if (isEditingExisting && recipeId) {
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
      }
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
      Alert.alert(
        "Error",
        "No se pudo publicar la receta. Por favor, intenta nuevamente.",
        [{ text: "OK" }]
      );
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
                {recipeImage.startsWith('data:video') || recipeImage.endsWith('.mp4') || recipeImage.endsWith('.mov') || recipeImage.endsWith('.webm') ? (
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
                  {recipeImage.startsWith('data:video') || recipeImage.endsWith('.mp4') || recipeImage.endsWith('.mov') || recipeImage.endsWith('.webm') ? 'Vista previa de video' : 'Vista previa de la imagen'}
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
