import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateRecipeScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [steps, setSteps] = useState([{ key: '1', text: '', media: null }]);
  const [recipeImage, setRecipeImage] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const pickMedia = async (index = null) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const uri = result.assets[0].uri;
      if (index === null) {
        setRecipeImage(uri);
      } else {
        const updatedSteps = [...steps];
        if (updatedSteps[index]) {
          updatedSteps[index].media = uri;
          setSteps(updatedSteps);
        }
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
          <Image source={{ uri: item.media }} style={styles.stepImage} />
        )}
        <View style={styles.stepButtons}>
          <TouchableOpacity onPress={() => pickMedia(index)}>
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
      setIngredients([...ingredients, { name: newIngredient, amount: newAmount }]);
      setNewIngredient('');
      setNewAmount('');
    }
  };

  const handlePublish = () => {
    router.push('/recipecreated');
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleSaveChanges = () => {
    setShowSaveModal(true);
  };

  const confirmDelete = () => {
    // Aquí iría la lógica para eliminar la receta
    setShowDeleteModal(false);
    router.back(); // Volver a la pantalla anterior
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const confirmSave = () => {
    // Aquí iría la lógica para guardar los cambios
    setShowSaveModal(false);
    
    // Mostrar mensaje de éxito
    Alert.alert(
      "¡Éxito!",
      "Los cambios han sido guardados correctamente.",
      [
        {
          text: "OK",
          onPress: () => {
            // Opcional: navegar a otra pantalla o hacer algo más
            console.log("Cambios guardados exitosamente");
          }
        }
      ]
    );
  };

  const cancelSave = () => {
    setShowSaveModal(false);
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
                <Text style={styles.headerTitle}>New Recipe</Text>
                <Text style={styles.headerSubtitle}>Create & share your recipe</Text>
              </View>
              <View style={{ width: 24 }} />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={styles.headerBtn} onPress={handlePublish}>
                <Text style={styles.headerBtnText}>Publish</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerBtn, styles.deleteBtn]} onPress={handleDelete}>
                <Text style={[styles.headerBtnText, styles.deleteBtnText]}>Delete</Text>
              </TouchableOpacity>
            </View>

            {/* Recipe Image */}
            <TouchableOpacity style={styles.imagePicker} onPress={() => pickMedia(null)}>
              {recipeImage ? (
                <Image source={{ uri: recipeImage }} style={styles.recipeImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={48} color="#f97316" />
                  <Text style={styles.uploadText}>Upload a photo of your recipe</Text>
                </View>
              )}
            </TouchableOpacity>

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
                placeholder="Cook Time (min)"
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
                  <Text style={styles.ingredientText}>{item.amount}</Text>
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

            <TouchableOpacity style={styles.saveChangesBtn} onPress={handleSaveChanges}>
              <Text style={styles.saveChangesText}>Save Changes</Text>
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
              <Text style={styles.modalTitle}>Delete Recipe</Text>
            </View>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this recipe? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelDelete}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDeleteButton} onPress={confirmDelete}>
                <Text style={styles.confirmDeleteButtonText}>Delete</Text>
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
              Are you sure you want to save your changes, or would you like to continue editing?
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
    backgroundColor: '#fff7ed',
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
});
