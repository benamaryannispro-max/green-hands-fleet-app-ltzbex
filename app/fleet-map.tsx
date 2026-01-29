
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { authenticatedGet } from '@/utils/api';
import Modal from '@/components/ui/Modal';

interface DriverLocation {
  driverId: string;
  firstName: string;
  lastName: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  shiftId: string;
}

export default function FleetMapScreen() {
  const [locations, setLocations] = useState<DriverLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ visible: boolean; title: string; message: string; type: 'error' }>({
    visible: false,
    title: '',
    message: '',
    type: 'error',
  });

  useEffect(() => {
    loadFleetLocations();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadFleetLocations, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadFleetLocations = async () => {
    try {
      const data = await authenticatedGet('/api/location/fleet');
      console.log('Fleet locations loaded:', data);
      setLocations(data);
    } catch (error) {
      console.error('Error loading fleet locations:', error);
      setModal({
        visible: true,
        title: 'Erreur',
        message: 'Impossible de charger les positions de la flotte',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Carte de la flotte',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
        }}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des positions...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>
              🗺️ Carte interactive
            </Text>
            <Text style={styles.mapPlaceholderSubtext}>
              {locations.length} chauffeur(s) en service
            </Text>
          </View>

          <View style={styles.driversList}>
            <Text style={styles.driversListTitle}>Chauffeurs actifs</Text>
            {locations.map((location) => (
              <View key={location.driverId} style={styles.driverCard}>
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>
                    {location.firstName} {location.lastName}
                  </Text>
                  <Text style={styles.driverLocation}>
                    📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </Text>
                  <Text style={styles.driverTimestamp}>
                    Dernière mise à jour: {new Date(location.timestamp).toLocaleTimeString('fr-FR')}
                  </Text>
                </View>
              </View>
            ))}
            {locations.length === 0 && (
              <Text style={styles.emptyText}>Aucun chauffeur en service</Text>
            )}
          </View>
        </View>
      )}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  mapPlaceholder: {
    height: 300,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mapPlaceholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  driversList: {
    flex: 1,
    padding: 16,
  },
  driversListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  driverCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  driverInfo: {
    gap: 4,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  driverLocation: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  driverTimestamp: {
    fontSize: 12,
    color: colors.grey,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
});
