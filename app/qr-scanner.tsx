
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import Modal from '@/components/ui/Modal';
import { authenticatedGet } from '@/utils/api';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';

interface VehicleData {
  vehicle: {
    id: string;
    immatriculation: string;
    marque: string;
    modele: string;
    carburant: string;
    dimensionsRoues: string;
    roueSecours: boolean;
    cric: boolean;
    croix: boolean;
    extincteur: boolean;
    trousseSecours: boolean;
    carteRecharge: boolean;
    numeroCarteRecharge: string | null;
  };
  latestInspection: any;
  safetyStatus: 'ok' | 'issues';
}

export default function QRScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);

  useEffect(() => {
    if (permission && !permission.granted) {
      console.log('[QRScanner] Camera permission not granted, requesting...');
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    const data = result.data;
    console.log('[QRScanner] QR code scanned:', data);
    setScanned(true);
    setLoading(true);

    try {
      const vehicleResult = await authenticatedGet<VehicleData>(`/api/vehicles/qr/${data}`);
      console.log('[QRScanner] Vehicle data loaded:', vehicleResult);
      setVehicleData(vehicleResult);
    } catch (err: any) {
      console.error('[QRScanner] Error loading vehicle data:', err);
      setError(err.message || 'Véhicule non trouvé');
    } finally {
      setLoading(false);
    }
  };

  const handleScanAgain = () => {
    console.log('[QRScanner] Resetting scanner for new scan');
    setScanned(false);
    setVehicleData(null);
    setError('');
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Scanner QR',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#FFFFFF',
            headerBackTitle: 'Retour',
          }}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.messageText}>Chargement de la caméra...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Scanner QR',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#FFFFFF',
            headerBackTitle: 'Retour',
          }}
        />
        <View style={styles.centerContainer}>
          <IconSymbol
            ios_icon_name="camera.fill"
            android_material_icon_name="camera"
            size={64}
            color={colors.error}
          />
          <Text style={styles.errorTitle}>Accès à la caméra refusé</Text>
          <Text style={styles.errorMessage}>
            Veuillez autoriser l&apos;accès à la caméra dans les paramètres
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={requestPermission}
          >
            <Text style={styles.buttonText}>Autoriser la caméra</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Scanner QR',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerBackTitle: 'Retour',
        }}
      />

      {!scanned && (
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.scanText}>Scannez le QR code du véhicule</Text>
          </View>
        </View>
      )}

      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.messageText}>Chargement des données...</Text>
        </View>
      )}

      <Modal
        visible={vehicleData !== null}
        onClose={() => {
          setVehicleData(null);
          handleScanAgain();
        }}
        title="Informations du véhicule"
      >
        {vehicleData && (
          <View style={styles.vehicleModal}>
            <View style={[styles.statusBadge, vehicleData.safetyStatus === 'ok' ? styles.statusOk : styles.statusIssues]}>
              <IconSymbol
                ios_icon_name={vehicleData.safetyStatus === 'ok' ? 'checkmark.circle.fill' : 'exclamationmark.triangle.fill'}
                android_material_icon_name={vehicleData.safetyStatus === 'ok' ? 'check-circle' : 'warning'}
                size={24}
                color="#FFFFFF"
              />
              <Text style={styles.statusText}>
                {vehicleData.safetyStatus === 'ok' ? 'Conforme' : 'Problèmes détectés'}
              </Text>
            </View>

            <Text style={styles.vehiclePlate}>{vehicleData.vehicle.immatriculation}</Text>
            <Text style={styles.vehicleName}>{vehicleData.vehicle.marque}</Text>
            <Text style={styles.vehicleName}>{vehicleData.vehicle.modele}</Text>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Informations</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Carburant:</Text>
                <Text style={styles.infoValue}>{vehicleData.vehicle.carburant}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Roues:</Text>
                <Text style={styles.infoValue}>{vehicleData.vehicle.dimensionsRoues}</Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Équipements</Text>
              <View style={styles.equipmentList}>
                <View style={styles.equipmentRow}>
                  <IconSymbol
                    ios_icon_name={vehicleData.vehicle.roueSecours ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                    android_material_icon_name={vehicleData.vehicle.roueSecours ? 'check-circle' : 'cancel'}
                    size={20}
                    color={vehicleData.vehicle.roueSecours ? colors.success : colors.error}
                  />
                  <Text style={styles.equipmentLabel}>Roue de secours</Text>
                </View>
                <View style={styles.equipmentRow}>
                  <IconSymbol
                    ios_icon_name={vehicleData.vehicle.cric ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                    android_material_icon_name={vehicleData.vehicle.cric ? 'check-circle' : 'cancel'}
                    size={20}
                    color={vehicleData.vehicle.cric ? colors.success : colors.error}
                  />
                  <Text style={styles.equipmentLabel}>Cric</Text>
                </View>
                <View style={styles.equipmentRow}>
                  <IconSymbol
                    ios_icon_name={vehicleData.vehicle.croix ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                    android_material_icon_name={vehicleData.vehicle.croix ? 'check-circle' : 'cancel'}
                    size={20}
                    color={vehicleData.vehicle.croix ? colors.success : colors.error}
                  />
                  <Text style={styles.equipmentLabel}>Croix</Text>
                </View>
                <View style={styles.equipmentRow}>
                  <IconSymbol
                    ios_icon_name={vehicleData.vehicle.extincteur ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                    android_material_icon_name={vehicleData.vehicle.extincteur ? 'check-circle' : 'cancel'}
                    size={20}
                    color={vehicleData.vehicle.extincteur ? colors.success : colors.error}
                  />
                  <Text style={styles.equipmentLabel}>Extincteur</Text>
                </View>
                <View style={styles.equipmentRow}>
                  <IconSymbol
                    ios_icon_name={vehicleData.vehicle.trousseSecours ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                    android_material_icon_name={vehicleData.vehicle.trousseSecours ? 'check-circle' : 'cancel'}
                    size={20}
                    color={vehicleData.vehicle.trousseSecours ? colors.success : colors.error}
                  />
                  <Text style={styles.equipmentLabel}>Trousse de secours</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={handleScanAgain}
            >
              <Text style={styles.scanAgainText}>Scanner un autre véhicule</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>

      <Modal visible={error !== ''} onClose={() => { setError(''); handleScanAgain(); }} title="Erreur">
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => { setError(''); handleScanAgain(); }}
        >
          <Text style={styles.buttonText}>Réessayer</Text>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
    minWidth: 200,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scannerContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 32,
    textAlign: 'center',
  },
  vehicleModal: {
    padding: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  statusOk: {
    backgroundColor: colors.success,
  },
  statusIssues: {
    backgroundColor: colors.error,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  vehiclePlate: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  vehicleName: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  infoSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
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
    fontWeight: '600',
    color: colors.text,
  },
  equipmentList: {
    gap: 12,
  },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  equipmentLabel: {
    fontSize: 14,
    color: colors.text,
  },
  scanAgainButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
  },
  scanAgainText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
});
