import { Slot } from 'expo-router';
import AuthGuard from '../../components/AuthGuard';

export default function AuthLayout() {
  return (
    <AuthGuard requireAuth={false}>
      <Slot />
    </AuthGuard>
  );
} 