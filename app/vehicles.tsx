
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import Modal from '@/components/ui/Modal';
import { authenticatedGet, authenticatedPost } from '@/utils/api';

interface Vehicle {
  id: string;
  immatriculation: string;
  marque: string;
  modele: string;
  carburant: 'électrique' | 'essence';
  dimensionsRoues: string;
  roueSecours: boolean;
  cric: boolean;
  croix: boolean;
  extincteur: boolean;
  trousseSecours: boolean;
  carteRecharge: boolean;
  numeroCarteRecharge: string | null;
  qrCode: string | null;
  createdAt: string;
}

export default function VehiclesScreen() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState<{ qrCode: string; qrImageUrl: string } | null>(null);

  const [formData, setFormData] = useState({
    immatriculation: '',
    marque: '',
    modele: '',
    carburant: 'électrique' as 'électrique' | 'essence',
    dimensionsRoues: '',
    roueSecours: true,
    cric: true,
    croix: true,
    extincteur: true,
    trousseSecours: true,
    carteRecharge: true,
    numeroCarteRecharge: '',
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    console.log('[Vehicles] Loading vehicles...');
    try {
      setLoading(true);
      const data = await authenticatedGet<Vehicle[]>('/api/vehicles');
      console.log('[Vehicles] Vehicles loaded:', data.length);
      setVehicles(data);
    } catch (err: any) {
      console.error('[Vehicles] Error loading vehicles:', err);
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVehicles();
    setRefreshing(false);
  };

  const handleAddVehicle = async () => {
    console.log('[Vehicles] Adding vehicle:', formData);
    
    if (!formData.immatriculation || !formData.marque || !formData.modele || !formData.dimensionsRoues) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.carteRecharge && !formData.numeroCarteRecharge) {
      setError('Le numéro de carte de recharge est obligatoire');
      return;
    }

    try {
      const data = await authenticatedPost<Vehicle>('/api/vehicles', formData);
      console.log('[Vehicles] Vehicle created:', data);
      setShowAddModal(false);
      resetForm();
      await loadVehicles();
    } catch (err: any) {
      console.error('[Vehicles] Error creating vehicle:', err);
      setError(err.message || 'Erreur de connexion');
    }
  };

  const handleGenerateQR = async (vehicleId: string) => {
    console.log('[Vehicles] Generating QR code for vehicle:', vehicleId);
    try {
      // Note: The backend doesn't have a generate-qr endpoint yet
      // For now, we'll simulate QR code generation
      const qrCode = `VEHICLE-${vehicleId}-${Date.now()}`;
      const data = { qrCode, qrImageUrl: '' };
      console.log('[Vehicles] QR code generated:', data);
      setQrData(data);
      setShowQRModal(true);
      
      // TODO: When backend implements /api/vehicles/:id/generate-qr endpoint, uncomment:
      // const data = await authenticatedPost<{ qrCode: string; qrImageUrl: string }>(`/api/vehicles/${vehicleId}/generate-qr`, {});
      // setQrData(data);
      // setShowQRModal(true);
      // await loadVehicles();
    } catch (err: any) {
      console.error('[Vehicles] Error generating QR code:', err);
      setError(err.message || 'Erreur de connexion');
    }
  };

  const resetForm = () => {
    setFormData({
      immatriculation: '',
      marque: '',
      modele: '',
      carburant: 'électrique',
      dimensionsRoues: '',
      roueSecours: true,
      cric: true,
      croix: true,
      extincteur: true,
      trousseSecours: true,
      carteRecharge: true,
      numeroCarteRecharge: '',
    });
  };

  const handleScanQR = () => {
    router.push('/qr-scanner');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Véhicules',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerBackTitle: 'Retour',
          headerRight: () => (
            <TouchableOpacity onPress={handleScanQR} style={styles.scanButton}>
              <IconSymbol
                ios_icon_name="qrcode.viewfinder"
                android_material_icon_name="qr-code-scanner"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          ),
        }}
      />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des véhicules...</Text>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scrollView}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <View style={styles.content}>
              {vehicles.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <IconSymbol
                    ios_icon_name="car.fill"
                    android_material_icon_name="directions-car"
                    size={64}
                    color={colors.grey}
                  />
                  <Text style={styles.emptyText}>Aucun véhicule</Text>
                  <Text style={styles.emptySubtext}>Ajoutez votre premier véhicule</Text>
                </View>
              ) : (
                vehicles.map((vehicle) => {
                  const hasQR = vehicle.qrCode !== null;
                  const fuelIcon = vehicle.carburant === 'électrique' ? 'electric-bolt' : 'local-gas-station';
                  
                  return (
                    <TouchableOpacity
                      key={vehicle.id}
                      style={styles.vehicleCard}
                      onPress={() => setSelectedVehicle(vehicle)}
                    >
                      <View style={styles.vehicleHeader}>
                        <View style={styles.vehicleIconContainer}>
                          <IconSymbol
                            ios_icon_name="car.fill"
                            android_material_icon_name="directions-car"
                            size={28}
                            color={colors.primary}
                          />
                        </View>
                        <View style={styles.vehicleInfo}>
                          <Text style={styles.vehiclePlate}>{vehicle.immatriculation}</Text>
                          <Text style={styles.vehicleName}>{vehicle.marque}</Text>
                          <Text style={styles.vehicleName}>{vehicle.modele}</Text>
                        </View>
                        {hasQR && (
                          <View style={styles.qrBadge}>
                            <IconSymbol
                              ios_icon_name="qrcode"
                              android_material_icon_name="qr-code"
                              size={20}
                              color={colors.success}
                            />
                          </View>
                        )}
                      </View>
                      <View style={styles.vehicleDetails}>
                        <View style={styles.detailRow}>
                          <IconSymbol
                            ios_icon_name="fuelpump.fill"
                            android_material_icon_name={fuelIcon}
                            size={16}
                            color={colors.textSecondary}
                          />
                          <Text style={styles.detailText}>{vehicle.carburant}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <IconSymbol
                            ios_icon_name="circle.fill"
                            android_material_icon_name="album"
                            size={16}
                            color={colors.textSecondary}
                          />
                          <Text style={styles.detailText}>{vehicle.dimensionsRoues}</Text>
                        </View>
                      </View>
                      {!hasQR && (
                        <TouchableOpacity
                          style={styles.generateQRButton}
                          onPress={() => handleGenerateQR(vehicle.id)}
                        >
                          <IconSymbol
                            ios_icon_name="qrcode"
                            android_material_icon_name="qr-code"
                            size={20}
                            color="#FFFFFF"
                          />
                          <Text style={styles.generateQRText}>Générer QR Code</Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.fab}
            onPress={() => setShowAddModal(true)}
          >
            <IconSymbol
              ios_icon_name="plus"
              android_material_icon_name="add"
              size={28}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </>
      )}

      <Modal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Ajouter un véhicule"
      >
        <ScrollView style={styles.modalScroll}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Immatriculation *</Text>
            <TextInput
              style={styles.input}
              value={formData.immatriculation}
              onChangeText={(text) => setFormData({ ...formData, immatriculation: text })}
              placeholder="AA-123-BB"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Marque *</Text>
            <TextInput
              style={styles.input}
              value={formData.marque}
              onChangeText={(text) => setFormData({ ...formData, marque: text })}
              placeholder="Renault"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Modèle *</Text>
            <TextInput
              style={styles.input}
              value={formData.modele}
              onChangeText={(text) => setFormData({ ...formData, modele: text })}
              placeholder="Kangoo"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Carburant *</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[styles.radioButton, formData.carburant === 'électrique' && styles.radioButtonActive]}
                onPress={() => setFormData({ ...formData, carburant: 'électrique' })}
              >
                <Text style={[styles.radioText, formData.carburant === 'électrique' && styles.radioTextActive]}>
                  Électrique
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioButton, formData.carburant === 'essence' && styles.radioButtonActive]}
                onPress={() => setFormData({ ...formData, carburant: 'essence' })}
              >
                <Text style={[styles.radioText, formData.carburant === 'essence' && styles.radioTextActive]}>
                  Essence
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Dimensions des roues *</Text>
            <TextInput
              style={styles.input}
              value={formData.dimensionsRoues}
              onChangeText={(text) => setFormData({ ...formData, dimensionsRoues: text })}
              placeholder="195/65 R15"
            />
          </View>

          <View style={styles.switchGroup}>
            <Text style={styles.label}>Roue de secours</Text>
            <Switch
              value={formData.roueSecours}
              onValueChange={(value) => setFormData({ ...formData, roueSecours: value })}
              trackColor={{ false: colors.inactive, true: colors.primary }}
            />
          </View>

          <View style={styles.switchGroup}>
            <Text style={styles.label}>Cric</Text>
            <Switch
              value={formData.cric}
              onValueChange={(value) => setFormData({ ...formData, cric: value })}
              trackColor={{ false: colors.inactive, true: colors.primary }}
            />
          </View>

          <View style={styles.switchGroup}>
            <Text style={styles.label}>Croix</Text>
            <Switch
              value={formData.croix}
              onValueChange={(value) => setFormData({ ...formData, croix: value })}
              trackColor={{ false: colors.inactive, true: colors.primary }}
            />
          </View>

          <View style={styles.switchGroup}>
            <Text style={styles.label}>Extincteur</Text>
            <Switch
              value={formData.extincteur}
              onValueChange={(value) => setFormData({ ...formData, extincteur: value })}
              trackColor={{ false: colors.inactive, true: colors.primary }}
            />
          </View>

          <View style={styles.switchGroup}>
            <Text style={styles.label}>Trousse de secours</Text>
            <Switch
              value={formData.trousseSecours}
              onValueChange={(value) => setFormData({ ...formData, trousseSecours: value })}
              trackColor={{ false: colors.inactive, true: colors.primary }}
            />
          </View>

          <View style={styles.switchGroup}>
            <Text style={styles.label}>Carte de recharge</Text>
            <Switch
              value={formData.carteRecharge}
              onValueChange={(value) => setFormData({ ...formData, carteRecharge: value })}
              trackColor={{ false: colors.inactive, true: colors.primary }}
            />
          </View>

          {formData.carteRecharge && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Numéro carte de recharge *</Text>
              <TextInput
                style={styles.input}
                value={formData.numeroCarteRecharge}
                onChangeText={(text) => setFormData({ ...formData, numeroCarteRecharge: text })}
                placeholder="1234567890"
                keyboardType="numeric"
              />
            </View>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={handleAddVehicle}>
            <Text style={styles.submitButtonText}>Ajouter le véhicule</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      <Modal
        visible={selectedVehicle !== null}
        onClose={() => setSelectedVehicle(null)}
        title="Détails du véhicule"
      >
        {selectedVehicle && (
          <ScrollView style={styles.detailsModal}>
            <Text style={styles.detailsPlate}>{selectedVehicle.immatriculation}</Text>
            <Text style={styles.detailsName}>{selectedVehicle.marque}</Text>
            <Text style={styles.detailsName}>{selectedVehicle.modele}</Text>
            
            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Informations</Text>
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Carburant:</Text>
                <Text style={styles.detailsValue}>{selectedVehicle.carburant}</Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Roues:</Text>
                <Text style={styles.detailsValue}>{selectedVehicle.dimensionsRoues}</Text>
              </View>
            </View>

            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Équipements</Text>
              <View style={styles.equipmentGrid}>
                <View style={styles.equipmentItem}>
                  <IconSymbol
                    ios_icon_name={selectedVehicle.roueSecours ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                    android_material_icon_name={selectedVehicle.roueSecours ? 'check-circle' : 'cancel'}
                    size={20}
                    color={selectedVehicle.roueSecours ? colors.success : colors.error}
                  />
                  <Text style={styles.equipmentText}>Roue de secours</Text>
                </View>
                <View style={styles.equipmentItem}>
                  <IconSymbol
                    ios_icon_name={selectedVehicle.cric ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                    android_material_icon_name={selectedVehicle.cric ? 'check-circle' : 'cancel'}
                    size={20}
                    color={selectedVehicle.cric ? colors.success : colors.error}
                  />
                  <Text style={styles.equipmentText}>Cric</Text>
                </View>
                <View style={styles.equipmentItem}>
                  <IconSymbol
                    ios_icon_name={selectedVehicle.croix ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                    android_material_icon_name={selectedVehicle.croix ? 'check-circle' : 'cancel'}
                    size={20}
                    color={selectedVehicle.croix ? colors.success : colors.error}
                  />
                  <Text style={styles.equipmentText}>Croix</Text>
                </View>
                <View style={styles.equipmentItem}>
                  <IconSymbol
                    ios_icon_name={selectedVehicle.extincteur ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                    android_material_icon_name={selectedVehicle.extincteur ? 'check-circle' : 'cancel'}
                    size={20}
                    color={selectedVehicle.extincteur ? colors.success : colors.error}
                  />
                  <Text style={styles.equipmentText}>Extincteur</Text>
                </View>
                <View style={styles.equipmentItem}>
                  <IconSymbol
                    ios_icon_name={selectedVehicle.trousseSecours ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                    android_material_icon_name={selectedVehicle.trousseSecours ? 'check-circle' : 'cancel'}
                    size={20}
                    color={selectedVehicle.trousseSecours ? colors.success : colors.error}
                  />
                  <Text style={styles.equipmentText}>Trousse de secours</Text>
                </View>
                <View style={styles.equipmentItem}>
                  <IconSymbol
                    ios_icon_name={selectedVehicle.carteRecharge ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                    android_material_icon_name={selectedVehicle.carteRecharge ? 'check-circle' : 'cancel'}
                    size={20}
                    color={selectedVehicle.carteRecharge ? colors.success : colors.error}
                  />
                  <Text style={styles.equipmentText}>Carte de recharge</Text>
                </View>
              </View>
              {selectedVehicle.carteRecharge && selectedVehicle.numeroCarteRecharge && (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>N° carte:</Text>
                  <Text style={styles.detailsValue}>{selectedVehicle.numeroCarteRecharge}</Text>
                </View>
              )}
            </View>

            {selectedVehicle.qrCode && (
              <TouchableOpacity
                style={styles.viewQRButton}
                onPress={() => {
                  setQrData({ qrCode: selectedVehicle.qrCode!, qrImageUrl: '' });
                  setShowQRModal(true);
                }}
              >
                <IconSymbol
                  ios_icon_name="qrcode"
                  android_material_icon_name="qr-code"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.viewQRText}>Voir le QR Code</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </Modal>

      <Modal
        visible={showQRModal}
        onClose={() => {
          setShowQRModal(false);
          setQrData(null);
        }}
        title="QR Code du véhicule"
      >
        {qrData && (
          <View style={styles.qrModal}>
            <View style={styles.qrPlaceholder}>
              <IconSymbol
                ios_icon_name="qrcode"
                android_material_icon_name="qr-code"
                size={120}
                color={colors.primary}
              />
              <Text style={styles.qrCode}>{qrData.qrCode}</Text>
            </View>
            <Text style={styles.qrInstructions}>
              Scannez ce code QR pour accéder aux informations du véhicule
            </Text>
            <TouchableOpacity style={styles.shareButton}>
              <IconSymbol
                ios_icon_name="square.and.arrow.up"
                android_material_icon_name="share"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.shareButtonText}>Partager</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>

      <Modal visible={error !== ''} onClose={() => setError('')} title="Erreur">
        <Text style={styles.errorText}>{error}</Text>
      </Modal>
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
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  vehicleCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehiclePlate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  qrBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  generateQRButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  generateQRText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  scanButton: {
    marginRight: 16,
  },
  modalScroll: {
    maxHeight: 500,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  radioButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  radioText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  radioTextActive: {
    color: '#FFFFFF',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailsModal: {
    maxHeight: 500,
  },
  detailsPlate: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  detailsName: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  detailsSection: {
    marginTop: 24,
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  equipmentGrid: {
    gap: 12,
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  equipmentText: {
    fontSize: 14,
    color: colors.text,
  },
  viewQRButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    gap: 8,
    marginTop: 24,
  },
  viewQRText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  qrModal: {
    alignItems: 'center',
    padding: 20,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: colors.background,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  qrCode: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontFamily: 'monospace',
  },
  qrInstructions: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    gap: 8,
    width: '100%',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
});
