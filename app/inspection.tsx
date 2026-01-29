
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { authenticatedPost } from '@/utils/api';
import Modal from '@/components/ui/Modal';

type InspectionType = 'departure' | 'return';

interface InspectionItem {
  key: string;
  label: string;
  present: boolean | null;
  photo: string | null;
  comment: string | null;
}

export default function InspectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const shiftId = params.shiftId as string;
  const type = (params.type as InspectionType) || 'departure';

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [items, setItems] = useState<InspectionItem[]>([
    { key: 'trousseSecours', label: 'Trousse de secours', present: null, photo: null, comment: null },
    { key: 'roueSecours', label: 'Roue de secours', present: null, photo: null, comment: null },
    { key: 'extincteur', label: 'Extincteur', present: null, photo: null, comment: null },
    { key: 'boosterBatterie', label: 'Booster batterie', present: null, photo: null, comment: null },
  ]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ visible: boolean; title: string; message: string; type: 'success' | 'error' }>({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  const handleRecordVideo = () => {
    console.log('Recording video...');
    // TODO: Implement video recording with expo-camera
    // For now, simulate video upload
    setVideoUrl('https://example.com/video.mp4');
  };

  const handleTakePhoto = (index: number) => {
    console.log('Taking photo for item:', items[index].label);
    // TODO: Implement photo capture with expo-camera
    // For now, simulate photo upload
    const updatedItems = [...items];
    updatedItems[index].photo = 'https://example.com/photo.jpg';
    setItems(updatedItems);
  };

  const handleTogglePresent = (index: number, present: boolean) => {
    const updatedItems = [...items];
    updatedItems[index].present = present;
    if (present) {
      updatedItems[index].comment = null; // Clear comment if present
    } else {
      updatedItems[index].photo = null; // Clear photo if not present
    }
    setItems(updatedItems);
  };

  const handleCommentChange = (index: number, comment: string) => {
    const updatedItems = [...items];
    updatedItems[index].comment = comment;
    setItems(updatedItems);
  };

  const canSubmit = () => {
    if (!videoUrl) return false;
    
    for (const item of items) {
      if (item.present === null) return false;
      if (item.present && !item.photo) return false;
      if (!item.present && !item.comment) return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) {
      setModal({
        visible: true,
        title: 'Formulaire incomplet',
        message: 'Veuillez remplir tous les champs obligatoires',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        shiftId,
        type,
        videoUrl,
      };

      items.forEach((item) => {
        payload[item.key] = item.present;
        if (item.present) {
          payload[`${item.key}Photo`] = item.photo;
        } else {
          payload[`${item.key}Comment`] = item.comment;
        }
      });

      await authenticatedPost('/api/inspections', payload);
      
      setModal({
        visible: true,
        title: 'Inspection enregistrée',
        message: 'L\'inspection a été enregistrée avec succès',
        type: 'success',
      });

      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Error submitting inspection:', error);
      setModal({
        visible: true,
        title: 'Erreur',
        message: 'Impossible d\'enregistrer l\'inspection',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const title = type === 'departure' ? 'Inspection de départ' : 'Inspection de retour';

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
        }}
      />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vidéo du camion (obligatoire)</Text>
            <TouchableOpacity
              style={[styles.videoButton, videoUrl && styles.videoButtonSuccess]}
              onPress={handleRecordVideo}
            >
              <IconSymbol
                ios_icon_name={videoUrl ? 'checkmark.circle.fill' : 'video.fill'}
                android_material_icon_name={videoUrl ? 'check-circle' : 'videocam'}
                size={24}
                color="#FFFFFF"
              />
              <Text style={styles.videoButtonText}>
                {videoUrl ? 'Vidéo enregistrée' : 'Enregistrer une vidéo'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Éléments de sécurité</Text>
            {items.map((item, index) => (
              <View key={item.key} style={styles.itemCard}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                    style={[styles.toggleButton, item.present === true && styles.toggleButtonActive]}
                    onPress={() => handleTogglePresent(index, true)}
                  >
                    <Text style={[styles.toggleText, item.present === true && styles.toggleTextActive]}>
                      Oui
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleButton, item.present === false && styles.toggleButtonActive]}
                    onPress={() => handleTogglePresent(index, false)}
                  >
                    <Text style={[styles.toggleText, item.present === false && styles.toggleTextActive]}>
                      Non
                    </Text>
                  </TouchableOpacity>
                </View>

                {item.present === true && (
                  <TouchableOpacity
                    style={[styles.photoButton, item.photo && styles.photoButtonSuccess]}
                    onPress={() => handleTakePhoto(index)}
                  >
                    <IconSymbol
                      ios_icon_name={item.photo ? 'checkmark.circle.fill' : 'camera.fill'}
                      android_material_icon_name={item.photo ? 'check-circle' : 'camera'}
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.photoButtonText}>
                      {item.photo ? 'Photo prise' : 'Prendre une photo'}
                    </Text>
                  </TouchableOpacity>
                )}

                {item.present === false && (
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Commentaire obligatoire"
                    placeholderTextColor={colors.grey}
                    value={item.comment || ''}
                    onChangeText={(text) => handleCommentChange(index, text)}
                    multiline
                  />
                )}
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, (!canSubmit() || loading) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Enregistrer l'inspection</Text>
            )}
          </TouchableOpacity>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  videoButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  videoButtonSuccess: {
    backgroundColor: colors.success,
  },
  videoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  itemCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  photoButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoButtonSuccess: {
    backgroundColor: colors.success,
  },
  photoButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  commentInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
