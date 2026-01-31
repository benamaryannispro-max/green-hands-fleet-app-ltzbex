
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

type BatteryType = 'depart' | 'retour';

export default function BatteryRecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const shiftId = params.shiftId as string;
  const type = (params.type as BatteryType) || 'depart';

  const [count, setCount] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [driverSignature, setDriverSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ visible: boolean; title: string; message: string; type: 'success' | 'error' }>({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  const handleTakePhoto = () => {
    console.log('Taking photo...');
    // TODO: Implement photo capture with expo-camera
    // For now, simulate photo upload
    setPhotoUrl('https://example.com/battery-photo.jpg');
  };

  const handleDriverSign = () => {
    console.log('Driver signing...');
    // TODO: Implement signature capture
    // For now, simulate signature
    setDriverSignature('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
  };

  const canSubmit = () => {
    return count && photoUrl && comment && driverSignature;
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
      const payload = {
        shiftId,
        type,
        count: parseInt(count, 10),
        photoUrl,
        comment,
        driverSignature,
      };

      await authenticatedPost('/api/battery-records', payload);
      
      setModal({
        visible: true,
        title: 'Enregistrement réussi',
        message: 'Le nombre de batteries a été enregistré avec succès',
        type: 'success',
      });

      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Error submitting battery record:', error);
      setModal({
        visible: true,
        title: 'Erreur',
        message: 'Impossible d\'enregistrer le nombre de batteries',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const title = type === 'depart' ? 'Batteries au départ' : 'Batteries au retour';

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
          <View style={styles.card}>
            <Text style={styles.label}>Nombre de batteries *</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez le nombre"
              placeholderTextColor={colors.grey}
              value={count}
              onChangeText={setCount}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Photo *</Text>
            <TouchableOpacity
              style={[styles.photoButton, photoUrl && styles.photoButtonSuccess]}
              onPress={handleTakePhoto}
            >
              <IconSymbol
                ios_icon_name={photoUrl ? 'checkmark.circle.fill' : 'camera.fill'}
                android_material_icon_name={photoUrl ? 'check-circle' : 'camera'}
                size={24}
                color="#FFFFFF"
              />
              <Text style={styles.photoButtonText}>
                {photoUrl ? 'Photo prise' : 'Prendre une photo'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Commentaire *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Ajoutez un commentaire"
              placeholderTextColor={colors.grey}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Signature chauffeur *</Text>
            <TouchableOpacity
              style={[styles.signatureButton, driverSignature && styles.signatureButtonSuccess]}
              onPress={handleDriverSign}
            >
              <IconSymbol
                ios_icon_name={driverSignature ? 'checkmark.circle.fill' : 'pencil'}
                android_material_icon_name={driverSignature ? 'check-circle' : 'edit'}
                size={24}
                color="#FFFFFF"
              />
              <Text style={styles.signatureButtonText}>
                {driverSignature ? 'Signé' : 'Signer'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.note}>
            Note: La signature du chef d'équipe sera ajoutée ultérieurement
          </Text>

          <TouchableOpacity
            style={[styles.submitButton, (!canSubmit() || loading) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Enregistrer</Text>
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
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  photoButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  photoButtonSuccess: {
    backgroundColor: colors.success,
  },
  photoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signatureButton: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  signatureButtonSuccess: {
    backgroundColor: colors.success,
  },
  signatureButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
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
