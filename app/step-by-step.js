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

const { width } = Dimensions.get('window');

export default function StepByStepScreen() {
  const router = useRouter();
  const { steps, stepImages, recipeTitle = 'Recipe', stepIngredients } = useLocalSearchParams();

  const parsedSteps = JSON.parse(steps);
  const parsedStepImages = JSON.parse(stepImages);
  const parsedStepIngredients = JSON.parse(stepIngredients);

  const [currentStep, setCurrentStep] = useState(0);
  const progress = ((currentStep + 1) / parsedSteps.length) * 100;
  const currentIngredients = parsedStepIngredients[currentStep] || [];

  const handleNext = () => {
    if (currentStep < parsedSteps.length - 1) {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.recipeTitle}>{recipeTitle}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image
          source={parsedStepImages[currentStep] || require('../assets/avocado-toast.jpg')}
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.ingredientBlock}>
          <Text style={styles.ingredientTitle}>Ingredients For This Step</Text>
          {currentIngredients.length > 0 ? (
            currentIngredients.map((ing, idx) => (
              <Text key={idx} style={styles.ingredientItem}>• {ing.quantity} {ing.unit} {ing.name}</Text>
            ))
          ) : (
            <Text style={styles.ingredientItem}>No ingredients listed for this step.</Text>
          )}
        </View>

        <View style={styles.stepContainer}>
          <View style={styles.stepCircle}><Text style={styles.stepCircleText}>{currentStep + 1}</Text></View>
          <Text style={styles.stepLabel}>This Step</Text>
          <Text style={styles.stepText}>{parsedSteps[currentStep]}</Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleBack} disabled={currentStep === 0}>
          <Text style={styles.cancelButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
          <Text style={styles.continueButtonText}>
            {currentStep === parsedSteps.length - 1 ? 'Finish' : 'Continue'}
          </Text>
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
  ingredientBlock: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderColor: '#ddd',
    borderWidth: 1
  },
  ingredientTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#F9690E'
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
  }
});
