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
    FAVORITES: '/favorites',
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
    BY_RECIPE: (recipeId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.LIKES}/recipe/${recipeId}`),
  },
  // RATES: {
  //   // NOTA: Los endpoints de rates no están implementados en el backend aún
  //   RATE: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.RATES}/${userId}/rate`),
  //   UPDATE: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.RATES}/${userId}/rate`),
  //   DELETE: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.RATES}/${userId}/rate`),
  //   BY_RECIPE: (recipeId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.RATES}/recipe/${recipeId}`),
  //   STATUS: (userId, recipeId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.RATES}/${userId}/status/${recipeId}`),
  // },
  COMMENTS: {
    CREATE: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COMMENTS}/${userId}`),
    GET_ALL: (recipeId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COMMENTS}/recipe/${recipeId}`),
    BY_RECIPE: (recipeId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COMMENTS}/recipe/${recipeId}`),
    DELETE: (userId, commentId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COMMENTS}/${userId}/${commentId}`),
  },
  NOTIFICATIONS: {
    GET_ALL: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/${userId}`),
    MARK_AS_READ: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/${userId}/read`),
    MARK_ALL_AS_READ: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/${userId}/read-all`),
    DELETE: (userId, notificationId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/${userId}/${notificationId}`),
    UNREAD_COUNT: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/${userId}/unread-count`),
  },
  FOLLOWS: {
    FOLLOW: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.FOLLOWS}/${userId}/follow`),
    UNFOLLOW: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.FOLLOWS}/${userId}/unfollow`),
    STATUS: (userId, targetUserId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.FOLLOWS}/${userId}/status?targetUserId=${targetUserId}`),
    FOLLOWERS: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.FOLLOWS}/${userId}/followers`),
    FOLLOWING: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.FOLLOWS}/${userId}/following`),
    STATS: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.FOLLOWS}/${userId}/stats`),
  },
  SEARCH: {
    RECIPES: (query) => buildApiUrl(`${API_CONFIG.ENDPOINTS.SEARCH}?query=${query}`),
    USERS: (query) => buildApiUrl(`${API_CONFIG.ENDPOINTS.SEARCH}/users?query=${query}`),
    SUGGESTIONS: () => buildApiUrl(`${API_CONFIG.ENDPOINTS.SEARCH}/suggestions`),
    CATEGORIES: () => buildApiUrl(`${API_CONFIG.ENDPOINTS.SEARCH}/categories`),
    ALL: (query) => buildApiUrl(`${API_CONFIG.ENDPOINTS.SEARCH}/all?query=${query}`),
    HISTORY: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.SEARCH}/history/${userId}`),
    ADD_TO_HISTORY: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.SEARCH}/history/${userId}`),
    CLEAR_HISTORY: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.SEARCH}/history/${userId}`),
  },
  COLLECTIONS: {
    GET_ALL: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COLLECTIONS}/${userId}`),
    BY_USER: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COLLECTIONS}/${userId}`),
    CREATE: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COLLECTIONS}/${userId}`),
    GET_BY_ID: (userId, collectionId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COLLECTIONS}/${userId}/${collectionId}`),
    UPDATE: (userId, collectionId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COLLECTIONS}/${userId}/${collectionId}`),
    DELETE: (userId, collectionId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COLLECTIONS}/${userId}/${collectionId}`),
    DEFAULTS: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COLLECTIONS}/${userId}/defaults`),
    ADD_TO_DEFAULT: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COLLECTIONS}/${userId}/default/recipes`),
    REMOVE_FROM_DEFAULT: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COLLECTIONS}/${userId}/default/recipes`),
    ADD_TO_CHANGED: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COLLECTIONS}/${userId}/changed/recipes`),
    GET_CHANGED: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.COLLECTIONS}/${userId}/changed/recipes`),
  },
  FAVORITES: {
    ADD: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.FAVORITES}/${userId}`),
    REMOVE: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.FAVORITES}/${userId}`),
    GET_ALL: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.FAVORITES}/${userId}`),
    CHECK: (userId, recipeId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.FAVORITES}/${userId}/check/${recipeId}`),
    STATS: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.FAVORITES}/${userId}/stats`),
    CREATE_COLLECTION: (userId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.FAVORITES}/${userId}/collections`),
  },
  INGREDIENTS: {
    CREATE: (recipeId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.INGREDIENTS}/${recipeId}`),
    UPDATE: (id) => buildApiUrl(`${API_CONFIG.ENDPOINTS.INGREDIENTS}/${id}`),
    DELETE: (id) => buildApiUrl(`${API_CONFIG.ENDPOINTS.INGREDIENTS}/${id}`),
  },
  INSTRUCTIONS: {
    CREATE: (recipeId) => buildApiUrl(`${API_CONFIG.ENDPOINTS.INSTRUCTIONS}/${recipeId}`),
    UPDATE: (id) => buildApiUrl(`${API_CONFIG.ENDPOINTS.INSTRUCTIONS}/${id}`),
    DELETE: (id) => buildApiUrl(`${API_CONFIG.ENDPOINTS.INSTRUCTIONS}/${id}`),
  },
};