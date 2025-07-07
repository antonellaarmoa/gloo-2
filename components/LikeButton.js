import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Text, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { API_CONFIG, buildApiUrl } from '../config/api';

const LIKES_API_URL = buildApiUrl(API_CONFIG.ENDPOINTS.LIKES);

export default function LikeButton({
  recipeId,
  initialCount = 0,
  size = 28,
  style = {},
  showCount = true,
  onLikeChange,
}) {
  const { userId } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recipeId && userId) {
      checkLikeStatus();
    }
  }, [recipeId, userId]);

  const checkLikeStatus = async () => {
    try {
      const response = await fetch(`${LIKES_API_URL}/${userId}/status/${recipeId}`);
      const data = await response.json();
      
      if (data.success) {
        setLiked(data.data.isLiked);
      }
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleToggleLike = async () => {
    if (!userId || !recipeId || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`${LIKES_API_URL}/${userId}/${liked ? 'unlike' : 'like'}`, {
        method: liked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeId: parseInt(recipeId),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setLiked(!liked);
        setLikeCount((c) => liked ? Math.max(0, c - 1) : c + 1);
        
        if (onLikeChange) {
          onLikeChange(!liked, likeCount + (liked ? -1 : 1));
        }
      } else {
        Alert.alert('Error', data.error || 'Error al procesar el like');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Error de conexión al procesar el like');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleToggleLike}
      activeOpacity={0.7}
      disabled={loading}
    >
      <View style={[styles.iconContainer, liked && styles.iconContainerLiked]}>
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={size}
          color="white"
          style={[styles.icon, loading && styles.disabledIcon]}
        />
      </View>
      {showCount && (
        <Text style={[styles.count, { fontSize: size * 0.4 }]}>{likeCount}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconContainerLiked: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    borderColor: '#ffffff',
  },
  icon: {
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  disabledIcon: {
    opacity: 0.5,
  },
  count: {
    marginTop: 4,
    color: '#ffffff',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
}); 