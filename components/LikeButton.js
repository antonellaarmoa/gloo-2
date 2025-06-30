import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LikeButton({
  initialCount = 0,
  size = 28,
  style = {},
  showCount = true,
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialCount);

  const handleToggleLike = () => {
    if (!liked) {
      setLiked(true);
      setLikeCount((c) => c + 1);
    } else {
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleToggleLike}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, liked && styles.iconContainerLiked]}>
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={size}
          color="white"
          style={styles.icon}
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
  count: {
    marginTop: 4,
    color: '#ffffff',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
}); 