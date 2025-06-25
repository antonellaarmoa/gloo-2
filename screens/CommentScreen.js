import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const commentsData = [
  {
    id: '1',
    user: 'facupotti',
    text: '¡Qué buena pinta tiene esa receta! 😋',
    avatar: require('../assets/user.jpeg'),
    liked: false,
  },
  {
    id: '2',
    user: 'cooklover',
    text: 'La probé ayer y salió increíble 🔥',
    avatar: require('../assets/user.jpeg'),
    liked: true,
  },
  // Más comentarios opcionales
];

export default function CommentsScreen() {
  const [comments, setComments] = useState(commentsData);
  const [newComment, setNewComment] = useState('');
  const navigation = useNavigation()
  const toggleLike = (id) => {
    setComments((prevComments) =>
      prevComments.map((comment) =>
        comment.id === id ? { ...comment, liked: !comment.liked } : comment
      )
    );
  };

  const renderComment = ({ item }) => (
    <View style={styles.commentItem}>
      <Image source={item.avatar} style={styles.avatar} />
      <View style={styles.commentContent}>
        <Text style={styles.username}>@{item.user}</Text>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
      <TouchableOpacity onPress={() => toggleLike(item.id)}>
        <Ionicons
          name={item.liked ? 'heart' : 'heart-outline'}
          size={24}
          color={item.liked ? 'red' : 'gray'}
        />
      </TouchableOpacity>
    </View>
  );

  const handleSend = () => {
    if (newComment.trim()) {
      const newEntry = {
        id: Date.now().toString(),
        user: 'newuser',
        text: newComment,
        avatar: require('../assets/user.jpeg'),
        liked: false,
      };
      setComments([newEntry, ...comments]);
      setNewComment('');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>Comments</Text>
      </View>

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={renderComment}
        contentContainerStyle={styles.listContainer}
        inverted
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          placeholderTextColor="#aaa"
          value={newComment}
          onChangeText={setNewComment}
        />
        <TouchableOpacity onPress={handleSend}>
          <Ionicons name="send" size={24} color="#142E8B" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white'
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#142E8B',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  commentContent: {
    flex: 1
  },
  username: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2
  },
  commentText: {
    color: '#444'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: 'white'
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    fontSize: 14
  }
});
