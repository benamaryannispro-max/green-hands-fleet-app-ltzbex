
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';

/**
 * Stocke le token Bearer de manière sécurisée
 */
export async function setBearerToken(token: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
    console.log('[Auth] Token Bearer stocké avec succès');
  } catch (error) {
    console.error('[Auth] Erreur lors du stockage du token:', error);
  }
}

/**
 * Récupère le token Bearer stocké
 */
export async function getBearerToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEY);
    } else {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error('[Auth] Erreur lors de la récupération du token:', error);
    return null;
  }
}

/**
 * Supprime le token Bearer stocké
 */
export async function clearAuthTokens(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
    console.log('[Auth] Tokens d\'authentification effacés');
  } catch (error) {
    console.error('[Auth] Erreur lors de l\'effacement des tokens:', error);
  }
}
