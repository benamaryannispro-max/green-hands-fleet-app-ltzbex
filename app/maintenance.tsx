
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import Modal from '@/components/ui/Modal';
import { authenticatedGet, authenticatedPost, authenticatedPut } from '@/utils/api';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicleName: string;
  date: string;
  km: number;
  type: 'révision' | 'réparation' | 'panne';
  notes: string;
  status: 'à faire' | 'en cours' | 'terminé';
  createdAt: string;
}

interface MaintenanceAlert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  alertType: 'upcoming_service' | 'overdue_service';
  thresholdKm: number;
  currentKm: number;
  message: string;
  createdAt: string;
}

export default function MaintenanceScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'records' | 'alerts'>('records');

  const [formData, setFormData] = useState({
    vehicleId: '',
    date: new Date(),
    km: '',
    type: 'révision' as 'révision' | 'réparation' | 'panne',
    notes: '',
    status: 'à faire' as 'à faire' | 'en cours' | 'terminé',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('[Maintenance] Loading maintenance data...');
    try {
      setLoading(true);
      
      // Load recent maintenance records
      const recordsData = await authenticatedGet<MaintenanceRecord[]>('/api/maintenance/recent');
      console.log('[Maintenance] Maintenance records loaded:', recordsData.length);
      setRecords(recordsData);
      
      // Note: Maintenance alerts endpoint doesn't exist in the API
      // We'll keep the alerts state empty for now
      setAlerts([]);
    } catch (err: any) {
      console.error('[Maintenance] Error loading maintenance data:', err);
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddRecord = async () => {
    console.log('[Maintenance] Adding maintenance record:', formData);
    
    if (!formData.vehicleId || !formData.km || !formData.notes) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const payload = {
        vehicleId: formData.vehicleId,
        date: formData.date.toISOString(),
        km: parseInt(formData.km),
        type: formData.type,
        notes: formData.notes,
        status: formData.status,
      };

      const data = await authenticatedPost<MaintenanceRecord>('/api/maintenance', payload);
      console.log('[Maintenance] Maintenance record created:', data);
      setShowAddModal(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      console.error('[Maintenance] Error creating maintenance record:', err);
      setError(err.message || 'Erreur de connexion');
    }
  };

  const handleUpdateStatus = async (recordId: string, newStatus: 'à faire' | 'en cours' | 'terminé') => {
    console.log('[Maintenance] Updating maintenance status:', recordId, newStatus);
    try {
      await authenticatedPut(`/api/maintenance/${recordId}`, { status: newStatus });
      setRecords(prev => prev.map(record => 
        record.id === recordId ? { ...record, status: newStatus } : record
      ));
      setSelectedRecord(null);
    } catch (err: any) {
      console.error('[Maintenance] Error updating maintenance status:', err);
      setError(err.message || 'Erreur de connexion');
    }
  };

  const resetForm = () => {
    setFormData({
      vehicleId: '',
      date: new Date(),
      km: '',
      type: 'révision',
      notes: '',
      status: 'à faire',
    });
  };

  const showDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: formData.date,
        onChange: (event, selectedDate) => {
          if (selectedDate) {
            setFormData({ ...formData, date: selectedDate });
          }
        },
        mode: 'date',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getTypeIcon = (type: string) => {
    const iconMap = {
      révision: { ios: 'wrench.fill', android: 'build', color: colors.primary },
      réparation: { ios: 'hammer.fill', android: 'build', color: colors.warning },
      panne: { ios: 'exclamationmark.triangle.fill', android: 'warning', color: colors.error },
    };
    return iconMap[type as keyof typeof iconMap] || iconMap.révision;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      'à faire': colors.grey,
      'en cours': colors.warning,
      'terminé': colors.success,
    };
    return colorMap[status as keyof typeof colorMap] || colors.grey;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Maintenance',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerBackTitle: 'Retour',
        }}
      />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <>
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'records' && styles.tabActive]}
              onPress={() => setActiveTab('records')}
            >
              <Text style={[styles.tabText, activeTab === 'records' && styles.tabTextActive]}>
                Historique
              </Text>
              {records.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{records.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'alerts' && styles.tabActive]}
              onPress={() => setActiveTab('alerts')}
            >
              <Text style={[styles.tabText, activeTab === 'alerts' && styles.tabTextActive]}>
                Alertes
              </Text>
              {alerts.length > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <Text style={styles.badgeText}>{alerts.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {activeTab === 'records' ? (
              <View style={styles.content}>
                {records.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <IconSymbol
                      ios_icon_name="wrench.fill"
                      android_material_icon_name="build"
                      size={64}
                      color={colors.grey}
                    />
                    <Text style={styles.emptyText}>Aucun enregistrement</Text>
                    <Text style={styles.emptySubtext}>Ajoutez votre premier enregistrement</Text>
                  </View>
                ) : (
                  records.map((record) => {
                    const typeIcon = getTypeIcon(record.type);
                    const statusColor = getStatusColor(record.status);
                    const dateText = formatDate(record.date);

                    return (
                      <TouchableOpacity
                        key={record.id}
                        style={styles.recordCard}
                        onPress={() => setSelectedRecord(record)}
                      >
                        <View style={[styles.recordIconContainer, { backgroundColor: typeIcon.color }]}>
                          <IconSymbol
                            ios_icon_name={typeIcon.ios}
                            android_material_icon_name={typeIcon.android}
                            size={24}
                            color="#FFFFFF"
                          />
                        </View>
                        <View style={styles.recordContent}>
                          <Text style={styles.recordVehicle}>{record.vehicleName}</Text>
                          <Text style={styles.recordType}>{record.type}</Text>
                          <Text style={styles.recordNotes} numberOfLines={2}>
                            {record.notes}
                          </Text>
                          <View style={styles.recordFooter}>
                            <Text style={styles.recordDate}>{dateText}</Text>
                            <Text style={styles.recordKm}>{record.km}</Text>
                            <Text style={styles.recordKm}>km</Text>
                          </View>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                          <Text style={styles.statusText}>{record.status}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            ) : (
              <View style={styles.content}>
                {alerts.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check-circle"
                      size={64}
                      color={colors.success}
                    />
                    <Text style={styles.emptyText}>Aucune alerte</Text>
                    <Text style={styles.emptySubtext}>Tous les véhicules sont à jour</Text>
                  </View>
                ) : (
                  alerts.map((alert) => {
                    const isOverdue = alert.alertType === 'overdue_service';
                    const alertColor = isOverdue ? colors.error : colors.warning;

                    return (
                      <View key={alert.id} style={[styles.alertCard, { borderLeftColor: alertColor }]}>
                        <View style={[styles.alertIconContainer, { backgroundColor: alertColor }]}>
                          <IconSymbol
                            ios_icon_name={isOverdue ? 'exclamationmark.triangle.fill' : 'clock.fill'}
                            android_material_icon_name={isOverdue ? 'warning' : 'schedule'}
                            size={24}
                            color="#FFFFFF"
                          />
                        </View>
                        <View style={styles.alertContent}>
                          <Text style={styles.alertVehicle}>{alert.vehicleName}</Text>
                          <Text style={styles.alertMessage}>{alert.message}</Text>
                          <View style={styles.alertFooter}>
                            <Text style={styles.alertKm}>{alert.currentKm}</Text>
                            <Text style={styles.alertKm}>km</Text>
                            <Text style={styles.alertSeparator}>/</Text>
                            <Text style={styles.alertThreshold}>{alert.thresholdKm}</Text>
                            <Text style={styles.alertThreshold}>km</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </ScrollView>

          {activeTab === 'records' && (
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
          )}
        </>
      )}

      <Modal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Ajouter un enregistrement"
      >
        <ScrollView style={styles.modalScroll}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Véhicule *</Text>
            <TextInput
              style={styles.input}
              value={formData.vehicleId}
              onChangeText={(text) => setFormData({ ...formData, vehicleId: text })}
              placeholder="ID du véhicule"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Date *</Text>
            <TouchableOpacity style={styles.dateButton} onPress={showDatePicker}>
              <Text style={styles.dateText}>{formatDate(formData.date.toISOString())}</Text>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar-today"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Kilométrage *</Text>
            <TextInput
              style={styles.input}
              value={formData.km}
              onChangeText={(text) => setFormData({ ...formData, km: text })}
              placeholder="50000"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Type *</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[styles.radioButton, formData.type === 'révision' && styles.radioButtonActive]}
                onPress={() => setFormData({ ...formData, type: 'révision' })}
              >
                <Text style={[styles.radioText, formData.type === 'révision' && styles.radioTextActive]}>
                  Révision
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioButton, formData.type === 'réparation' && styles.radioButtonActive]}
                onPress={() => setFormData({ ...formData, type: 'réparation' })}
              >
                <Text style={[styles.radioText, formData.type === 'réparation' && styles.radioTextActive]}>
                  Réparation
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioButton, formData.type === 'panne' && styles.radioButtonActive]}
                onPress={() => setFormData({ ...formData, type: 'panne' })}
              >
                <Text style={[styles.radioText, formData.type === 'panne' && styles.radioTextActive]}>
                  Panne
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Notes *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Description de l'intervention..."
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Statut *</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[styles.radioButton, formData.status === 'à faire' && styles.radioButtonActive]}
                onPress={() => setFormData({ ...formData, status: 'à faire' })}
              >
                <Text style={[styles.radioText, formData.status === 'à faire' && styles.radioTextActive]}>
                  À faire
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioButton, formData.status === 'en cours' && styles.radioButtonActive]}
                onPress={() => setFormData({ ...formData, status: 'en cours' })}
              >
                <Text style={[styles.radioText, formData.status === 'en cours' && styles.radioTextActive]}>
                  En cours
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioButton, formData.status === 'terminé' && styles.radioButtonActive]}
                onPress={() => setFormData({ ...formData, status: 'terminé' })}
              >
                <Text style={[styles.radioText, formData.status === 'terminé' && styles.radioTextActive]}>
                  Terminé
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleAddRecord}>
            <Text style={styles.submitButtonText}>Ajouter l&apos;enregistrement</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      <Modal
        visible={selectedRecord !== null}
        onClose={() => setSelectedRecord(null)}
        title="Détails de l'enregistrement"
      >
        {selectedRecord && (
          <View style={styles.detailsModal}>
            <Text style={styles.detailsVehicle}>{selectedRecord.vehicleName}</Text>
            <Text style={styles.detailsType}>{selectedRecord.type}</Text>
            
            <View style={styles.detailsSection}>
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Date:</Text>
                <Text style={styles.detailsValue}>{formatDate(selectedRecord.date)}</Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Kilométrage:</Text>
                <Text style={styles.detailsValue}>{selectedRecord.km}</Text>
                <Text style={styles.detailsValue}>km</Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Statut:</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedRecord.status) }]}>
                  <Text style={styles.statusText}>{selectedRecord.status}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Notes</Text>
              <Text style={styles.detailsNotes}>{selectedRecord.notes}</Text>
            </View>

            {selectedRecord.status !== 'terminé' && (
              <View style={styles.actionsSection}>
                <Text style={styles.detailsSectionTitle}>Changer le statut</Text>
                <View style={styles.actionButtons}>
                  {selectedRecord.status !== 'en cours' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.warning }]}
                      onPress={() => handleUpdateStatus(selectedRecord.id, 'en cours')}
                    >
                      <Text style={styles.actionButtonText}>En cours</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.success }]}
                    onPress={() => handleUpdateStatus(selectedRecord.id, 'terminé')}
                  >
                    <Text style={styles.actionButtonText}>Terminé</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  recordCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
  },
  recordIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordContent: {
    flex: 1,
  },
  recordVehicle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  recordType: {
    fontSize: 14,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  recordNotes: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  recordFooter: {
    flexDirection: 'row',
    gap: 4,
  },
  recordDate: {
    fontSize: 12,
    color: colors.grey,
    marginRight: 12,
  },
  recordKm: {
    fontSize: 12,
    color: colors.grey,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  alertCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  alertIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertVehicle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  alertFooter: {
    flexDirection: 'row',
    gap: 4,
  },
  alertKm: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  alertSeparator: {
    fontSize: 14,
    color: colors.grey,
    marginHorizontal: 4,
  },
  alertThreshold: {
    fontSize: 14,
    color: colors.grey,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
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
    padding: 20,
  },
  detailsVehicle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  detailsType: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    textTransform: 'capitalize',
    marginBottom: 24,
  },
  detailsSection: {
    marginBottom: 24,
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
    alignItems: 'center',
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
  detailsNotes: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actionsSection: {
    marginTop: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
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
