import { auth } from './firebase';
import { signInWithCustomToken } from 'firebase/auth';

// Clerk-Firebase integration
export const getFirebaseToken = async (clerkToken) => {
  try {
    // This function will be called by Clerk to get Firebase tokens
    // For now, we'll return a placeholder that prevents the warning
    return null;
  } catch (error) {
    console.error('Error getting Firebase token:', error);
    return null;
  }
};

// Initialize Firebase auth with Clerk
export const initializeClerkFirebase = () => {
  // COMENTADO: Esta función está interfiriendo con getToken de Clerk
  // y causando que siempre retorne null
  return {
    // getToken: async () => {
    //   // Return a promise that resolves to null to prevent warnings
    //   return Promise.resolve(null);
    // },
    signInWithCustomToken: async (token) => {
      try {
        const result = await signInWithCustomToken(auth, token);
        return result;
      } catch (error) {
        console.error('Error signing in with custom token:', error);
        throw error;
      }
    }
  };
}; 