// Sistema centralizado de manejo de errores
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// Tipos de errores comunes
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  AUTH: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

// Función para manejar errores de red
export const handleNetworkError = (error) => {
  if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
    return {
      type: ERROR_TYPES.NETWORK,
      message: 'Error de conexión. Verifica tu conexión a internet.',
      retry: true,
    };
  }
  
  if (error.name === 'AbortError') {
    return {
      type: ERROR_TYPES.TIMEOUT,
      message: 'La petición tardó demasiado. Inténtalo de nuevo.',
      retry: true,
    };
  }
  
  return {
    type: ERROR_TYPES.UNKNOWN,
    message: 'Error inesperado. Inténtalo de nuevo.',
    retry: false,
  };
};

// Función para manejar errores de respuesta HTTP
export const handleHttpError = (status, data) => {
  switch (status) {
    case 400:
      return {
        type: ERROR_TYPES.VALIDATION,
        message: data?.error || 'Datos inválidos.',
        retry: false,
      };
    case 401:
      return {
        type: ERROR_TYPES.AUTH,
        message: 'Sesión expirada. Inicia sesión de nuevo.',
        retry: false,
      };
    case 403:
      return {
        type: ERROR_TYPES.AUTH,
        message: 'No tienes permisos para realizar esta acción.',
        retry: false,
      };
    case 404:
      return {
        type: ERROR_TYPES.NOT_FOUND,
        message: 'Recurso no encontrado.',
        retry: false,
      };
    case 500:
      return {
        type: ERROR_TYPES.SERVER,
        message: 'Error del servidor. Inténtalo más tarde.',
        retry: true,
      };
    default:
      return {
        type: ERROR_TYPES.UNKNOWN,
        message: 'Error inesperado. Inténtalo de nuevo.',
        retry: status >= 500,
      };
  }
};

// Función principal para manejar errores
export const handleError = (error, response = null) => {
  console.error('Error handled:', error);
  
  // Si es un error de red
  if (error instanceof TypeError || error.name === 'AbortError') {
    return handleNetworkError(error);
  }
  
  // Si es un error de respuesta HTTP
  if (response && response.status) {
    return handleHttpError(response.status, response.data);
  }
  
  // Error desconocido
  return {
    type: ERROR_TYPES.UNKNOWN,
    message: 'Error inesperado. Inténtalo de nuevo.',
    retry: false,
  };
};

// Función para mostrar errores al usuario
export const showError = (errorInfo, Alert) => {
  if (Alert && typeof Alert.alert === 'function') {
    Alert.alert('Error', errorInfo.message);
  } else {
    console.error('Error:', errorInfo.message);
  }
};

// Función para retry automático
export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      const errorInfo = handleError(error);
      
      if (!errorInfo.retry || attempt === maxRetries) {
        throw error;
      }
      
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
}; 