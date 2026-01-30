
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedGet, authenticatedPost, authenticatedPut } from '@/utils/api';
import { startLocationTracking, stopLocationTracking } from '@/utils/locationTracking';
import Modal from '@/components/ui/Modal';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function DriverDashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [activeShift, setActiveShift] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    loadActiveShift();
  }, []);

  const loadActiveShift = async () => {
    try {
      setLoading(true);
      console.log('[DriverDashboard] Chargement du shift actif...');
      const shift = await authenticatedGet<any>('/api/shifts/active');
      setActiveShift(shift);
      console.log('[DriverDashboard] Shift actif:', shift);
    } catch (err: any) {
      console.error('[DriverDashboard] Erreur lors du chargement du shift:', err);
      if (!err.message?.includes('404')) {
        setError('Erreur lors du chargement du shift');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartShift = async () => {
    try {
      console.log('[DriverDashboard] Démarrage du shift...');
      const shift = await authenticatedPost<any>('/api/shifts/start', {});
      setActiveShift(shift);
      
      await startLocationTracking(shift.id);
      
      router.push({
        pathname: '/inspection',
        params: { shiftId: shift.id, type: 'depart' },
      });
    } catch (err: any) {
      console.error('[DriverDashboard] Erreur lors du démarrage du shift:', err);
      setError('Erreur lors du démarrage du shift');
    }
  };

  const handleEndShift = async () => {
    if (!activeShift) return;

    try {
      console.log('[DriverDashboard] Fin du shift...');
      
      router.push({
        pathname: '/inspection',
        params: { shiftId: activeShift.id, type: 'retour' },
      });
    } catch (err: any) {
      console.error('[DriverDashboard] Erreur lors de la fin du shift:', err);
      setError('Erreur lors de la fin du shift');
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('[DriverDashboard] Déconnexion...');
      await logout();
      router.replace('/login');
    } catch (err: any) {
      console.error('[DriverDashboard] Erreur lors de la déconnexion:', err);
    }
  };

  const userName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : 'Chauffeur';
  const shiftStatus = activeShift ? 'Shift actif' : 'Shift inactif';
  const statusColor = activeShift ? colors.success : colors.grey;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Tableau de bord Chauffeur',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setShowLogoutModal(true)}
              style={styles.logoutButton}
            >
              <IconSymbol
                ios_icon_name="rectangle.portrait.and.arrow.right"
                android_material_icon_name="logout"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.userCard}>
              <View style={styles.userIconContainer}>
                <IconSymbol
                  ios_icon_name="person.circle.fill"
                  android_material_icon_name="account-circle"
                  size={64}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.userName}>{userName}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusText}>{shiftStatus}</Text>
              </View>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.actionsContainer}>
              {!activeShift ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.startButton]}
                  onPress={handleStartShift}
                >
                  <IconSymbol
                    ios_icon_name="play.circle.fill"
                    android_material_icon_name="play-arrow"
                    size={32}
                    color="#FFFFFF"
                  />
                  <Text style={styles.actionButtonText}>Début de shift</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.endButton]}
                  onPress={handleEndShift}
                >
                  <IconSymbol
                    ios_icon_name="stop.circle.fill"
                    android_material_icon_name="stop"
                    size={32}
                    color="#FFFFFF"
                  />
                  <Text style={styles.actionButtonText}>Fin de shift</Text>
                </TouchableOpacity>
              )}
            </View>

            {activeShift ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Informations du shift</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Début:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(activeShift.startTime).toLocaleString('fr-FR')}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Suivi GPS:</Text>
                  <Text style={[styles.infoValue, { color: colors.success }]}>Actif</Text>
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <Modal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Déconnexion"
        message="Voulez-vous vraiment vous déconnecter ?"
        type="confirm"
        confirmText="Déconnexion"
        cancelText="Annuler"
        onConfirm={handleSignOut}
      />
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  userCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  userIconContainer: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  actionsContainer: {
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    gap: 12,
  },
  startButton: {
    backgroundColor: colors.success,
  },
  endButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  logoutButton: {
    marginRight: 8,
    padding: 8,
  },
});
