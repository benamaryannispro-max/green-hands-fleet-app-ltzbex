
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  FlatList,
  Modal as RNModal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { authenticatedGet, authenticatedPost, authenticatedPut } from '@/utils/api';
import Modal from '@/components/ui/Modal';

interface Driver {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  isApproved: boolean;
  isActive: boolean;
}

export default function DriverManagementScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'deleted'>('active');
  const [drivers, setDrivers] = useState<{ active: Driver[]; pending: Driver[]; deleted: Driver[] }>({
    active: [],
    pending: [],
    deleted: [],
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDriver, setNewDriver] = useState({ phone: '', firstName: '', lastName: '' });
  const [modal, setModal] = useState<{ visible: boolean; title: string; message: string; type: 'success' | 'error' }>({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const data = await authenticatedGet('/api/users/drivers');
      console.log('Drivers loaded:', data);
      setDrivers(data);
    } catch (error) {
      console.error('Error loading drivers:', error);
      setModal({
        visible: true,
        title: 'Erreur',
        message: 'Impossible de charger la liste des chauffeurs',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDriver = async () => {
    if (!newDriver.phone || !newDriver.firstName || !newDriver.lastName) {
      setModal({
        visible: true,
        title: 'Formulaire incomplet',
        message: 'Veuillez remplir tous les champs',
        type: 'error',
      });
      return;
    }

    try {
      await authenticatedPost('/api/users/drivers', newDriver);
      setModal({
        visible: true,
        title: 'Chauffeur ajouté',
        message: 'Le chauffeur a été ajouté avec succès',
        type: 'success',
      });
      setShowAddModal(false);
      setNewDriver({ phone: '', firstName: '', lastName: '' });
      loadDrivers();
    } catch (error) {
      console.error('Error adding driver:', error);
      setModal({
        visible: true,
        title: 'Erreur',
        message: 'Impossible d\'ajouter le chauffeur',
        type: 'error',
      });
    }
  };

  const handleApprove = async (driverId: string) => {
    try {
      await authenticatedPut(`/api/users/drivers/${driverId}/approve`, {});
      setModal({
        visible: true,
        title: 'Chauffeur approuvé',
        message: 'Le chauffeur a été approuvé avec succès',
        type: 'success',
      });
      loadDrivers();
    } catch (error) {
      console.error('Error approving driver:', error);
      setModal({
        visible: true,
        title: 'Erreur',
        message: 'Impossible d\'approuver le chauffeur',
        type: 'error',
      });
    }
  };

  const handleRevoke = async (driverId: string) => {
    try {
      await authenticatedPut(`/api/users/drivers/${driverId}/revoke`, {});
      setModal({
        visible: true,
        title: 'Accès révoqué',
        message: 'L\'accès du chauffeur a été révoqué',
        type: 'success',
      });
      loadDrivers();
    } catch (error) {
      console.error('Error revoking driver:', error);
      setModal({
        visible: true,
        title: 'Erreur',
        message: 'Impossible de révoquer l\'accès',
        type: 'error',
      });
    }
  };

  const handleRestore = async (driverId: string) => {
    try {
      await authenticatedPut(`/api/users/drivers/${driverId}/restore`, {});
      setModal({
        visible: true,
        title: 'Chauffeur restauré',
        message: 'Le chauffeur a été restauré avec succès',
        type: 'success',
      });
      loadDrivers();
    } catch (error) {
      console.error('Error restoring driver:', error);
      setModal({
        visible: true,
        title: 'Erreur',
        message: 'Impossible de restaurer le chauffeur',
        type: 'error',
      });
    }
  };

  const renderDriver = ({ item }: { item: Driver }) => (
    <View style={styles.driverCard}>
      <View style={styles.driverInfo}>
        <Text style={styles.driverName}>{item.firstName} {item.lastName}</Text>
        <Text style={styles.driverPhone}>{item.phone}</Text>
      </View>
      <View style={styles.driverActions}>
        {activeTab === 'pending' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(item.id)}
          >
            <Text style={styles.actionButtonText}>Approuver</Text>
          </TouchableOpacity>
        )}
        {activeTab === 'active' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.revokeButton]}
            onPress={() => handleRevoke(item.id)}
          >
            <Text style={styles.actionButtonText}>Révoquer</Text>
          </TouchableOpacity>
        )}
        {activeTab === 'deleted' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.restoreButton]}
            onPress={() => handleRestore(item.id)}
          >
            <Text style={styles.actionButtonText}>Restaurer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const currentDrivers = drivers[activeTab];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Gestion des chauffeurs',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
        }}
      />

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Actifs ({drivers.active.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            En attente ({drivers.pending.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'deleted' && styles.tabActive]}
          onPress={() => setActiveTab('deleted')}
        >
          <Text style={[styles.tabText, activeTab === 'deleted' && styles.tabTextActive]}>
            Supprimés ({drivers.deleted.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={currentDrivers}
          renderItem={renderDriver}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun chauffeur dans cette catégorie</Text>
            </View>
          }
        />
      )}

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

      <RNModal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowAddModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Ajouter un chauffeur</Text>
                
                <TextInput
                  style={styles.input}
                  placeholder="Téléphone (+33...)"
                  placeholderTextColor={colors.grey}
                  value={newDriver.phone}
                  onChangeText={(text) => setNewDriver({ ...newDriver, phone: text })}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Prénom"
                  placeholderTextColor={colors.grey}
                  value={newDriver.firstName}
                  onChangeText={(text) => setNewDriver({ ...newDriver, firstName: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nom"
                  placeholderTextColor={colors.grey}
                  value={newDriver.lastName}
                  onChangeText={(text) => setNewDriver({ ...newDriver, lastName: text })}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowAddModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleAddDriver}
                  >
                    <Text style={styles.confirmButtonText}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </RNModal>

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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: 4,
    margin: 16,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  driverCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  driverPhone: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  driverActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: colors.success,
  },
  revokeButton: {
    backgroundColor: colors.error,
  },
  restoreButton: {
    backgroundColor: colors.accent,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
