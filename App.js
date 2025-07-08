import { ClerkProvider } from '@clerk/clerk-expo';
import { Slot } from 'expo-router';

export default function App() {
  return (
    <ClerkProvider publishableKey="pk_test_Y29taWMtbGVtbWluZy0xMi5jbGVyay5hY2NvdW50cy5kZXYk">
      <Slot />
    </ClerkProvider>
  );
} 