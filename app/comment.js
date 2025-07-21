import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { API_URLS } from '../config/api';

export default function CommentsScreen() {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const router = useRouter();
  const { post, id } = useLocalSearchParams();
  const { userId, getToken } = useAuth();
  
  // Get recipe ID from parameters - only use id parameter
  const recipeId = id ? parseInt(id) : null;
  
  console.log('=== COMMENT SCREEN DEBUG ===');
  console.log('Raw params:', { post, id });
  console.log('Parsed recipeId:', recipeId);
  console.log('Type of id:', typeof id);
  console.log('Type of recipeId:', typeof recipeId);
  console.log('userId:', userId);

  // Función para sincronizar comentarios con el backend
  const syncCommentsWithBackend = async () => {
    try {
      console.log('Attempting to sync comments with backend...');
      const res = await fetch(API_URLS.COMMENTS.BY_RECIPE(recipeId), {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        
        if (data && data.success && data.data && data.data.comments) {
          console.log('Backend comments found:', data.data.comments);
          setComments(data.data.comments);
          Alert.alert('Sincronizado', 'Comentarios actualizados');
        } else {
          Alert.alert('Sin cambios', 'No hay comentarios nuevos');
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
    
    const loadComments = async () => {
      try {
        const response = await fetch(API_URLS.COMMENTS.BY_RECIPE(recipeId), {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data && data.success && data.data && data.data.comments) {
            console.log('=== COMMENTS DATA FROM BACKEND ===');
            console.log('Full response:', data);
            console.log('Comments array:', data.data.comments);
            
            if (data.data.comments.length > 0) {
              console.log('First comment full data:', data.data.comments[0]);
              console.log('First comment user data:', data.data.comments[0]?.user);
              console.log('First comment user fields:', {
                username: data.data.comments[0]?.user?.username,
                firstName: data.data.comments[0]?.user?.firstName,
                email: data.data.comments[0]?.user?.email,
                displayName: data.data.comments[0]?.user?.displayName,
                name: data.data.comments[0]?.user?.name,
                idSocialMedia: data.data.comments[0]?.user?.idSocialMedia,
                id: data.data.comments[0]?.user?.id,
                userId: data.data.comments[0]?.userId
              });
              
              // Verificar si el backend está usando idSocialMedia en lugar del username real
              if (data.data.comments[0]?.user?.idSocialMedia && !data.data.comments[0]?.user?.username) {
                console.log('⚠️ PROBLEMA: Backend está usando idSocialMedia en lugar del username de Clerk');
                console.log('idSocialMedia:', data.data.comments[0]?.user?.idSocialMedia);
                console.log('userId (Clerk ID):', data.data.comments[0]?.userId);
              }
            }
            
            setComments(data.data.comments);
          } else {
            console.log('No comments found in backend');
            setComments([]);
          }
        } else {
          console.log('Backend error, status:', response.status);
          setComments([]);
        }
      } catch (error) {
        console.log('Error loading comments:', error);
        setComments([]);
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
    
    try {
      console.log('Sending comment to backend...');
      console.log('URL:', API_URLS.COMMENTS.CREATE(userId));
      console.log('Payload:', { recipeId: recipeId, content: newComment.trim() });
      
      const token = await getToken();
      const res = await fetch(API_URLS.COMMENTS.CREATE(userId), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
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
        // Función helper para obtener el nombre de usuario del nuevo comentario
        const getUserDisplayName = (userData, userId) => {
          if (!userData) return userId || 'Usuario';
          
          // Priorizar el username real de Clerk, NO usar idSocialMedia
          return userData.username || 
                 userData.firstName || 
                 userData.email || 
                 userData.displayName ||
                 userData.name ||
                 // Si no tenemos username, mostrar el userId (Clerk ID) en lugar de 'Usuario'
                 userId ||
                 'Usuario';
        };

        // Asegurar que el nuevo comentario tenga el formato correcto
        const newCommentWithUser = {
          ...data.data,
          user: {
            ...data.data.user,
            displayName: getUserDisplayName(data.data.user, data.data.userId)
          }
        };

        // Agregar el nuevo comentario al inicio de la lista
        setComments(prev => [newCommentWithUser, ...prev]);
        setNewComment('');
        Alert.alert('Éxito', 'Comentario agregado correctamente');
      } else {
        Alert.alert('Error', data.error || 'No se pudo crear el comentario');
      }
    } catch (error) {
      console.log('Error sending comment:', error);
      Alert.alert('Error', 'Error de conexión al crear el comentario');
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

  const renderComment = ({ item }) => {
    // Función helper para obtener el nombre de usuario de diferentes formas
    const getUserDisplayName = (userData, userId) => {
      if (!userData) return userId || 'Usuario';
      
      // Priorizar el username real de Clerk, NO usar idSocialMedia
      return userData.username || 
             userData.firstName || 
             userData.email || 
             userData.displayName ||
             userData.name ||
             // Si no tenemos username, mostrar el userId (Clerk ID) en lugar de 'Usuario'
             userId ||
             'Usuario';
    };

    // Función helper para obtener la imagen del usuario
    const getUserImage = (userData) => {
      if (!userData) return 'https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvdXBsb2FkZWQvaW1nXzJ6QTNzeUU0cXZjQTdxTkRZNE56Nm5tb2hkaCJ9';
      
      return userData.imageUrl || 
             userData.profileImage ||
             userData.avatar ||
             'https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvdXBsb2FkZWQvaW1nXzJ6QTNzeUU0cXZjQTdxTkRZNE56Nm5tb2hkaCJ9';
    };

    const displayName = getUserDisplayName(item.user, item.userId);
    const userImage = getUserImage(item.user);

    console.log('Rendering comment with user data:', {
      commentId: item.id,
      user: item.user,
      displayName: displayName,
      userImage: userImage,
      userId: item.userId,
      idSocialMedia: item.user?.idSocialMedia
    });
    
    return (
      <View style={styles.commentContainer}>
        <View style={styles.commentHeader}>
          <Image 
            source={{ uri: userImage }} 
            style={styles.avatar}
          />
          <View style={styles.commentInfo}>
            <Text style={styles.username}>
              {displayName}
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
  };

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
