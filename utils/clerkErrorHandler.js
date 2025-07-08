// Clerk Error Handler - Maneja errores específicos de Clerk
export const CLERK_ERROR_CODES = {
  SESSION_EXISTS: 'session_exists',
  INVALID_CREDENTIALS: 'form_identifier_not_found',
  INVALID_PASSWORD: 'form_password_incorrect',
  EMAIL_ALREADY_EXISTS: 'form_email_address_exists',
  INVALID_EMAIL: 'form_email_address_invalid',
  WEAK_PASSWORD: 'form_password_pwned',
  RATE_LIMITED: 'rate_limited',
  NETWORK_ERROR: 'network_error',
};

// Función para manejar errores específicos de Clerk
export const handleClerkError = (error) => {
  console.log('Clerk Error:', JSON.stringify(error, null, 2));
  
  // Si no hay errores en el objeto, retornar error genérico
  if (!error || !error.errors || !Array.isArray(error.errors)) {
    return {
      title: 'Error',
      message: 'Ha ocurrido un error inesperado. Inténtalo de nuevo.',
      shouldRedirect: false,
      shouldRetry: true,
    };
  }

  const firstError = error.errors[0];
  const errorCode = firstError?.code;
  const errorMessage = firstError?.message;

  switch (errorCode) {
    case CLERK_ERROR_CODES.SESSION_EXISTS:
      return {
        title: 'Sesión Activa',
        message: 'Ya tienes una sesión activa. Redirigiendo...',
        shouldRedirect: true,
        shouldRetry: false,
        redirectTo: '/(tabs)/home',
      };

    case CLERK_ERROR_CODES.INVALID_CREDENTIALS:
      return {
        title: 'Credenciales Inválidas',
        message: 'El email o contraseña son incorrectos.',
        shouldRedirect: false,
        shouldRetry: true,
      };

    case CLERK_ERROR_CODES.INVALID_PASSWORD:
      return {
        title: 'Contraseña Incorrecta',
        message: 'La contraseña ingresada es incorrecta.',
        shouldRedirect: false,
        shouldRetry: true,
      };

    case CLERK_ERROR_CODES.EMAIL_ALREADY_EXISTS:
      return {
        title: 'Email Ya Registrado',
        message: 'Este email ya está registrado. Intenta iniciar sesión.',
        shouldRedirect: false,
        shouldRetry: false,
      };

    case CLERK_ERROR_CODES.INVALID_EMAIL:
      return {
        title: 'Email Inválido',
        message: 'Por favor ingresa un email válido.',
        shouldRedirect: false,
        shouldRetry: true,
      };

    case CLERK_ERROR_CODES.WEAK_PASSWORD:
      return {
        title: 'Contraseña Débil',
        message: 'La contraseña es demasiado débil. Usa una contraseña más segura.',
        shouldRedirect: false,
        shouldRetry: true,
      };

    case CLERK_ERROR_CODES.RATE_LIMITED:
      return {
        title: 'Demasiados Intentos',
        message: 'Has intentado demasiadas veces. Espera un momento antes de intentar de nuevo.',
        shouldRedirect: false,
        shouldRetry: false,
      };

    default:
      return {
        title: 'Error',
        message: errorMessage || 'Ha ocurrido un error inesperado. Inténtalo de nuevo.',
        shouldRedirect: false,
        shouldRetry: true,
      };
  }
};

// Función para verificar si el usuario ya está autenticado
export const checkExistingSession = async (isSignedIn, router) => {
  if (isSignedIn) {
    console.log('Usuario ya autenticado, redirigiendo a home...');
    router.replace('/(tabs)/home');
    return true;
  }
  return false;
};

// Función para manejar el inicio de sesión con manejo de errores mejorado
export const handleSignIn = async (signIn, setActive, credentials, router) => {
  try {
    console.log('Iniciando login...');
    const completeSignIn = await signIn.create({
      identifier: credentials.emailAddress,
      password: credentials.password,
    });

    console.log('Login exitoso, activando sesión...');
    await setActive({ session: completeSignIn.createdSessionId });
    
    console.log('Sesión activada, redirigiendo...');
    setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 500);
    
    return { success: true };
  } catch (error) {
    console.log('Error en login:', error);
    const errorInfo = handleClerkError(error);
    
    if (errorInfo.shouldRedirect && errorInfo.redirectTo) {
      setTimeout(() => {
        router.replace(errorInfo.redirectTo);
      }, 500);
      return { success: true, redirected: true };
    }
    
    return { 
      success: false, 
      error: errorInfo,
      shouldRetry: errorInfo.shouldRetry 
    };
  }
};

// Función para manejar el registro con manejo de errores mejorado
export const handleSignUp = async (signUp, setActive, userData, router) => {
  try {
    console.log('Iniciando registro...');
    const completeSignUp = await signUp.create({
      firstName: userData.firstName,
      lastName: userData.lastName,
      emailAddress: userData.emailAddress,
      password: userData.password,
    });

    console.log('Registro exitoso, activando sesión...');
    await setActive({ session: completeSignUp.createdSessionId });
    
    console.log('Sesión activada, redirigiendo...');
    setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 500);
    
    return { success: true };
  } catch (error) {
    console.log('Error en registro:', error);
    const errorInfo = handleClerkError(error);
    
    if (errorInfo.shouldRedirect && errorInfo.redirectTo) {
      setTimeout(() => {
        router.replace(errorInfo.redirectTo);
      }, 500);
      return { success: true, redirected: true };
    }
    
    return { 
      success: false, 
      error: errorInfo,
      shouldRetry: errorInfo.shouldRetry 
    };
  }
};

// Función para manejar OAuth con manejo de errores mejorado
export const handleOAuth = async (startOAuthFlow, setActive, router) => {
  try {
    console.log('Iniciando OAuth...');
    const { createdSessionId } = await startOAuthFlow();

    if (createdSessionId) {
      console.log('OAuth exitoso, activando sesión...');
      await setActive({ session: createdSessionId });
      
      console.log('Sesión activada, redirigiendo...');
      setTimeout(() => {
        router.replace('/(tabs)/home');
      }, 500);
      
      return { success: true };
    }
    
    return { success: false, error: { message: 'No se pudo completar la autenticación con Google.' } };
  } catch (error) {
    console.error('OAuth error:', error);
    return { 
      success: false, 
      error: { 
        title: 'Error de Autenticación',
        message: 'No se pudo completar la autenticación con Google. Inténtalo de nuevo.',
        shouldRetry: true 
      }
    };
  }
}; 