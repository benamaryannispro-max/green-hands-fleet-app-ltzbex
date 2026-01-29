
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
import { authenticatedGet } from '@/utils/api';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

interface FailedInspection {
  inspectionId: string;
  shiftId: string;
  driverId: string;
  driverName: string;
  type: 'depart' | 'retour';
  createdAt: string;
  failedItems: Array<{
    itemName: string;
    comment: string;
    photoUrl: string | null;
  }>;
  videoUrl: string | null;
}

export default function ReportsScreen() {
  const router = useRouter();
  const [inspections, setInspections] = useState<FailedInspection[]>([]);
  const [filteredInspections, setFilteredInspections] = useState<FailedInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedInspection, setSelectedInspection] = useState<FailedInspection | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    driverId: '',
  });

  useEffect(() => {
    loadInspections();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [inspections, filters]);

  const loadInspections = async () => {
    console.log('[Reports] Loading failed inspections...');
    try {
      setLoading(true);
      
      const startDateStr = filters.startDate.toISOString();
      const endDateStr = filters.endDate.toISOString();
      const driverParam = filters.driverId ? `&driverId=${filters.driverId}` : '';
      
      const data = await authenticatedGet<FailedInspection[]>(
        `/api/reports/failed-inspections?startDate=${startDateStr}&endDate=${endDateStr}${driverParam}`
      );
      console.log('[Reports] Failed inspections loaded:', data.length);
      setInspections(data);
    } catch (err: any) {
      console.error('[Reports] Error loading failed inspections:', err);
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInspections();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = [...inspections];

    if (filters.driverId) {
      filtered = filtered.filter(inspection => inspection.driverId === filters.driverId);
    }

    setFilteredInspections(filtered);
  };

  const handleExport = async () => {
    console.log('[Reports] Exporting failed inspections report...');
    try {
      const startDateStr = filters.startDate.toISOString();
      const endDateStr = filters.endDate.toISOString();
      const driverParam = filters.driverId ? `&driverId=${filters.driverId}` : '';
      
      const data = await authenticatedGet<{ data: FailedInspection[]; exportedAt: string }>(
        `/api/reports/failed-inspections/export?startDate=${startDateStr}&endDate=${endDateStr}${driverParam}`
      );
      console.log('[Reports] Report exported:', data);
      setError('Rapport exporté avec succès');
    } catch (err: any) {
      console.error('[Reports] Error exporting report:', err);
      setError(err.message || 'Erreur de connexion');
    }
  };

  const showStartDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: filters.startDate,
        onChange: (event, selectedDate) => {
          if (selectedDate) {
            setFilters({ ...filters, startDate: selectedDate });
          }
        },
        mode: 'date',
      });
    }
  };

  const showEndDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: filters.endDate,
        onChange: (event, selectedDate) => {
          if (selectedDate) {
            setFilters({ ...filters, endDate: selectedDate });
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
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const formatDateShort = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Rapports d\'inspections',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerBackTitle: 'Retour',
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={() => setShowFilters(true)} style={styles.headerButton}>
                <IconSymbol
                  ios_icon_name="line.3.horizontal.decrease.circle"
                  android_material_icon_name="filter-list"
                  size={24}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleExport} style={styles.headerButton}>
                <IconSymbol
                  ios_icon_name="square.and.arrow.up"
                  android_material_icon_name="file-download"
                  size={24}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des rapports...</Text>
        </View>
      ) : (
        <>
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{filteredInspections.length}</Text>
              <Text style={styles.statLabel}>Inspections échouées</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {filteredInspections.reduce((sum, i) => sum + i.failedItems.length, 0)}
              </Text>
              <Text style={styles.statLabel}>Éléments manquants</Text>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {filteredInspections.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={64}
                  color={colors.success}
                />
                <Text style={styles.emptyText}>Aucune inspection échouée</Text>
                <Text style={styles.emptySubtext}>Toutes les inspections sont conformes</Text>
              </View>
            ) : (
              <View style={styles.content}>
                {filteredInspections.map((inspection) => {
                  const dateText = formatDate(inspection.createdAt);
                  const typeText = inspection.type === 'depart' ? 'Départ' : 'Retour';
                  const itemCount = inspection.failedItems.length;
                  const itemText = itemCount === 1 ? 'élément' : 'éléments';

                  return (
                    <TouchableOpacity
                      key={inspection.inspectionId}
                      style={styles.inspectionCard}
                      onPress={() => setSelectedInspection(inspection)}
                    >
                      <View style={styles.inspectionHeader}>
                        <View style={styles.inspectionIconContainer}>
                          <IconSymbol
                            ios_icon_name="exclamationmark.triangle.fill"
                            android_material_icon_name="warning"
                            size={24}
                            color={colors.error}
                          />
                        </View>
                        <View style={styles.inspectionInfo}>
                          <Text style={styles.inspectionDriver}>{inspection.driverName}</Text>
                          <Text style={styles.inspectionType}>{typeText}</Text>
                        </View>
                        <View style={styles.inspectionBadge}>
                          <Text style={styles.inspectionBadgeText}>{itemCount}</Text>
                          <Text style={styles.inspectionBadgeText}>{itemText}</Text>
                        </View>
                      </View>
                      <View style={styles.inspectionFooter}>
                        <IconSymbol
                          ios_icon_name="clock.fill"
                          android_material_icon_name="schedule"
                          size={16}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.inspectionDate}>{dateText}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </>
      )}

      <Modal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtres"
      >
        <View style={styles.filtersModal}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Date de début</Text>
            <TouchableOpacity style={styles.dateButton} onPress={showStartDatePicker}>
              <Text style={styles.dateText}>{formatDateShort(filters.startDate)}</Text>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar-today"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Date de fin</Text>
            <TouchableOpacity style={styles.dateButton} onPress={showEndDatePicker}>
              <Text style={styles.dateText}>{formatDateShort(filters.endDate)}</Text>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar-today"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>ID Chauffeur (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={filters.driverId}
              onChangeText={(text) => setFilters({ ...filters, driverId: text })}
              placeholder="Filtrer par chauffeur"
            />
          </View>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => {
              setShowFilters(false);
              loadInspections();
            }}
          >
            <Text style={styles.applyButtonText}>Appliquer les filtres</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        visible={selectedInspection !== null}
        onClose={() => setSelectedInspection(null)}
        title="Détails de l'inspection"
      >
        {selectedInspection && (
          <ScrollView style={styles.detailsModal}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsDriver}>{selectedInspection.driverName}</Text>
              <Text style={styles.detailsType}>
                {selectedInspection.type === 'depart' ? 'Inspection de départ' : 'Inspection de retour'}
              </Text>
              <Text style={styles.detailsDate}>{formatDate(selectedInspection.createdAt)}</Text>
            </View>

            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Éléments manquants</Text>
              {selectedInspection.failedItems.map((item, index) => (
                <View key={index} style={styles.failedItem}>
                  <View style={styles.failedItemHeader}>
                    <IconSymbol
                      ios_icon_name="xmark.circle.fill"
                      android_material_icon_name="cancel"
                      size={20}
                      color={colors.error}
                    />
                    <Text style={styles.failedItemName}>{item.itemName}</Text>
                  </View>
                  {item.comment && (
                    <Text style={styles.failedItemComment}>{item.comment}</Text>
                  )}
                  {item.photoUrl && (
                    <View style={styles.photoIndicator}>
                      <IconSymbol
                        ios_icon_name="photo.fill"
                        android_material_icon_name="photo"
                        size={16}
                        color={colors.primary}
                      />
                      <Text style={styles.photoText}>Photo disponible</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {selectedInspection.videoUrl && (
              <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>Vidéo</Text>
                <View style={styles.videoIndicator}>
                  <IconSymbol
                    ios_icon_name="video.fill"
                    android_material_icon_name="videocam"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.videoText}>Vidéo disponible</Text>
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </Modal>

      <Modal visible={error !== ''} onClose={() => setError('')} title={error.includes('succès') ? 'Succès' : 'Erreur'}>
        <Text style={[styles.messageText, error.includes('succès') ? { color: colors.success } : { color: colors.error }]}>
          {error}
        </Text>
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
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
    marginRight: 16,
  },
  headerButton: {
    padding: 4,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.error,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
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
  inspectionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  inspectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inspectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inspectionInfo: {
    flex: 1,
  },
  inspectionDriver: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  inspectionType: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  inspectionBadge: {
    backgroundColor: colors.error,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  inspectionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  inspectionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inspectionDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  filtersModal: {
    padding: 20,
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
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailsModal: {
    maxHeight: 500,
  },
  detailsHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailsDriver: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  detailsType: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  detailsDate: {
    fontSize: 14,
    color: colors.grey,
  },
  detailsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  failedItem: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  failedItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  failedItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  failedItemComment: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  photoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  photoText: {
    fontSize: 12,
    color: colors.primary,
  },
  videoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  videoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  messageText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
