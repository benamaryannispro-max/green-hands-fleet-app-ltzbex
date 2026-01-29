
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
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { authenticatedGet, authenticatedPost, authenticatedPut } from '@/utils/api';
import { startLocationTracking, stopLocationTracking } from '@/utils/locationTracking';
import Modal from '@/components/ui/Modal';

export default function DriverDashboardScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [activeShift, setActiveShift] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ visible: boolean; title: string; message: string; type: 'success' | 'error' }>({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  useEffect(() => {
    loadActiveShift();
  }, []);

  const loadActiveShift = async () => {
    console.log('Loading active shift for driver');
    setLoading(true);
    try {
      const shift = await authenticatedGet('/api/shifts/active');
      console.log('Active shift loaded:', shift);
      setActiveShift(shift);
    } catch (error) {
      console.error('Error loading active shift:', error);
      setActiveShift(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStartShift = async () => {
    console.log('User tapped Start Shift button');
    setLoading(true);
    try {
      const shift = await authenticatedPost('/api/shifts/start', {});
      console.log('Shift started:', shift);
      setActiveShift(shift);
      
      // Start location tracking
      const trackingStarted = await startLocationTracking(shift.id);
      if (!trackingStarted) {
        setModal({
          visible: true,
          title: 'Attention',
          message: 'Le suivi de localisation n\'a pas pu démarrer. Veuillez autoriser l\'accès à la localisation.',
          type: 'error',
        });
      } else {
        setModal({
          visible: true,
          title: 'Shift démarré',
          message: 'Votre shift a démarré et le suivi GPS est actif',
          type: 'success',
        });
      }
    } catch (error) {
      console.error('Error starting shift:', error);
      setModal({
        visible: true,
        title: 'Erreur',
        message: 'Impossible de démarrer le shift',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEndShift = async () => {
    console.log('User tapped End Shift button');
    if (!activeShift) return;
    
    setLoading(true);
    try {
      const updatedShift = await authenticatedPut(`/api/shifts/${activeShift.id}/end`, {});
      console.log('Shift ended:', updatedShift);
      
      // Stop location tracking
      await stopLocationTracking();
      
      setActiveShift(null);
      setModal({
        visible: true,
        title: 'Shift terminé',
        message: 'Votre shift a été terminé avec succès',
        type: 'success',
      });
    } catch (error) {
      console.error('Error ending shift:', error);
      setModal({
        visible: true,
        title: 'Erreur',
        message: 'Impossible de terminer le shift',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    console.log('User tapped Sign Out button');
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const shiftActive = activeShift !== null;
  const statusText = shiftActive ? 'Shift actif' : 'Shift inactif';
  const statusColor = shiftActive ? colors.success : colors.inactive;

  const firstName = user?.firstName || 'Chauffeur';
  const lastName = user?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'GREEN HANDS',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerRight: () => (
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
              <IconSymbol
                ios_icon_name="rectangle.portrait.and.arrow.right"
                android_material_icon_name="logout"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.welcomeText}>Bonjour,</Text>
            <Text style={styles.nameText}>{fullName}</Text>
          </View>

          <View style={[styles.statusCard, { borderColor: statusColor }]}>
            <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
            <Text style={styles.statusText}>{statusText}</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <View style={styles.actionsContainer}>
              {!shiftActive ? (
                <TouchableOpacity style={styles.primaryButton} onPress={handleStartShift}>
                  <IconSymbol
                    ios_icon_name="play.circle.fill"
                    android_material_icon_name="play-circle-filled"
                    size={24}
                    color="#FFFFFF"
                  />
                  <Text style={styles.primaryButtonText}>Début de shift</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <View style={styles.shiftActionsCard}>
                    <Text style={styles.shiftActionsTitle}>Actions obligatoires</Text>
                    
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => router.push(`/inspection?shiftId=${activeShift.id}&type=departure`)}
                    >
                      <IconSymbol
                        ios_icon_name="checkmark.circle"
                        android_material_icon_name="check-circle"
                        size={24}
                        color={colors.primary}
                      />
                      <Text style={styles.actionButtonText}>Inspection d&apos;équipement (Départ)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => router.push(`/battery-record?shiftId=${activeShift.id}&type=departure`)}
                    >
                      <IconSymbol
                        ios_icon_name="battery.100"
                        android_material_icon_name="battery-full"
                        size={24}
                        color={colors.primary}
                      />
                      <Text style={styles.actionButtonText}>Nombre de batteries au départ</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.endButton} onPress={handleEndShift}>
                    <IconSymbol
                      ios_icon_name="stop.circle.fill"
                      android_material_icon_name="stop-circle"
                      size={24}
                      color="#FFFFFF"
                    />
                    <Text style={styles.endButtonText}>Fin de shift</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={modal.visible}
        onClose={() => setModal({ ...modal, visible: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  nameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  statusCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  loader: {
    marginTop: 40,
  },
  actionsContainer: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  endButton: {
    backgroundColor: colors.error,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  endButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  shiftActionsCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
  },
  shiftActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 12,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  signOutButton: {
    marginRight: 16,
  },
});
