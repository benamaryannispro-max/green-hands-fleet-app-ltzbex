
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import Constants from 'expo-constants';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: string;
}

export default function DiagnosticScreen() {
  const router = useRouter();
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);

  const backendUrl = Constants.expoConfig?.extra?.backendUrl || 'Non configuré';

  const runDiagnostics = async () => {
    setLoading(true);
    const diagnosticResults: DiagnosticResult[] = [];

    // Test 1: Configuration du backend
    const configTest = {
      name: 'Configuration Backend',
      status: backendUrl && backendUrl !== 'Non configuré' ? 'success' : 'error',
      message: backendUrl && backendUrl !== 'Non configuré' 
        ? 'URL du backend configurée' 
        : 'URL du backend non configurée',
      details: backendUrl,
    } as DiagnosticResult;
    diagnosticResults.push(configTest);

    // Test 2: Connexion au backend
    try {
      const testUrl = `${backendUrl}/api/health`;
      const testMessage = `Test de connexion à ${testUrl}`;
      diagnosticResults.push({
        name: 'Connexion Backend',
        status: 'pending',
        message: testMessage,
      });

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const lastResult = diagnosticResults[diagnosticResults.length - 1];
      if (response.ok) {
        lastResult.status = 'success';
        lastResult.message = 'Backend accessible';
        lastResult.details = `Status: ${response.status}`;
      } else {
        lastResult.status = 'error';
        lastResult.message = 'Backend inaccessible';
        lastResult.details = `Status: ${response.status}`;
      }
    } catch (error: any) {
      const lastResult = diagnosticResults[diagnosticResults.length - 1];
      lastResult.status = 'error';
      lastResult.message = 'Erreur de connexion';
      lastResult.details = error.message;
    }

    // Test 3: Endpoint d'authentification
    try {
      const authUrl = `${backendUrl}/api/auth/sign-in/email`;
      const authMessage = `Test de l'endpoint d'authentification`;
      diagnosticResults.push({
        name: 'Endpoint Authentification',
        status: 'pending',
        message: authMessage,
      });

      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'test',
        }),
      });

      const lastResult = diagnosticResults[diagnosticResults.length - 1];
      if (response.status === 401 || response.status === 400) {
        lastResult.status = 'success';
        lastResult.message = 'Endpoint d\'authentification fonctionne';
        lastResult.details = 'Le serveur répond correctement (401/400 attendu pour des identifiants invalides)';
      } else if (response.status === 404) {
        lastResult.status = 'error';
        lastResult.message = 'Endpoint d\'authentification introuvable';
        lastResult.details = 'Le backend ne répond pas sur /api/auth/sign-in/email';
      } else {
        lastResult.status = 'warning';
        lastResult.message = 'Réponse inattendue';
        lastResult.details = `Status: ${response.status}`;
      }
    } catch (error: any) {
      const lastResult = diagnosticResults[diagnosticResults.length - 1];
      lastResult.status = 'error';
      lastResult.message = 'Erreur lors du test';
      lastResult.details = error.message;
    }

    setResults(diagnosticResults);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: string) => {
    const statusValue = status;
    if (statusValue === 'success') {
      return { ios: 'checkmark.circle.fill', android: 'check-circle', color: colors.success };
    }
    if (statusValue === 'error') {
      return { ios: 'xmark.circle.fill', android: 'error', color: colors.error };
    }
    if (statusValue === 'warning') {
      return { ios: 'exclamationmark.triangle.fill', android: 'warning', color: colors.warning };
    }
    return { ios: 'clock.fill', android: 'schedule', color: colors.textSecondary };
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Diagnostic',
          headerShown: true,
        }}
      />

      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🔍 Diagnostic du système</Text>
          <Text style={styles.subtitle}>
            Vérification de la connexion au backend
          </Text>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Tests en cours...</Text>
          </View>
        )}

        {!loading && results.map((result, index) => {
          const statusIcon = getStatusIcon(result.status);
          return (
            <View key={index} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <IconSymbol
                  ios_icon_name={statusIcon.ios}
                  android_material_icon_name={statusIcon.android}
                  size={24}
                  color={statusIcon.color}
                />
                <Text style={styles.resultName}>{result.name}</Text>
              </View>
              <Text style={styles.resultMessage}>{result.message}</Text>
              {result.details && (
                <Text style={styles.resultDetails}>{result.details}</Text>
              )}
            </View>
          );
        })}

        {!loading && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.button}
              onPress={runDiagnostics}
            >
              <IconSymbol
                ios_icon_name="arrow.clockwise"
                android_material_icon_name="refresh"
                size={20}
                color="#fff"
              />
              <Text style={styles.buttonText}>Relancer les tests</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => router.back()}
            >
              <Text style={styles.buttonTextSecondary}>Retour</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>💡 Besoin d'aide ?</Text>
          <Text style={styles.helpText}>
            Si tous les tests échouent, le backend n'est pas déployé.
            {'\n\n'}
            Consultez le fichier LISEZ-MOI-URGENT.md pour les instructions de déploiement.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  resultMessage: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  resultDetails: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  helpSection: {
    marginTop: 32,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
