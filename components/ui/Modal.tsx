
import React, { ReactNode } from 'react';
import {
  View,
  Text,
  Modal as RNModal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

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
  const isConfirm = type === 'confirm';
  const hasChildren = !!children;
  
  const getIconColor = () => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  // If children are provided, render a custom modal layout
  if (hasChildren) {
    return (
      <RNModal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.customModalContainer}>
                <View style={styles.customHeader}>
                  <Text style={styles.customTitle}>{title}</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <IconSymbol
                      ios_icon_name="xmark"
                      android_material_icon_name="close"
                      size={24}
                      color={colors.text}
                    />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.customContent}>
                  {children}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </RNModal>
    );
  }

  // Default modal with message and buttons
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
            <View style={styles.modalContainer}>
              <View style={[styles.iconContainer, { backgroundColor: getIconColor() }]}>
                <Text style={styles.iconText}>
                  {type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}
                </Text>
              </View>
              
              <Text style={styles.title}>{title}</Text>
              {message && <Text style={styles.message}>{message}</Text>}

              <View style={styles.buttonContainer}>
                {isConfirm && (
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={onClose}
                  >
                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton, { backgroundColor: getIconColor() }]}
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmButtonText}>{confirmText}</Text>
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
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  customModalContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  customTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  customContent: {
    flex: 1,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
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
