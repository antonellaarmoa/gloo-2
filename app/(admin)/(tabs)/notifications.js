import React from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useState } from 'react';
import { API_CONFIG, apiRequest } from '../../../config/api';
import { API_URLS } from '../../../config/api';
import { useAdminHistory } from '../../../context/AdminHistoryContext';

// Incluir todos los tipos posibles de notificación de recetas
const recipeNotificationTypes = [
  'recipe_approval',
  'recipe_updated',
  'recipe_deleted',
  'recipe_delete_request',
  'recipe_removal'
];
// Tipos de notificación y status relevantes
const allowedNotificationTypes = [
  'recipe_approval',
  'recipe_pending', // <-- para compatibilidad con backend
  'recipe_update_pending',
  'recipe_delete_pending',
  'recipe_approved',
  'recipe_rejected',
  'recipe_deleted',
];
// Eliminar ADMIN_ID hardcodeado

// Helper para obtener recetas por status
async function fetchRecipesByStatus(status, getToken) {
  const token = await getToken();
  const res = await apiRequest(`${API_CONFIG.BASE_URL}/recipes`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { status },
  });
  return res.data?.data || [];
}

async function fetchAdminRequests(getToken, userId, setRequests, setLoading, setRawDebug) {
  setLoading(true);
  try {
    const token = await getToken();
    console.log('ADMIN REQUEST: GET pendientes', `${API_CONFIG.BASE_URL}/admin/${userId}/pending`);
    // Traer solo recetas pendientes (sin notificaciones)
    const pendingRes = await apiRequest(`${API_CONFIG.BASE_URL}/admin/${userId}/pending`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('RESPUESTA CRUDA DEL BACKEND:', pendingRes);
    // Ajustar el mapeo según la estructura real
    let recipesArr = [];
    if (Array.isArray(pendingRes?.data?.data?.recipes)) {
      recipesArr = pendingRes.data.data.recipes;
    }
    // Ordenar por createdAt descendente (más recientes primero)
    recipesArr.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    console.log('RECETAS PENDIENTES (auto):', recipesArr);
    const unifiedRequests = recipesArr.map(r => ({
        id: r.id,
        type: 'recipe_approval',
        title: r.title,
      message: `Receta pendiente de aprobación: ${r.title}`,
        relatedId: r.id,
        relatedType: 'recipe',
      userId: r.userId,
      author: r.author,
        recipe: r,
        actionType: 'createOrEdit',
      isNotification: true,
      createdAt: r.createdAt || null,
    }));
    console.log('REQUESTS MAPEADOS:', unifiedRequests);
    setRequests(unifiedRequests);
    setRawDebug({ pending: pendingRes });
  } catch (error) {
    console.error('Error fetching admin requests:', error);
    alert('Error al cargar solicitudes. Intenta de nuevo.');
  } finally {
    setLoading(false);
  }
}

// Helper para obtener el estado real de una receta
async function fetchRecipeStatus(recipeId, getToken) {
  try {
    const token = await getToken();
    const res = await apiRequest(`${API_CONFIG.BASE_URL}/recipes/${recipeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // El status puede estar en res.data?.data?.status o res.data?.status
    return res.data?.data?.status || res.data?.status || null;
  } catch {
    return null;
  }
}

// Helper para obtener IDs de recetas pendientes
async function fetchPendingRecipeIds(getToken) {
  try {
    const token = await getToken();
    const res = await apiRequest(`${API_CONFIG.BASE_URL}/recipes/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // Suponiendo que res.data?.data es un array de recetas
    const recipes = res.data?.data || [];
    return recipes.map(r => r.id);
  } catch {
    return [];
  }
}

// Nueva función para obtener notificaciones reales del backend
async function fetchAdminNotifications(getToken, userId, setRequests, setLoading, setRawDebug) {
  setLoading(true);
  try {
    const token = await getToken();
    // Usar el endpoint de notificaciones reales
    const res = await apiRequest(`${API_CONFIG.BASE_URL}/notifications/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('RESPUESTA DEL BACKEND (notificaciones admin):', res);
    // Obtener recetas pending desde el endpoint oficial de admin
    const pendingRes = await apiRequest(`${API_CONFIG.BASE_URL}/admin/${userId}/pending`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const pendingArr = pendingRes.data?.data?.recipes || [];
    const pendingRecipeIds = pendingArr.map(r => r.id);
    console.log('IDs de recetas pending (admin):', pendingRecipeIds);
    // Obtener todas las notificaciones
    const notificationsArr =
      res.data?.data?.data?.notifications ||
      res.data?.data?.notifications ||
      res.data?.notifications ||
      [];
    // Filtrar solo notificaciones de tipo pendiente y que correspondan a recetas pending
    const pendingTypes = ['recipe_pending', 'recipe_update_pending'];
    const filteredNotifs = notificationsArr.filter(
      n => pendingTypes.includes(n.type) && pendingRecipeIds.includes(Number(n.relatedId))
    );
    // Solo la notificación más reciente por receta pending
    const notifByRecipe = {};
    filteredNotifs.forEach(n => {
      const key = n.relatedId;
      if (!notifByRecipe[key] || new Date(n.createdAt) > new Date(notifByRecipe[key].createdAt)) {
        notifByRecipe[key] = n;
      }
    });
    setRequests(Object.values(notifByRecipe));
    setRawDebug && setRawDebug(res);
  } catch (err) {
    console.error('Error al traer notificaciones:', err);
    setRequests([]);
  }
  setLoading(false);
}

const fetchRecipeDetail = async (id, getToken) => {
  const token = await getToken();
  const res = await apiRequest(`${API_URLS.RECIPES.ALL.replace('/recipes', '/recipes')}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data?.data || null;
};

// Helper para mostrar el tipo de solicitud
function getRequestLabel(item) {
  if (item.type === 'recipe_approval') return 'Creación';
  if (item.type === 'recipe_update_pending') return 'Edición';
  if (item.type === 'recipe_delete_pending') return 'Eliminación';
  return 'Otro';
}

// Función auxiliar para saber si es edición o creación
async function isEdition(userId, recipeId) {
  try {
    const res = await apiRequest(`${API_CONFIG.BASE_URL}/recipes?userId=${userId}`);
    const recipes = res.data?.data?.recipes || [];
    // Si hay alguna receta aprobada con ese userId y distinto id, es edición
    return recipes.some(r => r.status === 'approved' && r.id !== recipeId);
  } catch {
    return false;
  }
}

function EditionOrCreation({ userId, recipeId }) {
  const [isEdit, setIsEdit] = React.useState(null);

  React.useEffect(() => {
    async function checkEdition() {
      try {
        const res = await apiRequest(`${API_CONFIG.BASE_URL}/recipes?userId=${userId}`);
        const recipes = res.data?.data?.recipes || [];
        setIsEdit(recipes.some(r => r.status === 'approved' && r.id !== recipeId));
      } catch {
        setIsEdit(false);
      }
    }
    checkEdition();
  }, [userId, recipeId]);

  if (isEdit === null) return <Text style={{ color: '#007AFF', marginBottom: 8 }}>Cargando tipo...</Text>;
  return (
    <Text style={{ color: '#007AFF', marginBottom: 8 }}>
      {isEdit ? 'Solicitud de re-aprobación (edición)' : 'Solicitud de aprobación (nueva)'}
    </Text>
  );
}

// Nuevo componente EditionOrCreationBadge
function EditionOrCreationBadge({ userId, recipeId }) {
  const [isEdit, setIsEdit] = React.useState(null);

  React.useEffect(() => {
    async function checkEdition() {
      try {
        const res = await apiRequest(`${API_CONFIG.BASE_URL}/recipes?userId=${userId}`);
        const recipes = res.data?.data?.recipes || [];
        setIsEdit(recipes.some(r => r.status === 'approved' && r.id !== recipeId));
      } catch {
        setIsEdit(false);
      }
    }
    checkEdition();
  }, [userId, recipeId]);

  if (isEdit === null) return null;
  return (
    <View style={{ alignSelf: 'flex-start', backgroundColor: isEdit ? '#007AFF' : '#4CAF50', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2, marginBottom: 6 }}>
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
        {isEdit ? 'EDICIÓN' : 'CREACIÓN'}
      </Text>
    </View>
  );
}

function getTypeBadge(type) {
  if (type === 'recipe_pending') return { label: 'CREACIÓN', color: '#4CAF50' };
  if (type === 'recipe_update_pending') return { label: 'EDICIÓN', color: '#007AFF' };
  return null;
}

export default function AdminNotificationsScreen() {
  const router = useRouter();
  const { getToken, userId } = useAuth();
  const { addAction } = useAdminHistory();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rawDebug, setRawDebug] = useState({ notifications: [], pending: [], deletePending: [] });

  useEffect(() => {
    if (!userId) return;
    const fetchAll = async () => {
      const token = await getToken();
      // Usar el endpoint real de notificaciones
      await fetchAdminNotifications(getToken, userId, setRequests, setLoading, setRawDebug);
    };
    fetchAll();
  }, [userId]);

  const handleAction = async (item, action) => {
    setLoading(true);
    let debugAction = { id: item.relatedId, action, response: null, error: null };
    try {
      const token = await getToken();
      const recipeId = item.recipe?.id || (typeof item.relatedId === 'number' ? item.relatedId : null);
      if (!userId || !recipeId) {
        alert('Error: Faltan datos de usuario o receta.');
        setLoading(false);
        return;
      }
      const type = action === 'approve' ? 'approve' : (action === 'reject' ? 'reject' : action);
      let endpoint = `${API_CONFIG.BASE_URL}/admin/${userId}/${type}/${recipeId}`;
      let options = { method: 'POST', headers: { Authorization: `Bearer ${token}` } };
      if (action === 'reject') {
        options = {
          ...options,
          headers: { ...options.headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ comment: 'Rechazado por el admin' })
        };
      }
      const res = await apiRequest(endpoint, options);
      debugAction.response = res;
      if (res.status === 404 || res.data?.error?.includes('no encontrada')) {
        alert('La receta ya no está pendiente o fue procesada por otro admin.');
      } else if (!res.success && !res.data?.success) {
        throw new Error(res.data?.error || 'Error en la acción');
      } else {
        alert('Acción realizada con éxito.');
        // Agregar al historial
        addAction({
          id: recipeId,
          action: action === 'approve' ? 'approved' : 'rejected',
          recipeName: item.title || item.recipe?.title || 'Sin título',
          author: item.author || null,
          date: new Date().toISOString(),
        });
      }
      // Siempre refrescar la lista tras la acción
      await fetchAdminNotifications(getToken, userId, setRequests, setLoading, setRawDebug);
    } catch (error) {
      debugAction.error = error?.message || error?.toString();
      console.error('Error en acción admin:', error);
      alert(debugAction.error?.includes('404') ? 'La receta ya no está pendiente o fue procesada por otro admin.' : 'Error al procesar la acción. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setRawDebug(prev => ({ ...prev, lastAction: debugAction }));
    }
  };

  const getBadgeColor = (type) => {
    if (type === 'recipe_approval' || type === 'recipe_update_pending' || type === 'recipe_delete_pending') return '#f59e42';
    if (type === 'recipe_approved') return '#22c55e';
    if (type === 'recipe_rejected') return '#ef4444';
    if (type === 'recipe_deleted') return '#ef4444';
    return '#9ca3af';
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={[styles.header, { fontSize: 20, marginBottom: 10, color: '#334155', fontWeight: '600', letterSpacing: 0.2 }]}>Solicitudes pendientes</Text>
      {loading ? (
        <Text style={{ textAlign: 'center', marginTop: 40 }}>Cargando...</Text>
      ) : (
        <>
          <FlatList
            data={requests}
            keyExtractor={item => item.id?.toString()}
            renderItem={({ item }) => {
              const typeBadge = getTypeBadge(item.type);
              return (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push({
                    pathname: '/(admin)/recipe',
                    params: {
                      recipe: JSON.stringify(item.recipe || {}),
                      actionType: item.type === 'recipe_update_pending' ? 'edit' : 'create',
                      requestId: item.relatedId
                    }
                  })}
                  style={styles.cardSuperModern}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.titleSuper}>{item.title}</Text>
                      <Text style={{ color: '#888', fontSize: 12, marginBottom: 2 }}>ID Receta: {item.relatedId}</Text>
                      {item.author && (
                        <Text style={styles.autorSuper}>
                          Autor: {
                            typeof item.author === 'string'
                              ? (item.author.startsWith('user_') ? 'Desconocido' : item.author)
                              : (item.author?.username || item.author?.email || 'Desconocido')
                          }
                        </Text>
                      )}
                    </View>
                    {typeBadge && (
                      <View style={{ backgroundColor: typeBadge.color, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8, minWidth: 60, alignItems: 'center' }}>
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 11, letterSpacing: 1 }}>{typeBadge.label}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.messageSuper}>{item.message}</Text>
                  <View style={styles.infoRowSuper}>
                    {item.createdAt && (
                      <Text style={styles.timeSuper}>{new Date(item.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</Text>
                    )}
                  </View>
                  <View style={styles.actionsRowSuper}>
                    <TouchableOpacity style={styles.actionBtnApproveSuper} onPress={(e) => { e.stopPropagation(); Alert.alert('Confirmar aprobación', '¿Estás seguro de aprobar esta receta?', [ { text: 'Cancelar', style: 'cancel' }, { text: 'Aprobar', style: 'default', onPress: () => handleAction(item, 'approve') } ]); }}>
                      <Ionicons name="checkmark-circle" size={28} color="#fff" style={{ marginRight: 12 }} />
                      <Text style={styles.actionBtnTextSuper}>Aprobar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtnRejectSuper} onPress={(e) => { e.stopPropagation(); Alert.alert('Confirmar rechazo', '¿Estás seguro de rechazar esta receta?', [ { text: 'Cancelar', style: 'cancel' }, { text: 'Rechazar', style: 'destructive', onPress: () => handleAction(item, 'reject') } ]); }}>
                      <Ionicons name="close-circle" size={28} color="#fff" style={{ marginRight: 12 }} />
                      <Text style={styles.actionBtnTextSuper}>Rechazar</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={requests.length === 0 ? (
              <Text style={{ textAlign: 'center', marginTop: 32 }}>No hay solicitudes pendientes</Text>
            ) : (
              requests.map((item) => {
                const typeBadge = getTypeBadge(item.type);
                return (
                  <View key={item.id} style={{ marginVertical: 12, padding: 16, backgroundColor: '#fff', borderRadius: 8, elevation: 2 }}>
                    {/* Badge de tipo de notificación si existe */}
                    {typeBadge && (
                      <View style={{ alignSelf: 'flex-start', backgroundColor: typeBadge.color, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2, marginBottom: 6 }}>
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>{typeBadge.label}</Text>
                      </View>
                    )}
                    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.title}</Text>
                    <Text style={{ color: '#666', marginBottom: 8 }}>{item.description}</Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <TouchableOpacity style={styles.actionBtnApproveSuper} onPress={(e) => { e.stopPropagation(); Alert.alert('Confirmar aprobación', '¿Estás seguro de aprobar esta receta?', [ { text: 'Cancelar', style: 'cancel' }, { text: 'Aprobar', style: 'default', onPress: () => handleAction(item, 'approve') } ]); }}>
                        <Ionicons name="checkmark-circle" size={28} color="#fff" style={{ marginRight: 12 }} />
                        <Text style={styles.actionBtnTextSuper}>Aprobar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtnRejectSuper} onPress={(e) => { e.stopPropagation(); Alert.alert('Confirmar rechazo', '¿Estás seguro de rechazar esta receta?', [ { text: 'Cancelar', style: 'cancel' }, { text: 'Rechazar', style: 'destructive', onPress: () => handleAction(item, 'reject') } ]); }}>
                        <Ionicons name="close-circle" size={28} color="#fff" style={{ marginRight: 12 }} />
                        <Text style={styles.actionBtnTextSuper}>Rechazar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
            contentContainerStyle={{ paddingBottom: 30 }}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingTop: 20,
  },
  header: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 18,
    marginLeft: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
    backgroundColor: '#fff',
  },
  avatarBlock: {
    position: 'relative',
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eee',
    zIndex: 2,
  },
  avatarBorder: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#f97316',
    zIndex: 1,
  },
  recipeImage: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#eee',
    marginLeft: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontFamily: 'Inter',
    fontWeight: 'bold',
    fontSize: 18,
    color: '#1e293b',
    marginBottom: 2,
  },
  message: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 6,
  },
  time: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#9ca3af',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  actionBtn: {
    backgroundColor: '#f97316',
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  actionBtnText: {
    color: '#fff',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 15,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 48,
    fontFamily: 'Inter',
    fontSize: 16,
  },
  separator: {
    height: 8,
  },
  badge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  cardRedesigned: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeBig: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 12,
  },
  titleBig: {
    fontFamily: 'Inter',
    fontWeight: 'bold',
    fontSize: 20,
    color: '#1e293b',
  },
  messageBig: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#475569',
    marginBottom: 10,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeLabel: {
    backgroundColor: '#e0e7ef',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    color: '#334155',
    fontWeight: 'bold',
    fontSize: 13,
    marginRight: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: 8,
  },
  actionBtnApprove: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 22,
    marginRight: 10,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  actionBtnReject: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 22,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  actionBtnText: {
    color: '#fff',
    fontFamily: 'Inter',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardModern: {
    backgroundColor: '#fff',
    borderRadius: 26,
    padding: 26,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 18,
    elevation: 6,
    flexDirection: 'column',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  titleBig: {
    fontFamily: 'Inter',
    fontWeight: 'bold',
    fontSize: 22,
    color: '#1e293b',
    marginBottom: 2,
  },
  autorModern: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#64748b',
    marginBottom: 2,
    marginLeft: 2,
  },
  timeModern: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 4,
  },
  messageModern: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#475569',
    marginBottom: 10,
    marginTop: 2,
  },
  infoRowModern: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeLabelModern: {
    backgroundColor: '#e0e7ef',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    color: '#334155',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 8,
  },
  actionsRowModern: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: 16,
  },
  actionBtnApproveModern: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginRight: 12,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 7,
    elevation: 2,
  },
  actionBtnRejectModern: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 28,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 7,
    elevation: 2,
  },
  actionBtnTextModern: {
    color: '#fff',
    fontFamily: 'Inter',
    fontWeight: 'bold',
    fontSize: 17,
  },
  cardSuperModern: {
    backgroundColor: '#f8fafc',
    borderRadius: 32,
    padding: 28,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e0e7ef',
    flexDirection: 'column',
    alignItems: 'flex-start',
    minWidth: 0,
  },
  cardHeaderRowSuper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  badgeSuper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  titleSuper: {
    fontFamily: 'Inter',
    fontWeight: 'bold',
    fontSize: 24,
    color: '#1e293b',
    marginBottom: 2,
  },
  autorSuper: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#64748b',
    marginBottom: 2,
    marginLeft: 2,
  },
  messageSuper: {
    fontFamily: 'Inter',
    fontSize: 17,
    color: '#475569',
    marginBottom: 12,
    marginTop: 4,
  },
  infoRowSuper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    justifyContent: 'space-between',
    width: '100%',
  },
  typeLabelSuper: {
    backgroundColor: '#e0e7ef',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 5,
    color: '#334155',
    fontWeight: 'bold',
    fontSize: 15,
    marginRight: 8,
  },
  timeSuper: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 0,
  },
  actionsRowSuper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: 18,
  },
  actionBtnApproveSuper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e', // Verde fuerte sólido
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginRight: 14,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 2,
  },
  actionBtnRejectSuper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444', // Rojo fuerte sólido
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 32,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 2,
  },
  actionBtnTextSuper: {
    color: '#fff',
    fontFamily: 'Inter',
    fontWeight: 'bold',
    fontSize: 18,
  },
}); 