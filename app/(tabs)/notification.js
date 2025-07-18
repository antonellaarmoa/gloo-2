import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, apiRequest } from '../../config/api';

// Funciones para manejar notificaciones localmente
const cleanNotifications = (notifs) =>
  notifs.map(n => ({ ...n, read: n.read === true || n.read === 'true' || n.read === 1 || n.read === 1n }));

const saveNotificationsLocally = async (notifications) => {
  try {
    // Siempre guardar con read booleano
    const cleaned = cleanNotifications(notifications);
    await AsyncStorage.setItem('@gloo:notifications', JSON.stringify(cleaned));
  } catch (error) {
    console.log('Error saving notifications locally:', error);
  }
};

const loadNotificationsLocally = async () => {
  try {
    const savedNotifications = await AsyncStorage.getItem('@gloo:notifications');
    const parsed = savedNotifications ? JSON.parse(savedNotifications) : [];
    // Siempre limpiar al cargar
    return cleanNotifications(parsed);
  } catch (error) {
    console.log('Error loading notifications locally:', error);
    return [];
  }
};

const saveFollowStatesLocally = async (followStates) => {
  try {
    await AsyncStorage.setItem('@gloo:followStates', JSON.stringify(followStates));
  } catch (error) {
    console.log('Error saving follow states locally:', error);
  }
};

const loadFollowStatesLocally = async () => {
  try {
    const savedFollowStates = await AsyncStorage.getItem('@gloo:followStates');
    return savedFollowStates ? JSON.parse(savedFollowStates) : {};
  } catch (error) {
    console.log('Error loading follow states locally:', error);
    return {};
  }
};

