
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { apiPost } from '@/utils/api';
import { setBearerToken } from '@/lib/auth';

export default function LoginScreen() {
  const { signInWithEmail, signUpWithEmail, loading, fetchUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'leader' | 'driver'>('leader');
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLeaderSignIn = async () => {
    console.log('[LoginScreen] Utilisateur a cliqué sur Connexion Chef d\'équipe');
    setError('');
    
    if (!email || !password) {
      setError('Veuillez entrer votre email et mot de passe');
      return;
    }

    if (isSignUp && !name) {
      setError('Veuillez entrer votre nom');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        console.log('[LoginScreen] Tentative d\'inscription chef d\'équipe avec:', email);
        await signUpWithEmail(email, password, name);
        console.log('[LoginScreen] Inscription chef d\'équipe réussie');
      } else {
        console.log('[LoginScreen] Tentative de connexion chef d\'équipe avec:', email);
        await signInWithEmail(email, password);
        console.log('[LoginScreen] Connexion chef d\'équipe réussie');
      }
      
      // Attendre un peu pour que la session soit établie
      console.log('[LoginScreen] Attente de l\'établissement de la session...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchUser();
      
      console.log('[LoginScreen] Redirection vers l\'accueil');
      router.replace('/');
    } catch (err: any) {
      console.error('[LoginScreen] Erreur d\'authentification chef d\'équipe:', err);
      const errorMessage = err.message || 'Échec de la connexion';
      
      // Messages d'erreur utiles en français
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('Invalid')) {
        setError('❌ Email ou mot de passe incorrect. Vérifiez vos identifiants.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
        setError('❌ Erreur de connexion au serveur. Vérifiez votre connexion internet.');
      } else if (errorMessage.includes('User not found')) {
        setError('❌ Aucun compte trouvé avec cet email. Créez un compte d\'abord.');
      } else {
        setError(`❌ ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDriverSignIn = async () => {
    console.log('[LoginScreen] Utilisateur a cliqué sur Connexion Chauffeur avec téléphone:', phone);
    setError('');
    
    if (!phone) {
      setError('Veuillez entrer votre numéro de téléphone');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[LoginScreen] Tentative de connexion chauffeur avec téléphone:', phone);
      const response = await apiPost('/api/auth/sign-in/phone', { phone });
      
      if (response.session?.token) {
        // Stocker le token bearer
        await setBearerToken(response.session.token);
        console.log('[LoginScreen] Connexion chauffeur réussie, redirection');
        router.replace('/');
      } else {
        setError('❌ Échec de la connexion - session invalide');
      }
    } catch (err: any) {
      console.error('[LoginScreen] Erreur de connexion chauffeur:', err);
      const errorMessage = err.message || '';
      
      if (errorMessage.includes('not approved') || errorMessage.includes('pending')) {
        setError('❌ Votre compte est en attente d\'approbation par un chef d\'équipe.');
      } else if (errorMessage.includes('not found')) {
        setError('❌ Aucun compte trouvé avec ce numéro. Contactez votre chef d\'équipe.');
      } else {
        setError(`❌ ${errorMessage || 'Échec de la connexion'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const leaderTabActive = activeTab === 'leader';
  const driverTabActive = activeTab === 'driver';
  const buttonDisabled = loading || isLoading;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>GREEN HANDS</Text>
              <Text style={styles.subtitle}>Gestion de flotte</Text>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, leaderTabActive && styles.tabActive]}
                onPress={() => {
                  setActiveTab('leader');
                  setError('');
                }}
              >
                <Text style={[styles.tabText, leaderTabActive && styles.tabTextActive]}>
                  Chef d&apos;équipe
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, driverTabActive && styles.tabActive]}
                onPress={() => {
                  setActiveTab('driver');
                  setError('');
                }}
              >
                <Text style={[styles.tabText, driverTabActive && styles.tabTextActive]}>
                  Chauffeur
                </Text>
              </TouchableOpacity>
            </View>

            {leaderTabActive ? (
              <View style={styles.form}>
                <Text style={styles.formTitle}>
                  {isSignUp ? 'Créer un compte Chef d\'équipe' : 'Connexion Chef d\'équipe'}
                </Text>
                
                {isSignUp ? (
                  <TextInput
                    style={styles.input}
                    placeholder="Nom complet"
                    placeholderTextColor={colors.grey}
                    value={name}
                    onChangeText={setName}
                    editable={!buttonDisabled}
                  />
                ) : null}

                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={colors.grey}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!buttonDisabled}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Mot de passe"
                  placeholderTextColor={colors.grey}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!buttonDisabled}
                />

                <TouchableOpacity
                  style={[styles.button, buttonDisabled && styles.buttonDisabled]}
                  onPress={handleLeaderSignIn}
                  disabled={buttonDisabled}
                >
                  {buttonDisabled ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {isSignUp ? 'Créer un compte' : 'Se connecter'}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  disabled={buttonDisabled}
                >
                  <Text style={styles.toggleButtonText}>
                    {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? Créer un compte'}
                  </Text>
                </TouchableOpacity>

                {!isSignUp ? (
                  <View style={styles.testCredentialsContainer}>
                    <Text style={styles.testCredentialsTitle}>🔑 Identifiants de test :</Text>
                    <Text style={styles.testCredentials}>
                      Email: contact@thegreenhands.fr
                    </Text>
                    <Text style={styles.testCredentials}>
                      Mot de passe: Lagrandeteam13
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={styles.formTitle}>Connexion Chauffeur</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Numéro de téléphone (+33...)"
                  placeholderTextColor={colors.grey}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!buttonDisabled}
                />

                <TouchableOpacity
                  style={[styles.button, buttonDisabled && styles.buttonDisabled]}
                  onPress={handleDriverSignIn}
                  disabled={buttonDisabled}
                >
                  {buttonDisabled ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Se connecter</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.driverNoteContainer}>
                  <Text style={styles.driverNote}>
                    ℹ️ Note: Vous devez être approuvé par un chef d&apos;équipe pour accéder à l&apos;application.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  form: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  error: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  testCredentialsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  testCredentialsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  testCredentials: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  driverNoteContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  driverNote: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  toggleButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});
