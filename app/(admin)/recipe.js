import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';

const API_URL = 'https://gloo-api-production.up.railway.app/api/v1';

export default function AdminRecipeDetail() {
  const router = useRouter();
  const { getToken } = useAuth();
  const params = useLocalSearchParams();
  const recipe = params.recipe ? JSON.parse(params.recipe) : null;
  const actionType = params.actionType || 'create';
  const requestId = params.requestId;
  const [loading, setLoading] = useState(false);

  if (!recipe) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>No hay datos de la receta</Text></View>;
  }

  const actionLabels = {
    create: { label: 'Creación', color: '#22c55e', icon: 'add-circle-outline' },
    edit: { label: 'Edición', color: '#f59e42', icon: 'create-outline' },
    delete: { label: 'Eliminación', color: '#ef4444', icon: 'trash-outline' },
  };
  const action = actionLabels[actionType] || actionLabels.create;

  const handleApprove = async () => {
    setLoading(true);
    let debugAction = { id: requestId, action: 'approve', response: null, error: null };
    try {
    const token = await getToken();
      const res = await fetch(`${API_URL}/recipes/${requestId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
      debugAction.response = res;
      if (res.status === 404) {
        alert('La receta ya no está pendiente o fue procesada por otro admin.');
      } else if (!res.ok) {
        throw new Error('Error en la acción');
      }
      router.replace('/(admin)/(tabs)/notifications');
    } catch (error) {
      debugAction.error = error?.message || error?.toString();
      alert(debugAction.error?.includes('404') ? 'La receta ya no está pendiente o fue procesada por otro admin.' : 'Error al procesar la acción. Intenta de nuevo.');
    setLoading(false);
    } finally {
      // Puedes guardar debugAction en algún estado si quieres mostrarlo
    }
  };

  const handleReject = async () => {
    Alert.alert(
      'Confirmar rechazo',
      `¿Estás seguro de rechazar esta solicitud de ${action.label.toLowerCase()}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar', style: 'destructive',
          onPress: async () => {
            setLoading(true);
            let debugAction = { id: requestId, action: 'reject', response: null, error: null };
            try {
            const token = await getToken();
              const res = await fetch(`${API_URL}/recipes/${requestId}/reject`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` }
            });
              debugAction.response = res;
              if (res.status === 404) {
                alert('La receta ya no está pendiente o fue procesada por otro admin.');
              } else if (!res.ok) {
                throw new Error('Error en la acción');
              }
              router.replace('/(admin)/(tabs)/notifications');
            } catch (error) {
              debugAction.error = error?.message || error?.toString();
              alert(debugAction.error?.includes('404') ? 'La receta ya no está pendiente o fue procesada por otro admin.' : 'Error al procesar la acción. Intenta de nuevo.');
            setLoading(false);
            } finally {
              // Puedes guardar debugAction en algún estado si quieres mostrarlo
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={{ alignItems: 'center', marginTop: 24 }}>
        <Ionicons name={action.icon} size={48} color={action.color} style={{ marginBottom: 8 }} />
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: action.color, marginBottom: 4 }}>{action.label}</Text>
        <Text style={{ color: '#6b7280', fontSize: 16, marginBottom: 12 }}>
          Solicitud de {action.label.toLowerCase()} de receta
        </Text>
      </View>
      {recipe.image && <Image source={{ uri: recipe.image }} style={styles.image} resizeMode="cover" />}
      <View style={{ padding: 24 }}>
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.description}>{recipe.description}</Text>
        {actionType !== 'delete' && (
          <View style={styles.cardBlock}>
            <Text style={styles.section}>Ingredientes</Text>
            {(recipe.ingredients || []).map((ing, i) => (
              <Text key={i} style={styles.ingredient}>• {ing.name || ing}</Text>
            ))}
          </View>
        )}
        {actionType !== 'delete' && (
          <View style={styles.cardBlock}>
            <Text style={styles.section}>Pasos</Text>
            {(recipe.instructions || recipe.steps || []).map((step, i) => (
              <Text key={i} style={styles.step}>{i + 1}. {step.description || step}</Text>
            ))}
          </View>
        )}
        {actionType === 'edit' && recipe.changes && (
          <View style={styles.cardBlock}>
            <Text style={styles.section}>Cambios propuestos</Text>
            <Text style={{ color: '#f59e42' }}>{recipe.changes}</Text>
          </View>
        )}
        {actionType === 'delete' && (
          <View style={styles.cardBlock}>
            <Text style={styles.section}>Advertencia</Text>
            <Text style={{ color: '#ef4444' }}>Esta acción eliminará la receta si es aprobada.</Text>
          </View>
        )}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.approve, { backgroundColor: action.color }]} onPress={handleApprove} disabled={loading}>
            <Text style={styles.actionText}>{loading ? 'Aprobando...' : 'Aprobar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reject} onPress={handleReject} disabled={loading}>
            <Text style={styles.actionText}>{loading ? 'Rechazando...' : 'Rechazar'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 220,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e40af',
    marginTop: 12,
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#374151',
    marginBottom: 18,
  },
  cardBlock: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  section: {
    fontFamily: 'Inter',
    fontWeight: 'bold',
    fontSize: 18,
    color: '#f97316',
    marginBottom: 8,
  },
  ingredient: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#1e293b',
    marginBottom: 4,
  },
  step: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#1e293b',
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  approve: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginRight: 8,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  reject: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginLeft: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  actionText: {
    color: '#fff',
    fontFamily: 'Inter',
    fontWeight: 'bold',
    fontSize: 17,
    textAlign: 'center',
  },
}); 