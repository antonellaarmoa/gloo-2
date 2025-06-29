import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COMMENTS_API_URL = 'https://gloo-api-production.up.railway.app/api/v1/comments';

export default function CommentsScreen() {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const router = useRouter();
  const { post, id } = useLocalSearchParams();
  const { userId } = useAuth();
  
  // Get recipe ID from parameters - only use id parameter
  const recipeId = id ? parseInt(id) : null;
  
  console.log('=== COMMENT SCREEN DEBUG ===');
  console.log('Raw params:', { post, id });
  console.log('Parsed recipeId:', recipeId);
  console.log('Type of id:', typeof id);
  console.log('Type of recipeId:', typeof recipeId);
  console.log('userId:', userId);

  // Funciones para manejar comentarios locales
  const saveCommentsLocally = async (comments) => {
    try {
      await AsyncStorage.setItem(`comments_${recipeId}`, JSON.stringify(comments));
    } catch (error) {
      console.log('Error saving comments locally:', error);
    }
  };

  const loadCommentsLocally = async () => {
    try {
      const savedComments = await AsyncStorage.getItem(`comments_${recipeId}`);
      return savedComments ? JSON.parse(savedComments) : [];
    } catch (error) {
      console.log('Error loading comments locally:', error);
      return [];
    }
  };

  // Función para sincronizar comentarios con el backend
  const syncCommentsWithBackend = async () => {
    try {
      console.log('Attempting to sync comments with backend...');
      const res = await fetch(`${COMMENTS_API_URL}/recipe/${recipeId}`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        let backendComments = [];
        
        if (data && data.success && data.data) {
          backendComments = Array.isArray(data.data) ? data.data : [];
        } else if (Array.isArray(data)) {
          backendComments = data;
        }
        
        if (backendComments.length > 0) {
          console.log('Backend comments found:', backendComments);
          setComments(backendComments.reverse());
          await saveCommentsLocally(backendComments.reverse());
          Alert.alert('Sincronizado', 'Comentarios sincronizados con el servidor');
        } else {
          Alert.alert('Sin cambios', 'No hay comentarios nuevos en el servidor');
        }
      } else {
        throw new Error('Backend not available');
      }
    } catch (error) {
      console.log('Sync failed:', error);
      Alert.alert('Error', 'No se pudo sincronizar con el servidor');
    }
  };

  // Fetch comentarios del backend
  useEffect(() => {
    if (!recipeId) {
      console.log('No recipeId found:', { post, id, recipeId });
      setLoading(false);
      return;
    }
    
    setLoading(true);
    console.log('Loading comments for recipe:', recipeId);
    
    // Cargar comentarios del backend primero, luego locales como fallback
    const loadComments = async () => {
      try {
        // Intentar cargar del backend
        const response = await fetch(`${COMMENTS_API_URL}/recipe/${recipeId}`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          let backendComments = [];
          
          if (data && data.success && data.data) {
            backendComments = Array.isArray(data.data) ? data.data : [];
          } else if (Array.isArray(data)) {
            backendComments = data;
          }
          
          if (backendComments.length > 0) {
            console.log('Found backend comments:', backendComments);
            setComments(backendComments.reverse());
            await saveCommentsLocally(backendComments.reverse());
          } else {
            // Si no hay comentarios en el backend, cargar locales
            const localComments = await loadCommentsLocally();
            if (localComments.length > 0) {
              console.log('Found local comments:', localComments);
              setComments(localComments);
            } else {
              // Solo usar comentarios de ejemplo si no hay comentarios locales
              console.log('No comments found, using fallback');
              const fallbackComments = [
                {
                  id: 1,
                  content: "¡Esta receta se ve deliciosa! Definitivamente la voy a probar.",
                  createdAt: new Date().toISOString(),
                  userId: "user_example",
                  user: {
                    id: "user_example",
                    username: "ChefEjemplo",
                    email: "chef@example.com",
                    imageUrl: "https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvdXBsb2FkZWQvaW1nXzJ6QTNzeUU0cXZjQTdxTkRZNE56Nm5tb2hkaCJ9"
                  }
                },
                {
                  id: 2,
                  content: "Los ingredientes se ven perfectos. ¿Alguien ya la probó?",
                  createdAt: new Date(Date.now() - 3600000).toISOString(),
                  userId: "user_example2",
                  user: {
                    id: "user_example2",
                    username: "CocineroFeliz",
                    email: "cocinero@example.com",
                    imageUrl: "https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvdXBsb2FkZWQvaW1nXzJ6QTNzeUU0cXZjQTdxTkRZNE56Nm5tb2hkaCJ9"
                  }
                }
              ];
              setComments(fallbackComments);
            }
          }
        } else {
          // Si el backend falla, cargar locales
          const localComments = await loadCommentsLocally();
          if (localComments.length > 0) {
            console.log('Found local comments:', localComments);
            setComments(localComments);
          } else {
            setComments([]);
          }
        }
      } catch (error) {
        console.log('Error loading comments:', error);
        // Si hay error, cargar locales
        const localComments = await loadCommentsLocally();
        if (localComments.length > 0) {
          console.log('Found local comments:', localComments);
          setComments(localComments);
        } else {
          setComments([]);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadComments();
  }, [recipeId]);

  const handleSend = async () => {
    if (!newComment.trim() || !recipeId || !userId) {
      Alert.alert('Error', 'Debes iniciar sesión y escribir un comentario');
      return;
    }
    
    setSending(true);
    
    // Crear el comentario localmente primero
    const newCommentData = {
      id: Date.now(),
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
      userId: userId,
      recipeId: recipeId,
      user: {
        id: userId,
        username: 'Tú',
        email: '',
        imageUrl: 'https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvdXBsb2FkZWQvaW1nXzJ6QTNzeUU0cXZjQTdxTkRZNE56Nm5tb2hkaCJ9'
      }
    };
    
    try {
      console.log('Sending comment to backend...');
      console.log('URL:', `${COMMENTS_API_URL}/${userId}`);
      console.log('Payload:', { recipeId: recipeId, content: newComment.trim() });
      
      const res = await fetch(`${COMMENTS_API_URL}/${userId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          recipeId: recipeId, 
          content: newComment.trim() 
        }),
      });

      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);

      if (res.ok && data.success) {
        // Si el backend responde correctamente, usar los datos del backend
        const backendCommentData = {
          ...data.data,
          id: data.data.id || Date.now(),
          createdAt: data.data.createdAt || new Date().toISOString(),
          user: data.data.user || newCommentData.user
        };
        
        setComments(prev => [backendCommentData, ...prev]);
        
        // Guardar comentarios localmente para que persistan
        const updatedComments = [backendCommentData, ...comments];
        await saveCommentsLocally(updatedComments);
        
        setNewComment('');
        Alert.alert('Éxito', 'Comentario agregado correctamente');
      } else {
        // Si el backend falla, usar el comentario local
        console.log('Backend failed, using local comment');
        throw new Error('Backend failed');
      }
    } catch (error) {
      console.log('Error sending comment:', error);
      
      // Usar comentario local cuando el backend falla
      setComments(prev => [newCommentData, ...prev]);
      
      // Guardar comentarios localmente para que persistan
      const updatedComments = [newCommentData, ...comments];
      await saveCommentsLocally(updatedComments);
      
      setNewComment('');
      Alert.alert('Comentario guardado', 'Comentario guardado localmente');
    } finally {
      setSending(false);
    }
  };

  const toggleLike = (commentId) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, liked: !comment.liked, likes: (comment.likes || 0) + (comment.liked ? -1 : 1) }
          : comment
      )
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderComment = ({ item }) => (
    <View style={styles.commentContainer}>
      <View style={styles.commentHeader}>
        <Image 
          source={{ uri: item.user?.imageUrl || 'https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvdXBsb2FkZWQvaW1nXzJ6QTNzeUU0cXZjQTdxTkRZNE56Nm5tb2hkaCJ9' }} 
          style={styles.avatar}
        />
        <View style={styles.commentInfo}>
          <Text style={styles.username}>
            {item.user?.username || item.user?.firstName || item.user?.email || 'Usuario'}
          </Text>
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
      <Text style={styles.commentText}>{item.content}</Text>
      <TouchableOpacity 
        style={styles.likeButton} 
        onPress={() => toggleLike(item.id)}
      >
        <Ionicons 
          name={item.liked ? 'heart' : 'heart-outline'} 
          size={16} 
          color={item.liked ? '#ff4757' : '#666'} 
        />
        <Text style={[styles.likeText, item.liked && styles.likedText]}>
          {item.likes || 0}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b35" />
        <Text style={styles.loadingText}>Cargando comentarios...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            // Si no hay pantalla anterior, ir a home
            router.replace('/(tabs)/home');
          }
        }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comentarios</Text>
        <TouchableOpacity onPress={syncCommentsWithBackend} style={styles.syncButton}>
          <Ionicons name="refresh" size={24} color="#F9690E" />
        </TouchableOpacity>
      </View>

      {comments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No hay comentarios aún</Text>
          <Text style={styles.emptySubtext}>¡Sé el primero en comentar!</Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id.toString()}
          style={styles.commentsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un comentario..."
          value={newComment}
          onChangeText={setNewComment}
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendButton, (!newComment.trim() || sending) && styles.sendButtonDisabled]} 
          onPress={handleSend}
          disabled={!newComment.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  syncButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  commentContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  likeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  likedText: {
    color: '#ff4757',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#ff6b35',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