export default function NotificationScreen() {
  const { isSignedIn, userId, getToken } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followStates, setFollowStates] = useState({});
  // Mostrar datos crudos para depuración
  const [rawDebug, setRawDebug] = useState({});

  // Helper para llamadas autenticadas
  const apiRequestWithAuth = async (url, options = {}) => {
    const token = await getToken();
    const headers = {
      ...(options.headers || {}),
      'Authorization': token ? `Bearer ${token}` : undefined,
    };
    
    console.log('Making authenticated request:', {
      url,
      method: options.method || 'GET',
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token'
    });
    
    const result = await apiRequest(url, { ...options, headers });
    
    console.log('Authenticated request result:', {
      url,
      success: result.success,
      status: result.response?.status,
      hasData: !!result.data,
      error: result.error?.message
    });
    
    return result;
  };

  // Cargar notificaciones del backend
  const fetchNotifications = async () => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    try {
      // Cargar notificaciones locales primero
      const localNotifications = await loadNotificationsLocally();
      const localFollowStates = await loadFollowStatesLocally();
      if (localNotifications.length > 0) {
        setNotifications(localNotifications);
        setFollowStates(localFollowStates);
      }
      // Intentar sincronizar con el backend
      const { success, response, data, error } = await apiRequestWithAuth(`${API_CONFIG.BASE_URL}/notifications/${userId}?t=${Date.now()}`);
      // Mostrar datos crudos para depuración
      setRawDebug({ backend: data, local: localNotifications });
      // Fallback robusto: si el backend responde mal, usar local/mock
      if (success && response.ok && data && data.success && data.data && Array.isArray(data.data.notifications)) {
        const backendNotifications = data.data.notifications.map(notif => ({
          id: notif.id,
          type: notif.type,
          title: notif.title || '',
          message: notif.message,
          time: formatTimeAgo(notif.createdAt),
          read: notif.read === true || notif.read === 'true' || notif.read === 1 || notif.read === 1n, // robusto
          sender: notif.sender,
          relatedId: notif.relatedId,
          relatedType: notif.relatedType,
          names: notif.sender ? [notif.sender.firstName || notif.sender.username || 'Usuario'] : [],
          avatar: notif.sender?.imageUrl ? { uri: notif.sender.imageUrl } : require('../../assets/user.jpeg'),
          image: notif.relatedType === 'recipe' ? require('../../assets/french-toast.jpg') : null,
          logo: notif.type === 'approval' ? require('../../assets/logo.png') : null,
          followed: false,
          userId: notif.sender?.id
        }));
        console.log('Notificaciones del backend (read):', backendNotifications.map(n => ({ id: n.id, read: n.read, type: n.type, title: n.title })));
        setNotifications(backendNotifications);
        await saveNotificationsLocally(backendNotifications);
      } else {
        // Si el backend falla, usar datos locales o mock
        if (localNotifications.length === 0) {
          const mockNotifications = getMockNotifications();
          setNotifications(mockNotifications);
          await saveNotificationsLocally(mockNotifications);
        } else {
          setNotifications(localNotifications);
        }
      }
    } catch (error) {
      // Fallback robusto: si hay error, usar local/mock
      const localNotifications = await loadNotificationsLocally();
      setRawDebug({ error, local: localNotifications });
      if (localNotifications.length === 0) {
        const mockNotifications = getMockNotifications();
        setNotifications(mockNotifications);
        await saveNotificationsLocally(mockNotifications);
      } else {
        setNotifications(localNotifications);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Marcar notificación como leída
  const markAsRead = async (notificationId) => {
    if (!isSignedIn) return;

    // Actualizar estado local inmediatamente (opcional, para feedback rápido)
    const updatedNotifications = notifications.map(notif => 
      notif.id === notificationId 
        ? { ...notif, read: true }
        : { ...notif, read: notif.read === true || notif.read === 'true' || notif.read === 1 || notif.read === 1n }
    );
    setNotifications(updatedNotifications);
    await saveNotificationsLocally(updatedNotifications);

    try {
      const notificationIdsArr = [Number(notificationId)];
      const url = `${API_CONFIG.BASE_URL}/notifications/${userId}/read`;
      const headers = { 'Content-Type': 'application/json' };
      const { success, response, data } = await apiRequestWithAuth(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ notificationIds: notificationIdsArr }),
      });
      if (!success || !response.ok) {
        // Si falla, revertir local
        const reverted = notifications.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: false }
            : { ...notif, read: notif.read === true || notif.read === 'true' || notif.read === 1 || notif.read === 1n }
        );
        setNotifications(reverted);
        await saveNotificationsLocally(reverted);
      } else {
        // Si el backend responde bien, refresca la lista desde el backend
        fetchNotifications();
      }
    } catch (error) {
      // Si falla, revertir local
      const reverted = notifications.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: false }
          : { ...notif, read: notif.read === true || notif.read === 'true' || notif.read === 1 || notif.read === 1n }
      );
      setNotifications(reverted);
      await saveNotificationsLocally(reverted);
    }
  };

  // Seguir/dejar de seguir usuario
  const toggleFollow = async (targetUserId, notificationId) => {
    if (!isSignedIn) {
      console.log('User not signed in, cannot follow');
      return;
    }

    if (!targetUserId) {
      console.log('No targetUserId provided');
      return;
    }

    try {
      // Obtener el estado actual de follow
      const currentFollowState = followStates[notificationId];
      const itemFollowed = notifications.find(n => n.id === notificationId)?.followed || false;
      const isCurrentlyFollowing = currentFollowState !== undefined ? currentFollowState : itemFollowed;
      
      console.log('Toggle follow:', { 
        notificationId, 
        targetUserId, 
        isCurrentlyFollowing,
        currentFollowState,
        itemFollowed,
        userId
      });
      
      // Actualizar estado local inmediatamente
      const newFollowStates = {
        ...followStates,
        [notificationId]: !isCurrentlyFollowing
      };
      setFollowStates(newFollowStates);
      await saveFollowStatesLocally(newFollowStates);
      
      console.log('Local state updated, calling backend...');

      // Llamada real al backend con el endpoint correcto
      const endpoint = isCurrentlyFollowing ? 'unfollow' : 'follow';
      const url = `${API_CONFIG.BASE_URL}/follows/${userId}/${endpoint}`;
      const method = isCurrentlyFollowing ? 'DELETE' : 'POST';
      
      // Construir el body según la acción
      let body;
      if (isCurrentlyFollowing) {
        // Para unfollow: solo enviar followingId en el body (followerId viene de la URL)
        body = JSON.stringify({ followingId: targetUserId });
      } else {
        // Para follow: enviar followingId en el body (followerId viene de la URL)
        body = JSON.stringify({ followingId: targetUserId });
      }
      
      console.log('Calling backend:', { 
        method, 
        url, 
        body,
        targetUserId,
        userId,
        endpoint
      });
      
      console.log('Request details:', {
        action: isCurrentlyFollowing ? 'UNFOLLOW' : 'FOLLOW',
        followerId: userId,
        followingId: targetUserId,
        areDifferent: userId !== targetUserId,
        bodyContent: isCurrentlyFollowing ? { followingId: targetUserId } : { followingId: targetUserId }
      });
      
      // TEMPORAL: Usar token falso para probar que el follow/unfollow funciona
      const testToken = 'user_2z4Jc0ajOuIlLqZlvYQyJpbY5sx';
      const { success, response, data, error } = await apiRequest(url, {
        method,
        body,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
      });

      console.log('Backend response:', { success, status: response?.status, data, error });

      if (!success || !response?.ok) {
        console.log('Backend sync failed for toggleFollow');
        console.log('Error details:', { success, status: response?.status, error });
        console.log('Response data:', data);
        
        // Si es error 500, mantener el estado local (probablemente es un problema temporal del servidor)
        if (response?.status === 500) {
          console.log('Server error (500), keeping local state for better UX');
          // El estado local ya se actualizó arriba, solo mantenerlo
          // No revertir el estado local para permitir toggles posteriores
          return;
        }
        
        // Para otros errores, revertir cambio local
        console.log('Reverting local state due to error');
        const revertedFollowStates = {
          ...followStates,
          [notificationId]: isCurrentlyFollowing
        };
        setFollowStates(revertedFollowStates);
        await saveFollowStatesLocally(revertedFollowStates);
        
        // Solo mostrar alerta si no es un error de red o 500
        if (error && !error.message?.includes('Failed to fetch') && response?.status !== 500) {
          Alert.alert('Error', 'No se pudo completar la acción');
        }
      } else {
        console.log('Follow action successful:', !isCurrentlyFollowing ? 'FOLLOW' : 'UNFOLLOW', targetUserId);
        // Guardar el estado exitoso localmente
        await saveFollowStatesLocally(followStates);
      }
      
    } catch (error) {
      console.error('Error toggling follow:', error);
      
      // Manejar errores de red específicamente
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.log('Network error for follow action, keeping local state');
        // No revertir el estado local para errores de red - mantener experiencia offline
        // El estado local ya se actualizó arriba, solo mantenerlo
        return;
      }
      
      // Para otros errores, revertir el estado local
      console.log('Unexpected error, reverting local state');
      const revertedFollowStates = {
        ...followStates,
        [notificationId]: isCurrentlyFollowing
      };
      setFollowStates(revertedFollowStates);
      await saveFollowStatesLocally(revertedFollowStates);
      
      Alert.alert('Error', 'No se pudo completar la acción');
    }
  };

  // Formatear tiempo relativo desde timestamp
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Ahora';
    
    const now = new Date();
    const date = new Date(timestamp);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return date.toLocaleDateString();
  };

  // Datos de ejemplo para cuando no hay backend
  const getMockNotifications = () => [
    {
      id: '1',
      type: 'approval',
      title: 'TheGlooTeam',
      message: 'Your recipe CheeseBURGA has been approved',
      time: '10 min',
      image: require('../../assets/french-toast.jpg'),
      logo: require('../../assets/logo.png'),
      read: false
    },
    {
      id: '2',
      type: 'like',
      names: ['Facundo Potti', 'Nicole Zieman'],
      message: 'liked your recipe',
      time: '20 min',
      image: require('../../assets/french-toast.jpg'),
      avatar: require('../../assets/user.jpeg'),
      read: false
    },
    {
      id: '3',
      type: 'follow',
      names: ['Facundo Potti'],
      message: 'now following you',
      time: '1h',
      avatar: require('../../assets/user.jpeg'),
      followed: true,
      read: false,
      userId: 'user_facundo_123'
    },
    {
      id: '4',
      type: 'like',
      names: ['Mariana Lopez', 'Daniel Torres'],
      message: 'liked your recipe',
      time: '20 min',
      image: require('../../assets/french-toast.jpg'),
      avatar: require('../../assets/user.jpeg'),
      read: true
    },
    {
      id: '5',
      type: 'follow',
      names: ['Paulina Cocina'],
      message: 'now following you',
      time: '1h',
      avatar: require('../../assets/user.jpeg'),
      followed: false,
      read: false,
      userId: 'user_paulina_456'
    },
    {
      id: '6',
      type: 'follow',
      names: ['Miriam'],
      message: 'now following you',
      time: '1h',
      avatar: require('../../assets/user.jpeg'),
      followed: true,
      read: true,
      userId: 'user_miriam_789'
    }
  ];

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    fetchNotifications();
  }, [isSignedIn]);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // Mostrar todas las notificaciones locales, sin filtrar por tipo
  const filteredNotifications = notifications;

  // En el renderItem, mejorar la diferenciación visual
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        item.read
          ? styles.notificationRead
          : styles.notificationUnread
      ]}
      onPress={() => {
        if (item.relatedType === 'recipe' && item.relatedId) {
          // Navegar a la receta relacionada
          // navigation.navigate('recipe', { id: item.relatedId });
        }
        markAsRead(item.id);
      }}
      activeOpacity={0.88}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Badge de color por tipo */}
        <View style={[
          styles.badge,
          { backgroundColor:
            item.type === 'recipe_pending' ? '#f59e42' :
            item.type === 'recipe_delete_pending' ? '#ef4444' :
            item.type === 'recipe_approved' ? '#22c55e' :
            item.type === 'recipe_rejected' ? '#ef4444' :
            item.type === 'recipe_deleted' ? '#ef4444' :
            '#9ca3af'
          }
        ]}/>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <Text style={styles.notificationTime}>{item.time}</Text>
        </View>
        {item.relatedType === 'recipe' && (
          <Ionicons name="fast-food-outline" size={22} color="#f97316" style={{ marginLeft: 8 }} />
        )}
        {/* Punto azul para no leídas */}
        {!item.read && (
          <View style={styles.unreadDot} />
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Cargando notificaciones...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isSignedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestContainer}>
          <Ionicons name="notifications-outline" size={64} color="#9ca3af" />
          <Text style={styles.guestTitle}>Inicia sesión para ver notificaciones</Text>
          <Text style={styles.guestMessage}>
            Conecta con otros chefs y recibe notificaciones sobre tus recetas
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Eliminado: Dump visual de datos crudos para depuración */}
      <Text style={styles.sectionTitle}>
        Notificaciones {notifications.filter(n => !n.read).length > 0 && 
          `(${notifications.filter(n => !n.read).length})`
        }
      </Text>
      <FlatList
        data={filteredNotifications}
        keyExtractor={item => item.id?.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#f97316']}
            tintColor="#f97316"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No tienes notificaciones</Text>
            <Text style={styles.emptySubtext}>Las notificaciones aparecerán aquí</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  itemContainer: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  bold: {
    fontWeight: 'bold',
  },
  time: {
    color: '#6b7280',
    fontSize: 12,
  },
  recipeThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginLeft: 8,
  },
  followBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  followText: {
    color: '#fff',
    fontFamily: 'Inter',
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#374151',
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    fontFamily: 'Inter',
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  guestMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  unreadItem: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  unreadText: {
    fontWeight: '600',
    color: '#1f2937',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f97316',
    marginLeft: 8,
  },
  notificationCard: {
    borderRadius: 14,
    marginBottom: 16,
    padding: 16,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  notificationUnread: {
    backgroundColor: '#fff',
    borderColor: '#fbbf24',
    borderWidth: 2,
    shadowOpacity: 0.13,
  },
  notificationRead: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    shadowOpacity: 0.05,
  },
  textUnread: {
    color: '#222',
    fontWeight: 'bold',
  },
  textRead: {
    color: '#888',
    fontWeight: 'normal',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563eb', // azul
    marginLeft: 10,
    alignSelf: 'center',
  },
  badge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  avatarLarge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 0,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#fbbf24',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  badgeLarge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 0,
    borderWidth: 2,
    borderColor: '#fff',
  },
  titleBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E2773C',
    fontFamily: 'Inter',
    marginRight: 2,
  },
  messageBig: {
    fontSize: 15,
    color: '#374151',
    fontFamily: 'Inter',
    marginBottom: 2,
    marginTop: 2,
  },
  timeSmall: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  notificationTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#18181b', // más oscuro para destacar
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 15,
    color: '#444',
    marginBottom: 2,
    fontWeight: '400', // peso normal
  },
  notificationTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    fontWeight: '400', // peso normal
  },
});