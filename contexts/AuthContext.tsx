
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiPost, authenticatedGet } from '@/utils/api';
import { setBearerToken, clearAuthTokens, getBearerToken } from '@/lib/auth';

interface User {
  id: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: 'driver' | 'team_leader' | 'admin';
  isApproved?: boolean;
  isActive?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginLeader: (email: string, password: string) => Promise<void>;
  loginDriver: (phone: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier la session au démarrage
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setLoading(true);
      console.log('[AuthContext] Vérification de la session...');
      
      const token = await getBearerToken();
      if (!token) {
        console.log('[AuthContext] Aucun token trouvé');
        setUser(null);
        return;
      }

      console.log('[AuthContext] Token trouvé, récupération de l\'utilisateur...');
      const response = await authenticatedGet<{ user: User }>('/api/auth/session');
      
      if (response.user) {
        console.log('[AuthContext] Utilisateur récupéré:', response.user);
        setUser(response.user);
      } else {
        console.log('[AuthContext] Aucun utilisateur dans la réponse');
        setUser(null);
        await clearAuthTokens();
      }
    } catch (error) {
      console.error('[AuthContext] Erreur lors de la vérification de la session:', error);
      setUser(null);
      await clearAuthTokens();
    } finally {
      setLoading(false);
    }
  };

  const loginLeader = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Connexion chef d\'équipe avec:', email);
      
      const response = await apiPost<{ success: boolean; sessionToken: string; user: User }>(
        '/api/auth/sign-in/email',
        { email, password }
      );

      if (!response.sessionToken || !response.success) {
        throw new Error('Échec de la connexion');
      }

      console.log('[AuthContext] Connexion réussie, stockage du token');
      await setBearerToken(response.sessionToken);
      setUser(response.user);
      console.log('[AuthContext] Utilisateur connecté:', response.user);
    } catch (error: any) {
      console.error('[AuthContext] Erreur de connexion chef d\'équipe:', error);
      throw error;
    }
  };

  const loginDriver = async (phone: string) => {
    try {
      console.log('[AuthContext] Connexion chauffeur avec:', phone);
      
      const response = await apiPost<{ success: boolean; sessionToken: string; user: User }>(
        '/api/auth/sign-in/phone',
        { phone }
      );

      if (!response.sessionToken || !response.success) {
        throw new Error('Échec de la connexion');
      }

      console.log('[AuthContext] Connexion réussie, stockage du token');
      await setBearerToken(response.sessionToken);
      setUser(response.user);
      console.log('[AuthContext] Utilisateur connecté:', response.user);
    } catch (error: any) {
      console.error('[AuthContext] Erreur de connexion chauffeur:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('[AuthContext] Déconnexion...');
      
      // Appeler l'endpoint de déconnexion (optionnel, pour invalider le token côté serveur)
      try {
        await apiPost('/api/auth/sign-out', {});
      } catch (error) {
        console.warn('[AuthContext] Erreur lors de l\'appel API de déconnexion (ignorée):', error);
      }
    } catch (error) {
      console.error('[AuthContext] Erreur lors de la déconnexion:', error);
    } finally {
      // Toujours effacer l'état local
      console.log('[AuthContext] Effacement de l\'état local');
      setUser(null);
      await clearAuthTokens();
    }
  };

  const refreshUser = async () => {
    await checkSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginLeader,
        loginDriver,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}
