import React from 'react';
import ShareProfileModal from '../components/ShareProfileModal';
import { useRouter } from 'expo-router';

export default function ShareProfile() {
  const router = useRouter();
  return (
    <ShareProfileModal
      visible={true}
      onClose={() => router.back()}
      profileUrl={'https://gloo.app/u/anto.armoa'}
    />
  );
}
