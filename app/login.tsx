
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

export default function LoginScreen() {
  const { loginLeader, loginDriver } = useAuth();
  const [activeTab, setActiveTab] = useState<'leader' | 'driver'>('leader');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLeaderLogin = async () => {
    console.log('[LoginScreen] Tentative de connexion chef d\'équipe');
    setError('');
    
    if (!email || !password) {
      setError('Veuillez entrer votre email et mot de passe');
      return;
    }

    setIsLoading(true);

    try {
      await loginLeader(email, password);
      console.log('[LoginScreen] Connexion réussie, redirection');
      router.replace('/');
    } catch (err: any) {
      console.error('[LoginScreen] Erreur de connexion:', err);
      const errorMessage = err.message || 'Échec de la connexion';
      
      if (errorMessage.includes('401') || errorMessage.includes('incorrect') || errorMessage.includes('Invalid')) {
        setError('❌ Email ou mot de passe incorrect.\n\n💡 Utilisez les identifiants de test ci-dessous.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('❌ Erreur de connexion au serveur.\n\n⏳ Le backend est peut-être en cours de démarrage. Attendez 30 secondes et réessayez.');
      } else {
        setError(`❌ ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDriverLogin = async () => {
    console.log('[LoginScreen] Tentative de connexion chauffeur');
    setError('');
    
    if (!phone) {
      setError('Veuillez entrer votre numéro de téléphone');
      return;
    }

    setIsLoading(true);

    try {
      await loginDriver(phone);
      console.log('[LoginScreen] Connexion réussie, redirection');
      router.replace('/');
    } catch (err: any) {
      console.error('[LoginScreen] Erreur de connexion:', err);
      const errorMessage = err.message || '';
      
      if (errorMessage.includes('attente') || errorMessage.includes('pending')) {
        setError('❌ Votre compte est en attente d\'approbation par un chef d\'équipe.');
      } else if (errorMessage.includes('non reconnu') || errorMessage.includes('not found')) {
        setError('❌ Numéro de téléphone non reconnu. Contactez votre chef d\'équipe.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('❌ Erreur de connexion au serveur.\n\n⏳ Le backend est peut-être en cours de démarrage. Attendez 30 secondes et réessayez.');
      } else {
        setError(`❌ ${errorMessage || 'Échec de la connexion'}`);
      }
    } finally {
      setIsLoading(false);
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
                <Text style={styles.formTitle}>Connexion Chef d&apos;équipe</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={colors.grey}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isLoading}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Mot de passe"
                  placeholderTextColor={colors.grey}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!isLoading}
                />

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleLeaderLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Se connecter</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.testCredentialsContainer}>
                  <Text style={styles.testCredentialsTitle}>🔑 Identifiants de test :</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setEmail('contact@thegreenhands.fr');
                      setPassword('Lagrandeteam13');
                    }}
                    style={styles.autofillButton}
                  >
                    <Text style={styles.autofillButtonText}>📋 Remplir automatiquement</Text>
                  </TouchableOpacity>
                  <Text style={styles.testCredentials}>
                    Email: contact@thegreenhands.fr
                  </Text>
                  <Text style={styles.testCredentials}>
                    Mot de passe: Lagrandeteam13
                  </Text>
                  <Text style={styles.testCredentialsNote}>
                    ✅ Un utilisateur de test est créé automatiquement au démarrage du serveur.
                  </Text>
                  <Text style={styles.testCredentialsNote}>
                    ⏳ Si la connexion échoue, le backend est peut-être en cours de démarrage. Attendez 30 secondes et réessayez.
                  </Text>
                </View>
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
                  editable={!isLoading}
                />

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleDriverLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
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
    lineHeight: 20,
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
  testCredentialsNote: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  autofillButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  autofillButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
});
