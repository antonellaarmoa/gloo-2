// Configuración centralizada de la API
export const API_CONFIG = {
  BASE_URL: 'https://gloo-api-production.up.railway.app/api/v1',
  ENDPOINTS: {
    RECIPES: '/recipes',
    USERS: '/users',
    LIKES: '/likes',
    RATES: '/rates',
    COMMENTS: '/comments',
    NOTIFICATIONS: '/notifications',
    FOLLOWS: '/follows',
    SEARCH: '/search',
    COLLECTIONS: '/collections',
    INGREDIENTS: '/ingredients',
    INSTRUCTIONS: '/instructions',
  },
  TIMEOUT: 10000, // 10 segundos
  RETRY_ATTEMPTS: 3,
};

// Función helper para construir URLs de API
export const buildApiUrl = (endpoint, params = {}) => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  // Agregar parámetros de query si existen
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value);
    }
  });
  
  if (queryParams.toString()) {
    url += `?${queryParams.toString()}`;
  }
  
  return url;
};

// Función helper para hacer peticiones a la API con manejo de errores
export const apiRequest = async (url, options = {}) => {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    // signal: AbortSignal.timeout(API_CONFIG.TIMEOUT), // QUITADO para compatibilidad RN
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data,
      response,
    };
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    return {
      success: false,
      error,
      status: 0,
    };
  }
};

// URLs específicas para endpoints comunes
export const API_URLS = {
  RECIPES: {
    ALL: buildApiUrl(API_CONFIG.ENDPOINTS.RECIPES),
    TRENDING: buildApiUrl(`${API_CONFIG.ENDPOINTS.RECIPES}/trending`),
    FOLLOWING: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.RECIPES}/following/${userId}`),
    BY_USER: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.RECIPES}/user/${userId}`),
    BY_ID: (id) => buildApiUrl(`${API_CONFIG.ENDPOINTS.RECIPES}/${id}`),
    CREATE: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.RECIPES}/${userId}`),
    UPDATE: (id) => buildApiUrl(`${API_CONFIG.ENDPOINTS.RECIPES}/${id}`),
    DELETE: (id) => buildApiUrl(`${API_CONFIG.ENDPOINTS.RECIPES}/${id}`),
  },
  USERS: {
    BY_ID: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.USERS}/${userId}`),
    STATS: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.USERS}/${userId}/stats`),
    UPDATE: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.USERS}/${userId}`),
  },
  LIKES: {
    LIKE: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.LIKES}/${userId}/like`),
    UNLIKE: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.LIKES}/${userId}/unlike`),
    STATUS: (userId, recipeId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.LIKES}/${userId}/status/${recipeId}`),
  },
  RATES: {
    RATE: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.RATES}/${userId}/rate`),
    UPDATE: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.RATES}/${userId}/rate`),
    DELETE: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.RATES}/${userId}/rate`),
    BY_RECIPE: (recipeId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.RATES}/recipe/${recipeId}`),
    STATUS: (userId, recipeId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.RATES}/${userId}/status/${recipeId}`),
  },
  COMMENTS: {
    BY_RECIPE: (recipeId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COMMENTS}/recipe/${recipeId}`),
    CREATE: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COMMENTS}/${userId}`),
    UPDATE: (userId, commentId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COMMENTS}/${userId}/${commentId}`),
    DELETE: (userId, commentId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COMMENTS}/${userId}/${commentId}`),
  },
  NOTIFICATIONS: {
    BY_USER: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/${userId}`),
    MARK_READ: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/${userId}/read`),
  },
  FOLLOWS: {
    FOLLOW: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.FOLLOWS}/${userId}/follow`),
    UNFOLLOW: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.FOLLOWS}/${userId}/unfollow`),
    FOLLOWERS: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.FOLLOWS}/${userId}/followers`),
    FOLLOWING: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.FOLLOWS}/${userId}/following`),
    STATS: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.FOLLOWS}/${userId}/stats`),
  },
  SEARCH: {
    RECIPES: (query) => buildApiUrl(`${API_CONFIG.ENDPOINTS.SEARCH}/recipes`, { q: query }),
    SUGGESTIONS: buildApiUrl(`${API_CONFIG.ENDPOINTS.SEARCH}/suggestions`),
    CATEGORIES: buildApiUrl(`${API_CONFIG.ENDPOINTS.SEARCH}/categories`),
  },
  COLLECTIONS: {
    BY_USER: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COLLECTIONS}/${userId}`),
    BY_ID: (userId, collectionId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COLLECTIONS}/${userId}/${collectionId}`),
    CREATE: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COLLECTIONS}/${userId}`),
    UPDATE: (userId, collectionId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COLLECTIONS}/${userId}/${collectionId}`),
    DELETE: (userId, collectionId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COLLECTIONS}/${userId}/${collectionId}`),
    ADD_RECIPE: (userId, collectionId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COLLECTIONS}/${userId}/${collectionId}/recipes`),
    REMOVE_RECIPE: (userId, collectionId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COLLECTIONS}/${userId}/${collectionId}/recipes`),
    // Colección por defecto (Favoritos)
    ADD_TO_FAVORITES: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COLLECTIONS}/${userId}/default/recipes`),
    REMOVE_FROM_FAVORITES: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COLLECTIONS}/${userId}/default/recipes`),
    // Crear colecciones por defecto
    CREATE_DEFAULT: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COLLECTIONS}/${userId}/default`),
  },
}; 