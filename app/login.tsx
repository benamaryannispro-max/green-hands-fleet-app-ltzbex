
import { useAuth } from '@/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import React, { useState } from 'react';
import { router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import Modal from '@/components/ui/Modal';
import { IconSymbol } from '@/components/IconSymbol';
import Constants from 'expo-constants';

export default function LoginScreen() {
  const [leaderEmail, setLeaderEmail] = useState('contact@thegreenhands.fr');
  const [leaderPassword, setLeaderPassword] = useState('Lagrandeteam13');
  const [driverPhone, setDriverPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('');
  const { loginLeader, loginDriver } = useAuth();

  const backendUrl = Constants.expoConfig?.extra?.backendUrl || 'Non configuré';

  const handleLeaderLogin = async () => {
    if (!leaderEmail || !leaderPassword) {
      setErrorTitle('Champs requis');
      setErrorMessage('Veuillez remplir tous les champs.');
      setErrorModalVisible(true);
      return;
    }

    console.log('[LoginScreen] Tentative de connexion chef d\'équipe');
    setLoading(true);
    try {
      await loginLeader(leaderEmail, leaderPassword);
      console.log('[LoginScreen] Connexion réussie, redirection...');
      router.replace('/leader-dashboard');
    } catch (error: any) {
      console.error('[LoginScreen] Erreur de connexion:', error);
      
      let title = 'Erreur de connexion';
      let message = 'Une erreur est survenue lors de la connexion.';
      
      if (error.message?.includes('404') || error.message?.includes('not exist') || error.message?.includes('Backend non disponible')) {
        title = '❌ Backend non disponible';
        message = `Le serveur backend n'est pas accessible.\n\n🔧 URL du backend:\n${backendUrl}\n\n📋 Actions à effectuer:\n\n1. Vérifiez que le backend est déployé\n2. Vérifiez l'URL dans app.json\n3. Consultez LISEZ-MOI-URGENT.md\n4. Utilisez le bouton "Diagnostic" ci-dessous\n\nCode d'erreur: Backend introuvable (404)`;
      } else if (error.message?.includes('401') || error.message?.includes('Unauthorized') || error.message?.includes('Non autorisé')) {
        title = 'Identifiants incorrects';
        message = 'L\'email ou le mot de passe est incorrect.';
      } else if (error.message?.includes('Network') || error.message?.includes('réseau')) {
        title = 'Erreur réseau';
        message = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
      }
      
      setErrorTitle(title);
      setErrorMessage(message);
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDriverLogin = async () => {
    if (!driverPhone) {
      setErrorTitle('Champ requis');
      setErrorMessage('Veuillez entrer votre numéro de téléphone.');
      setErrorModalVisible(true);
      return;
    }

    console.log('[LoginScreen] Tentative de connexion chauffeur');
    setLoading(true);
    try {
      await loginDriver(driverPhone);
      console.log('[LoginScreen] Connexion réussie, redirection...');
      router.replace('/driver-dashboard');
    } catch (error: any) {
      console.error('[LoginScreen] Erreur de connexion:', error);
      
      let title = 'Erreur de connexion';
      let message = 'Une erreur est survenue lors de la connexion.';
      
      if (error.message?.includes('404') || error.message?.includes('not exist') || error.message?.includes('Backend non disponible')) {
        title = '❌ Backend non disponible';
        message = `Le serveur backend n'est pas accessible.\n\n🔧 URL du backend:\n${backendUrl}\n\n📋 Actions à effectuer:\n\n1. Vérifiez que le backend est déployé\n2. Vérifiez l'URL dans app.json\n3. Consultez LISEZ-MOI-URGENT.md\n4. Utilisez le bouton "Diagnostic" ci-dessous\n\nCode d'erreur: Backend introuvable (404)`;
      } else if (error.message?.includes('401') || error.message?.includes('Unauthorized') || error.message?.includes('Non autorisé')) {
        title = 'Accès refusé';
        message = 'Votre compte n\'est pas approuvé ou n\'existe pas. Contactez votre chef d\'équipe.';
      } else if (error.message?.includes('Network') || error.message?.includes('réseau')) {
        title = 'Erreur réseau';
        message = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
      }
      
      setErrorTitle(title);
      setErrorMessage(message);
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>GREEN HANDS</Text>
            <Text style={styles.subtitle}>Gestion de flotte</Text>
          </View>

          {/* Leader Login Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👔 Connexion Chef d'équipe</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={leaderEmail}
              onChangeText={setLeaderEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor={colors.textSecondary}
              value={leaderPassword}
              onChangeText={setLeaderPassword}
              secureTextEntry
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLeaderLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Se connecter</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Driver Login Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚗 Connexion Chauffeur</Text>
            <TextInput
              style={styles.input}
              placeholder="Numéro de téléphone (+33...)"
              placeholderTextColor={colors.textSecondary}
              value={driverPhone}
              onChangeText={setDriverPhone}
              keyboardType="phone-pad"
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleDriverLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Se connecter</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Backend Status */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>🔧 Serveur backend:</Text>
            <Text style={styles.statusUrl} numberOfLines={2}>
              {backendUrl}
            </Text>
          </View>

          {/* Diagnostic Button */}
          <TouchableOpacity
            style={styles.diagnosticButton}
            onPress={() => router.push('/diagnostic')}
          >
            <IconSymbol
              ios_icon_name="stethoscope"
              android_material_icon_name="healing"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.diagnosticButtonText}>Lancer le diagnostic</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Error Modal */}
      <Modal
        visible={errorModalVisible}
        onClose={() => setErrorModalVisible(false)}
        title={errorTitle}
        message={errorMessage}
        type="error"
        confirmText="OK"
        onConfirm={() => setErrorModalVisible(false)}
      />
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
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  statusContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  statusUrl: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  diagnosticButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 8,
  },
  diagnosticButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
