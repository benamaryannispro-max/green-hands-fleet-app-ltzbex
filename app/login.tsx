
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

  const handleLeaderSignIn = async () => {
    console.log('[LoginScreen] User tapped Team Leader Sign In button');
    setError('');
    
    if (!email || !password) {
      setError('Veuillez entrer votre email et mot de passe');
      return;
    }

    if (isSignUp && !name) {
      setError('Veuillez entrer votre nom');
      return;
    }

    try {
      if (isSignUp) {
        console.log('[LoginScreen] Attempting team leader sign up with:', email);
        await signUpWithEmail(email, password, name);
        console.log('[LoginScreen] Team leader sign up successful');
      } else {
        console.log('[LoginScreen] Attempting team leader sign in with:', email);
        await signInWithEmail(email, password);
        console.log('[LoginScreen] Team leader sign in successful');
      }
      
      // Wait a bit and fetch user to ensure session is established
      console.log('[LoginScreen] Waiting for session to be established...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchUser();
      
      console.log('[LoginScreen] Redirecting to home');
      router.replace('/');
    } catch (err: any) {
      console.error('[LoginScreen] Team leader auth error:', err);
      const errorMessage = err.message || 'Échec de la connexion';
      
      // Provide helpful error messages
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setError('Email ou mot de passe incorrect. Vérifiez vos identifiants.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Erreur de connexion au serveur. Vérifiez votre connexion internet.');
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleDriverSignIn = async () => {
    console.log('[LoginScreen] User tapped Driver Sign In button with phone:', phone);
    setError('');
    
    if (!phone) {
      setError('Veuillez entrer votre numéro de téléphone');
      return;
    }

    try {
      console.log('[LoginScreen] Attempting driver sign in with phone:', phone);
      const response = await apiPost('/api/auth/sign-in/phone', { phone });
      
      if (response.session?.token) {
        // Store the bearer token
        await setBearerToken(response.session.token);
        console.log('[LoginScreen] Driver sign in successful, redirecting');
        router.replace('/');
      } else {
        setError('Échec de la connexion - session invalide');
      }
    } catch (err: any) {
      console.error('[LoginScreen] Driver sign in error:', err);
      setError(err.message || 'Échec de la connexion - vérifiez que vous êtes approuvé');
    }
  };

  const leaderTabActive = activeTab === 'leader';
  const driverTabActive = activeTab === 'driver';

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

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, leaderTabActive && styles.tabActive]}
                onPress={() => setActiveTab('leader')}
              >
                <Text style={[styles.tabText, leaderTabActive && styles.tabTextActive]}>
                  Chef d&apos;équipe
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, driverTabActive && styles.tabActive]}
                onPress={() => setActiveTab('driver')}
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
                    editable={!loading}
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
                  editable={!loading}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Mot de passe"
                  placeholderTextColor={colors.grey}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!loading}
                />

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleLeaderSignIn}
                  disabled={loading}
                >
                  {loading ? (
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
                  disabled={loading}
                >
                  <Text style={styles.toggleButtonText}>
                    {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? Créer un compte'}
                  </Text>
                </TouchableOpacity>

                {!isSignUp ? (
                  <Text style={styles.testCredentials}>
                    Test: contact@thegreenhands.fr / Lagrandeteam13
                  </Text>
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
                  editable={!loading}
                />

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleDriverSignIn}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Se connecter</Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.driverNote}>
                  Note: Vous devez être approuvé par un chef d&apos;équipe
                </Text>
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
  error: {
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  testCredentials: {
    marginTop: 16,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  driverNote: {
    marginTop: 16,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
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
