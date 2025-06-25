import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const stepsData = [
  {
    id: 1,
    image: require('../assets/french-toast.jpg'),
    ingredients: [
      '2 eggs',
      '1 tsp vanilla extract',
      '1/2 tsp ground cinnamon',
      '1 tbsp sugar (optional)',
      'Pinch of salt'
    ],
    instruction: 'Whisk eggs, milk, vanilla, cinnamon, sugar, and salt in a bowl until smooth.'
  },
  {
    id: 2,
    image: require('../assets/french-toast.jpg'),
    ingredients: ['2 slices of bread'],
    instruction: 'Dip bread slices into the mixture, soaking both sides evenly.'
  },
  {
    id: 3,
    image: require('../assets/french-toast.jpg'),
    ingredients: ['Butter for cooking'],
    instruction: 'Heat butter in a pan over medium heat. Cook each slice for 2–3 minutes per side until golden brown.'
  },
  {
    id: 4,
    image: require('../assets/french-toast.jpg'),
    ingredients: ['Maple syrup, fruits, or sugar'],
    instruction: 'Serve warm with your favorite toppings like syrup, fruits, or powdered sugar.'
  }
];

export default function StepByStepScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const step = stepsData[currentStep];
  const navigation = useNavigation();
  const handleNext = () => {
    if (currentStep < stepsData.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>French Toast</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.progress}>{`${currentStep + 1} / ${stepsData.length} steps completed`}</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentStep + 1) / stepsData.length) * 100}%` }]} />
      </View>

      <Image source={step.image} style={styles.image} />

      <Text style={styles.sectionTitle}>Ingredients For This Step</Text>
      {step.ingredients.map((ing, i) => (
        <Text key={i} style={styles.ingredient}>- {ing}</Text>
      ))}

      <Text style={styles.sectionTitle}>This Step</Text>
      <View style={styles.stepRow}>
        <Text style={styles.stepNum}>{step.id}</Text>
        <Text style={styles.stepText}>{step.instruction}</Text>
      </View>

      <View style={styles.buttonRow}>
  {currentStep > 0 ? (
    <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
      <Text style={styles.backText}>Back</Text>
    </TouchableOpacity>
  ) : (
    <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
      <Text style={styles.backText}>Cancel</Text>
    </TouchableOpacity>
  )}

  {currentStep === stepsData.length - 1 ? (
    <TouchableOpacity
      style={styles.nextBtn}
      onPress={() => navigation.navigate('Finish')}
    >
      <Text style={styles.nextText}>Done</Text>
    </TouchableOpacity>
  ) : (
    <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
      <Text style={styles.nextText}>Continue</Text>
    </TouchableOpacity>
  )}
</View>
</View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  progress: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 4,
    color: '#888'
  },
  progressBar: {
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16
  },
  progressFill: {
    height: 6,
    backgroundColor: '#4CAF50'
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 12
  },
  ingredient: {
    fontSize: 14,
    color: '#444',
    marginLeft: 8
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginVertical: 12
  },
  stepNum: {
    backgroundColor: '#F9690E',
    color: 'white',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontWeight: 'bold'
  },
  stepText: {
    flex: 1,
    color: '#333'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 16
  },
  backBtn: {
    backgroundColor: '#142E8B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  cancelBtn: {
    backgroundColor: '#888',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  nextBtn: {
    backgroundColor: '#F9690E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  nextText: {
    color: 'white',
    fontWeight: 'bold'
  },
  backText: {
    color: 'white',
    fontWeight: 'bold'
  }
});
