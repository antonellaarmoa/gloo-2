# 🍳 Gloo - App de Recetas

Una aplicación móvil completa para compartir y descubrir recetas deliciosas, construida con React Native y Expo.

## 🚀 Características Implementadas

### ✅ **Sistema de Autenticación**
- **Clerk Integration**: Autenticación segura con email/password
- **Gestión de sesiones**: Persistencia de login
- **Modo invitado**: Funcionalidad limitada para usuarios no registrados
- **Protección de rutas**: Navegación condicional basada en autenticación

### ✅ **Sistema de Likes**
- **Likes persistentes**: Guardado local con AsyncStorage
- **Sincronización backend**: Integración con API REST
- **UI reactiva**: Actualización inmediata de contadores
- **Offline-first**: Funciona sin conexión
- **Fallback inteligente**: Mantiene estado local si falla el backend

### ✅ **Sistema de Guardar Recetas**
- **Recetas favoritas**: Guardar/desguardar recetas
- **Persistencia local**: Almacenamiento en AsyncStorage
- **Sincronización automática**: Con backend cuando está disponible
- **Acceso rápido**: Lista de recetas guardadas en perfil

### ✅ **Sistema de Seguir Usuarios**
- **Follow/Unfollow**: Seguir a otros chefs
- **Estado persistente**: Guardado localmente
- **Feed personalizado**: Recetas de usuarios seguidos
- **Contadores dinámicos**: Seguidores y siguiendo

### ✅ **Sistema de Comentarios**
- **Comentarios persistentes**: Guardados localmente
- **Sincronización backend**: Con API de comentarios
- **UI interactiva**: Crear, editar, eliminar comentarios
- **Fallback offline**: Comentarios de ejemplo cuando no hay conexión
- **Botón de sincronización**: Sincronizar manualmente con backend

### ✅ **Sistema de Notificaciones**
- **Notificaciones push**: Alertas de actividad
- **Persistencia local**: Guardado en AsyncStorage
- **Estados de lectura**: Marcar como leído/no leído
- **Acciones rápidas**: Seguir usuarios desde notificaciones
- **Fallback inteligente**: Notificaciones de ejemplo offline

### ✅ **Sistema de Búsqueda**
- **Búsqueda en tiempo real**: Por título, descripción, ingredientes
- **Historial de búsquedas**: Últimas 10 búsquedas
- **Categorías populares**: Búsqueda por categorías
- **Búsqueda local**: Funciona sin conexión
- **Resultados relevantes**: Ordenados por relevancia

### ✅ **Sistema de Perfil Avanzado**
- **Estadísticas detalladas**: Recetas, seguidores, likes, vistas
- **Recetas del usuario**: Lista de recetas creadas
- **Actividad reciente**: Historial de interacciones
- **Sistema de logros**: Badges por metas alcanzadas
- **Datos persistentes**: Guardado local con sincronización

### ✅ **Sistema de Trending Recipes**
- **Recetas populares**: Ordenadas por likes y vistas
- **Tab "Following"**: Muestra recetas trending
- **Fallback local**: Ordenamiento por likes si no hay backend
- **Carga dinámica**: Solo cuando se selecciona el tab

### ✅ **Sistema de Configuración**
- **Preferencias de usuario**: Notificaciones, sonidos, vibración
- **Modo oscuro**: Tema personalizable
- **Sincronización de datos**: Control de sincronización automática
- **Limpieza de datos**: Eliminar datos locales
- **Gestión de cuenta**: Cerrar sesión, términos, privacidad

## 🛠 **Arquitectura Técnica**

### **Frontend**
- **React Native + Expo**: Framework principal
- **Expo Router**: Navegación declarativa
- **AsyncStorage**: Persistencia local
- **React Query**: Gestión de estado del servidor
- **Clerk**: Autenticación y gestión de usuarios

### **Backend Integration**
- **API REST**: Endpoints para todas las funcionalidades
- **HTTPS**: Comunicación segura
- **Error Handling**: Manejo robusto de errores
- **Offline-first**: Funciona sin conexión
- **Sincronización**: Bidireccional cuando hay conexión

### **Almacenamiento Local**
- **AsyncStorage**: Persistencia de datos
- **Estructura organizada**: Claves con prefijos `@gloo:`
- **Fallbacks**: Datos de ejemplo para modo offline
- **Limpieza**: Función para eliminar datos locales

## 📱 **Pantallas Implementadas**

### **Autenticación**
- `/(auth)/sign-in.js` - Inicio de sesión
- `/(auth)/sign-up.js` - Registro de usuario

