import { Stack } from 'expo-router';

export default function AdminStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="recipe" options={{ title: 'Detalle de Receta' }} />
      <Stack.Screen name="success" options={{ title: '¡Receta aprobada!' }} />
      <Stack.Screen name="rejected" options={{ title: 'Receta rechazada' }} />
    </Stack>
  );
} 