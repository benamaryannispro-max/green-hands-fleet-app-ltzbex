
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import Modal from '@/components/ui/Modal';
import { authenticatedGet, authenticatedPut } from '@/utils/api';

interface Alert {
  id: string;
  type: 'driver_pending' | 'inspection_failed' | 'battery_mismatch' | 'safety_item_missing' | 'repair_completed';
  title: string;
  message: string;
  payload: any;
  createdAt: string;
  readAt: string | null;
}

export default function AlertsCenterScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, selectedType]);

  const loadAlerts = async () => {
    console.log('[AlertsCenter] Loading alerts...');
    try {
      setLoading(true);
      const data = await authenticatedGet<Alert[]>('/api/alerts');
      console.log('[AlertsCenter] Alerts loaded:', data.length);
      setAlerts(data);
    } catch (err: any) {
      console.error('[AlertsCenter] Error loading alerts:', err);
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const filterAlerts = () => {
    if (selectedType === 'all') {
      setFilteredAlerts(alerts);
    } else {
      const filtered = alerts.filter(alert => alert.type === selectedType);
      setFilteredAlerts(filtered);
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    console.log('[AlertsCenter] Marking alert as read:', alertId);
    try {
      await authenticatedPost(`/api/alerts/${alertId}/read`, {});
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, readAt: new Date().toISOString() } : alert
      ));
    } catch (err: any) {
      console.error('[AlertsCenter] Error marking alert as read:', err);
    }
  };

  const handleAlertPress = (alert: Alert) => {
    setSelectedAlert(alert);
    if (!alert.readAt) {
      handleMarkAsRead(alert.id);
    }
  };

  const getAlertIcon = (type: string) => {
    const iconMap = {
      driver_pending: { ios: 'person.badge.plus', android: 'person-add', color: colors.accent },
      inspection_failed: { ios: 'exclamationmark.triangle.fill', android: 'warning', color: colors.error },
      battery_mismatch: { ios: 'battery.25', android: 'battery-alert', color: colors.warning },
      safety_item_missing: { ios: 'shield.slash.fill', android: 'error', color: colors.error },
      repair_completed: { ios: 'checkmark.circle.fill', android: 'check-circle', color: colors.success },
    };
    const iconData = iconMap[type as keyof typeof iconMap] || { ios: 'bell.fill', android: 'notifications', color: colors.grey };
    return iconData;
  };

  const getAlertTypeLabel = (type: string) => {
    const labelMap = {
      driver_pending: 'Chauffeur en attente',
      inspection_failed: 'Inspection échouée',
      battery_mismatch: 'Batteries manquantes',
      safety_item_missing: 'Équipement manquant',
      repair_completed: 'Réparation terminée',
    };
    return labelMap[type as keyof typeof labelMap] || type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'À l\'instant';
    }
    if (diffMins < 60) {
      const minsText = diffMins === 1 ? 'minute' : 'minutes';
      return `Il y a ${diffMins} ${minsText}`;
    }
    if (diffHours < 24) {
      const hoursText = diffHours === 1 ? 'heure' : 'heures';
      return `Il y a ${diffHours} ${hoursText}`;
    }
    if (diffDays < 7) {
      const daysText = diffDays === 1 ? 'jour' : 'jours';
      return `Il y a ${diffDays} ${daysText}`;
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const unreadCount = alerts.filter(a => !a.readAt).length;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Centre d\'alertes',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerBackTitle: 'Retour',
        }}
      />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des alertes...</Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{alerts.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: colors.error }]}>{unreadCount}</Text>
                <Text style={styles.statLabel}>Non lues</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <TouchableOpacity
                style={[styles.filterChip, selectedType === 'all' && styles.filterChipActive]}
                onPress={() => setSelectedType('all')}
              >
                <Text style={[styles.filterChipText, selectedType === 'all' && styles.filterChipTextActive]}>
                  Toutes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, selectedType === 'driver_pending' && styles.filterChipActive]}
                onPress={() => setSelectedType('driver_pending')}
              >
                <Text style={[styles.filterChipText, selectedType === 'driver_pending' && styles.filterChipTextActive]}>
                  Chauffeurs
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, selectedType === 'inspection_failed' && styles.filterChipActive]}
                onPress={() => setSelectedType('inspection_failed')}
              >
                <Text style={[styles.filterChipText, selectedType === 'inspection_failed' && styles.filterChipTextActive]}>
                  Inspections
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, selectedType === 'battery_mismatch' && styles.filterChipActive]}
                onPress={() => setSelectedType('battery_mismatch')}
              >
                <Text style={[styles.filterChipText, selectedType === 'battery_mismatch' && styles.filterChipTextActive]}>
                  Batteries
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, selectedType === 'safety_item_missing' && styles.filterChipActive]}
                onPress={() => setSelectedType('safety_item_missing')}
              >
                <Text style={[styles.filterChipText, selectedType === 'safety_item_missing' && styles.filterChipTextActive]}>
                  Sécurité
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, selectedType === 'repair_completed' && styles.filterChipActive]}
                onPress={() => setSelectedType('repair_completed')}
              >
                <Text style={[styles.filterChipText, selectedType === 'repair_completed' && styles.filterChipTextActive]}>
                  Réparations
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <ScrollView
            style={styles.scrollView}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {filteredAlerts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol
                  ios_icon_name="bell.slash.fill"
                  android_material_icon_name="notifications-off"
                  size={64}
                  color={colors.grey}
                />
                <Text style={styles.emptyText}>Aucune alerte</Text>
              </View>
            ) : (
              <View style={styles.alertsList}>
                {filteredAlerts.map((alert) => {
                  const iconData = getAlertIcon(alert.type);
                  const timeText = formatDate(alert.createdAt);
                  const isUnread = !alert.readAt;

                  return (
                    <TouchableOpacity
                      key={alert.id}
                      style={[styles.alertCard, isUnread && styles.alertCardUnread]}
                      onPress={() => handleAlertPress(alert)}
                    >
                      <View style={[styles.alertIconContainer, { backgroundColor: iconData.color }]}>
                        <IconSymbol
                          ios_icon_name={iconData.ios}
                          android_material_icon_name={iconData.android}
                          size={24}
                          color="#FFFFFF"
                        />
                      </View>
                      <View style={styles.alertContent}>
                        <View style={styles.alertHeader}>
                          <Text style={styles.alertType}>{getAlertTypeLabel(alert.type)}</Text>
                          {isUnread && <View style={styles.unreadDot} />}
                        </View>
                        <Text style={styles.alertTitle}>{alert.title}</Text>
                        <Text style={styles.alertMessage} numberOfLines={2}>
                          {alert.message}
                        </Text>
                        <Text style={styles.alertTime}>{timeText}</Text>
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
        visible={selectedAlert !== null}
        onClose={() => setSelectedAlert(null)}
        title={selectedAlert ? getAlertTypeLabel(selectedAlert.type) : ''}
      >
        {selectedAlert && (
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedAlert.title}</Text>
            <Text style={styles.modalMessage}>{selectedAlert.message}</Text>
            <Text style={styles.modalTime}>{formatDate(selectedAlert.createdAt)}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setSelectedAlert(null)}
            >
              <Text style={styles.modalButtonText}>Fermer</Text>
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
  header: {
    backgroundColor: colors.card,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  filterScroll: {
    paddingHorizontal: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  alertsList: {
    padding: 20,
  },
  alertCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertCardUnread: {
    borderColor: colors.primary,
    borderWidth: 2,
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
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertType: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    marginLeft: 8,
  },
  alertTitle: {
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
  alertTime: {
    fontSize: 12,
    color: colors.grey,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 24,
  },
  modalTime: {
    fontSize: 14,
    color: colors.grey,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  modalButtonText: {
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
