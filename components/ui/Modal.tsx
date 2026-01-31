
import {
  View,
  Text,
  Modal as RNModal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import React, { ReactNode } from 'react';
import { colors } from '@/styles/commonStyles';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  children?: ReactNode;
  type?: 'info' | 'success' | 'error' | 'warning' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}

export default function Modal({
  visible,
  onClose,
  title,
  message,
  children,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Annuler',
  onConfirm,
}: ModalProps) {
  const getIconColor = () => {
    const iconColorValue = type === 'success' ? colors.success : type === 'error' ? colors.error : type === 'warning' ? colors.warning : colors.primary;
    return iconColorValue;
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const iconColor = getIconColor();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modal}>
              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
                <IconSymbol
                  ios_icon_name={
                    type === 'success'
                      ? 'checkmark.circle.fill'
                      : type === 'error'
                      ? 'xmark.circle.fill'
                      : type === 'warning'
                      ? 'exclamationmark.triangle.fill'
                      : 'info.circle.fill'
                  }
                  android_material_icon_name={
                    type === 'success'
                      ? 'check-circle'
                      : type === 'error'
                      ? 'error'
                      : type === 'warning'
                      ? 'warning'
                      : 'info'
                  }
                  size={48}
                  color={iconColor}
                />
              </View>

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Message or Children */}
              <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentScrollContainer}>
                {message ? (
                  <Text style={styles.message}>{message}</Text>
                ) : (
                  children
                )}
              </ScrollView>

              {/* Buttons */}
              <View style={styles.buttons}>
                {type === 'confirm' && (
                  <TouchableOpacity
                    style={[styles.button, styles.buttonSecondary]}
                    onPress={onClose}
                  >
                    <Text style={styles.buttonTextSecondary}>{cancelText}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleConfirm}
                >
                  <Text style={styles.buttonTextPrimary}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.3)',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  contentScroll: {
    maxHeight: 300,
  },
  contentScrollContainer: {
    paddingBottom: 8,
  },
  message: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonTextPrimary: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
