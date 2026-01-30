
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { authClient, setBearerToken, clearAuthTokens, getBearerToken } from "@/lib/auth";

interface User {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  image?: string;
  role?: 'driver' | 'team_leader' | 'admin';
  isApproved?: boolean;
  isActive?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function openOAuthPopup(provider: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const popupUrl = `${window.location.origin}/auth-popup?provider=${provider}`;
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      popupUrl,
      "oauth-popup",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    if (!popup) {
      reject(new Error("Échec de l'ouverture de la fenêtre popup. Veuillez autoriser les popups."));
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "oauth-success" && event.data?.token) {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        resolve(event.data.token);
      } else if (event.data?.type === "oauth-error") {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        reject(new Error(event.data.error || "Échec de l'authentification OAuth"));
      }
    };

    window.addEventListener("message", handleMessage);

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
        reject(new Error("Authentification annulée"));
      }
    }, 500);
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();

    // Écouter les liens profonds (par exemple, depuis les redirections d'authentification sociale)
    const subscription = Linking.addEventListener("url", (event) => {
      console.log("[AuthContext] Lien profond reçu, actualisation de la session utilisateur");
      // Laisser le temps au client de traiter le token si nécessaire
      setTimeout(() => fetchUser(), 500);
    });

    // POLLING: Actualiser la session toutes les 5 minutes pour maintenir le token SecureStore synchronisé
    // Cela évite les erreurs 401 lorsque le token de session tourne
    const intervalId = setInterval(() => {
      console.log("[AuthContext] Auto-actualisation de la session utilisateur pour synchroniser le token...");
      fetchUser();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      console.log('[AuthContext] Récupération de la session utilisateur...');
      const session = await authClient.getSession();
      console.log('[AuthContext] Réponse de session:', JSON.stringify(session, null, 2));
      
      if (session?.data?.user) {
        console.log('[AuthContext] Utilisateur trouvé:', session.data.user);
        setUser(session.data.user as User);
        // Synchroniser le token avec SecureStore pour utils/api.ts
        if (session.data.session?.token) {
          console.log('[AuthContext] Stockage du token bearer');
          await setBearerToken(session.data.session.token);
        }
      } else {
        console.log('[AuthContext] Aucun utilisateur dans la session');
        setUser(null);
        await clearAuthTokens();
      }
    } catch (error) {
      console.error("[AuthContext] Échec de la récupération de l'utilisateur:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Connexion avec email:', email);
      const result = await authClient.signIn.email({ 
        email, 
        password,
        fetchOptions: {
          onSuccess: async (ctx) => {
            console.log('[AuthContext] Callback de succès de connexion:', ctx);
          },
          onError: (ctx) => {
            console.error('[AuthContext] Callback d\'erreur de connexion:', ctx);
          }
        }
      });
      console.log('[AuthContext] Résultat de connexion:', JSON.stringify(result, null, 2));
      
      // Vérifier si la connexion a réussi
      if (result?.error) {
        console.error('[AuthContext] Erreur de connexion:', result.error);
        throw new Error(result.error.message || 'Échec de la connexion');
      }
      
      // Attendre un peu pour que la session soit établie
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchUser();
    } catch (error: any) {
      console.error("[AuthContext] Échec de la connexion par email:", error);
      // Améliorer le message d'erreur
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        throw new Error('Email ou mot de passe incorrect');
      } else if (error.message?.includes('User not found')) {
        throw new Error('Aucun compte trouvé avec cet email');
      } else {
        throw error;
      }
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    try {
      console.log('[AuthContext] Inscription avec email:', email);
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      });
      console.log('[AuthContext] Résultat d\'inscription:', JSON.stringify(result, null, 2));
      
      // Vérifier si l'inscription a réussi
      if (result?.error) {
        console.error('[AuthContext] Erreur d\'inscription:', result.error);
        throw new Error(result.error.message || 'Échec de l\'inscription');
      }
      
      // Attendre un peu pour que la session soit établie
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchUser();
    } catch (error: any) {
      console.error("[AuthContext] Échec de l'inscription par email:", error);
      // Améliorer le message d'erreur
      if (error.message?.includes('already exists')) {
        throw new Error('Un compte existe déjà avec cet email');
      } else {
        throw error;
      }
    }
  };

  const signInWithSocial = async (provider: "google" | "apple" | "github") => {
    try {
      if (Platform.OS === "web") {
        const token = await openOAuthPopup(provider);
        await setBearerToken(token);
        await fetchUser();
      } else {
        // Natif: Utiliser expo-linking pour générer un lien profond approprié
        const callbackURL = Linking.createURL("/");
        await authClient.signIn.social({
          provider,
          callbackURL,
        });
        // Note: La redirection rechargera l'application ou sera gérée par les liens profonds.
        // fetchUser sera appelé au montage ou via l'écouteur d'événements si nécessaire.
        // Pour un flux simple, nous pourrions avoir besoin d'écouter les événements URL.
        // Mais le client expo better-auth gère la redirection et le stockage de session ?
        // Nous devons généralement attendre ou nous fier à fetchUser au prochain chargement de l'application.
        // Pour l'instant, appeler fetchUser au cas où.
        await fetchUser();
      }
    } catch (error) {
      console.error(`[AuthContext] Échec de la connexion ${provider}:`, error);
      throw error;
    }
  };

  const signInWithGoogle = () => signInWithSocial("google");
  const signInWithApple = () => signInWithSocial("apple");
  const signInWithGitHub = () => signInWithSocial("github");

  const signOut = async () => {
    try {
      console.log('[AuthContext] Déconnexion...');
      await authClient.signOut();
    } catch (error) {
      console.error("[AuthContext] Échec de la déconnexion (API):", error);
    } finally {
       // Toujours effacer l'état local
       console.log('[AuthContext] Effacement de l\'état d\'authentification local');
       setUser(null);
       await clearAuthTokens();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithApple,
        signInWithGitHub,
        signOut,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
}