### **Tabs Principales**
- `/(tabs)/home.js` - Feed principal con likes, guardar, seguir
- `/(tabs)/search.js` - Búsqueda avanzada
- `/(tabs)/create-recipe.js` - Crear nuevas recetas
- `/(tabs)/notification.js` - Sistema de notificaciones
- `/(tabs)/profile.js` - Perfil con estadísticas y logros

### **Pantallas Secundarias**
- `/(tabs)/recipe.js` - Vista detallada de receta con comentarios
- `/(tabs)/settings.js` - Configuración de la app
- `comment.js` - Sistema de comentarios
- `onboarding.js` - Tutorial inicial

## 🔧 **Configuración del Proyecto**

### **Instalación**
```bash
cd gloo-final
npm install
```

### **Dependencias Principales**
```json
{
  "@clerk/clerk-expo": "^0.20.10",
  "@react-native-async-storage/async-storage": "^1.21.0",
  "@tanstack/react-query": "^5.17.9",
  "expo": "~50.0.0",
  "expo-router": "~3.4.0",
  "react-native-safe-area-context": "4.8.2"
}
```

### **Variables de Entorno**
```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=tu_clave_clerk
```

## 🚀 **Ejecutar la App**

```bash
npx expo start
```

Luego escanea el QR con Expo Go o presiona:
- `a` para Android
- `w` para Web
- `i` para iOS

## 📊 **Sistemas de Datos**

### **Estructura de Almacenamiento Local**
```
@gloo:userLikes - Likes del usuario
@gloo:savedRecipes - Recetas guardadas
@gloo:followedUsers - Usuarios seguidos
@gloo:notifications - Notificaciones
@gloo:searchHistory - Historial de búsqueda
@gloo:userStats_[userId] - Estadísticas del usuario
@gloo:userRecipes_[userId] - Recetas del usuario
@gloo:userActivity_[userId] - Actividad del usuario
@gloo:userAchievements_[userId] - Logros del usuario
@gloo:appSettings - Configuración de la app
@gloo:allRecipes - Cache de todas las recetas
```

### **Endpoints de API**
```
GET    /api/v1/recipes - Obtener recetas
POST   /api/v1/recipes - Crear receta
GET    /api/v1/recipes/trending - Recetas trending
POST   /api/v1/recipes/{id}/like - Dar like
DELETE /api/v1/recipes/{id}/like - Quitar like
POST   /api/v1/recipes/{id}/save - Guardar receta
DELETE /api/v1/recipes/{id}/save - Desguardar receta
GET    /api/v1/recipes/{id}/comments - Obtener comentarios
POST   /api/v1/recipes/{id}/comments - Crear comentario
GET    /api/v1/users/{id}/stats - Estadísticas del usuario
GET    /api/v1/users/{id}/recipes - Recetas del usuario
POST   /api/v1/users/{id}/follow - Seguir usuario
DELETE /api/v1/users/{id}/follow - Dejar de seguir
GET    /api/v1/notifications/{userId} - Notificaciones
PUT    /api/v1/notifications/{id}/read - Marcar como leído
```

## 🎯 **Características Destacadas**

### **Offline-First**
- ✅ Funciona completamente sin conexión
- ✅ Datos persistentes localmente
- ✅ Sincronización automática cuando hay conexión
- ✅ Fallbacks inteligentes para datos de ejemplo

### **UX/UI**
- ✅ Diseño moderno y atractivo
- ✅ Navegación fluida
- ✅ Feedback visual inmediato
- ✅ Estados de carga y error
- ✅ Modo invitado con limitaciones claras

### **Performance**
- ✅ Carga lazy de datos
- ✅ Cache inteligente
- ✅ Optimización de imágenes
- ✅ Gestión eficiente de memoria

### **Seguridad**
- ✅ Autenticación segura con Clerk
- ✅ Validación de datos
- ✅ Sanitización de inputs
- ✅ HTTPS en todas las comunicaciones

## 🔮 **Próximas Mejoras**

- [ ] **Sistema de Ratings**: Calificación de recetas
- [ ] **Filtros Avanzados**: Por tiempo, dificultad, ingredientes
- [ ] **Listas de Compras**: Generar listas de ingredientes
- [ ] **Modo Cocina**: Timer y pasos interactivos
- [ ] **Compartir Recetas**: Integración con redes sociales
- [ ] **Recomendaciones**: IA para sugerir recetas
- [ ] **Video Tutorials**: Videos en las recetas
- [ ] **Planificación de Menús**: Calendario de comidas

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 **Contribución**

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request para sugerencias y mejoras.

---

**Gloo** - Donde la pasión por la cocina se encuentra con la tecnología moderna 🍳✨
