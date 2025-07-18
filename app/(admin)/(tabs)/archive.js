import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { API_CONFIG, apiRequest } from '../../../config/api';
import { useAdminHistory } from '../../../context/AdminHistoryContext';
import { Ionicons } from '@expo/vector-icons';

export default function AdminHistoryScreen() {
  const { getToken, userId } = useAuth();
  const { history, clearHistory, setHistory } = useAdminHistory();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
      const token = await getToken();
        const res = await apiRequest(
          `${API_CONFIG.BASE_URL}/notifications/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        let data = [];
        if (Array.isArray(res?.data?.data)) {
          data = res.data.data;
        } else if (Array.isArray(res?.data?.data?.notifications)) {
          data = res.data.data.notifications;
        }
        // setHistory(data); // This line is removed as history is now managed by context
      } catch (error) {
        // setHistory([]); // This line is removed as history is now managed by context
      } finally {
      setLoading(false);
      }
    };
    fetchHistory();
  }, [userId]);

  // Mostrar SOLO notificaciones de acciones resueltas
  const tiposResueltos = [
    'recipe_approved',
    'recipe_rejected',
    'recipe_deleted',
    'recipe_update_approved',
    'recipe_update_rejected',
    // agrega más si existen
  ];

  // Usar el historial persistente
  const historialFiltrado = history;
  console.log('HISTORIAL ACTUAL EN ARCHIVE:', history);

  // Helper para mostrar el estado y color según el tipo
  function getEstadoYColor(type) {
    switch (type) {
      case 'recipe_approved':
        return { texto: 'Aprobada', color: '#22c55e' };
      case 'recipe_rejected':
        return { texto: 'Rechazada', color: '#ef4444' };
      case 'recipe_deleted':
        return { texto: 'Eliminada', color: '#ef4444' };
      case 'recipe_update_approved':
        return { texto: 'Edición aprobada', color: '#22c55e' };
      case 'recipe_update_rejected':
        return { texto: 'Edición rechazada', color: '#ef4444' };
      case 'recipe_approval':
      case 'recipe_update_pending':
      case 'recipe_delete_pending':
        return { texto: 'Pendiente', color: '#facc15' }; // amarillo
      default:
        return { texto: 'Acción', color: '#9ca3af' };
    }
  }

  // Eliminar una acción individual
  const eliminarAccion = (id) => {
    const nuevoHistorial = history.filter(item => item.id !== id);
    setHistory(nuevoHistorial);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* <Text style={styles.header}>Historial</Text> */}
      {loading ? (
        <Text style={styles.loading}>Cargando...</Text>
      ) : (
        <>
        <FlatList
            data={historialFiltrado}
          keyExtractor={item => item.id?.toString()}
            renderItem={({ item }) => {
              // Determinar color y texto según la acción
              let estado = { texto: '', color: '' };
              switch (item.action) {
                case 'approved':
                  estado = { texto: 'Aprobada', color: '#22c55e' };
                  break;
                case 'rejected':
                  estado = { texto: 'Rechazada', color: '#ef4444' };
                  break;
                default:
                  estado = { texto: item.action, color: '#9ca3af' };
              }
              return (
                <View style={[styles.cardSuperModern, { position: 'relative' }]}> 
                  <TouchableOpacity onPress={() => eliminarAccion(item.id)} style={styles.trashButtonSuper}>
                    <Ionicons name="trash" size={24} color="#ef4444" />
                  </TouchableOpacity>
                  <View style={styles.cardHeaderRowSuper}>
                    <View style={[styles.badgeSuper, { backgroundColor: estado.color }]}> 
                      {estado.color === '#22c55e' ? <Ionicons name="checkmark" size={16} color="#fff" /> : estado.color === '#ef4444' ? <Ionicons name="close" size={16} color="#fff" /> : <Ionicons name="time" size={16} color="#fff" />}
                    </View>
              <View style={{ flex: 1 }}>
                      <Text style={styles.titleSuper}>{item.recipeName && item.recipeName !== 'nueva receta' && item.recipeName !== 'Sin título' ? item.recipeName : '[Receta sin nombre]'}</Text>
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
                  </View>
                  <View style={styles.infoRowSuper}>
                    <Text style={styles.estadoAccionSuper}>{estado.texto}</Text>
                    {item.date && (
                      <Text style={styles.timeSuper}>{new Date(item.date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</Text>
                    )}
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={<Text style={styles.emptyText}>No hay historial</Text>}
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
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 16,
    elevation: 5,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: 'Inter',
    fontWeight: 'bold',
    fontSize: 22,
    color: '#1e293b',
    marginBottom: 2,
  },
  message: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#475569',
    marginBottom: 10,
    marginTop: 2,
  },
  time: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 4,
  },
  loading: {
    textAlign: 'center',
    marginTop: 40,
    color: '#64748b',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 48,
    fontFamily: 'Inter',
    fontSize: 16,
  },
  badge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  estadoAccion: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#1e293b',
    fontWeight: 'bold',
    marginLeft: 6,
    marginTop: 0,
    marginBottom: 0,
  },
  autor: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#64748b',
    marginBottom: 2,
    marginLeft: 2,
  },
  trashButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    zIndex: 10,
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
  infoRowSuper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    justifyContent: 'space-between',
    width: '100%',
  },
  estadoAccionSuper: {
    fontFamily: 'Inter',
    fontSize: 18,
    color: '#1e293b',
    fontWeight: 'bold',
    marginLeft: 6,
    marginTop: 0,
    marginBottom: 0,
  },
  timeSuper: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 0,
  },
  trashButtonSuper: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 10,
    backgroundColor: '#fef2f2',
    borderRadius: 18,
    zIndex: 10,
  },
}); 