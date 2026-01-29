import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

// GREEN HANDS color palette - professional fleet management theme
export const colors = {
  primary: '#10B981',    // Green for "GREEN HANDS"
  secondary: '#059669',  // Darker Green
  accent: '#F59E0B',     // Amber accent
  background: '#F5F7FA', // Light grey background
  backgroundAlt: '#FFFFFF', // White alternative
  text: '#1A2332',       // Dark text
  textSecondary: '#6B7280', // Grey text
  grey: '#9CA3AF',       // Medium grey
  card: '#FFFFFF',       // White cards
  border: '#E5E7EB',     // Light border
  error: '#EF4444',      // Red for errors
  warning: '#F59E0B',    // Amber for warnings
  success: '#10B981',    // Green for success
  inactive: '#D1D5DB',   // Light grey for inactive
  highlight: '#34D399',  // Light green highlight
};

export const buttonStyles = StyleSheet.create({
  instructionsButton: {
    backgroundColor: colors.primary,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    backgroundColor: colors.backgroundAlt,
    alignSelf: 'center',
    width: '100%',
  },
});

export const commonStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 10
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.grey,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
    width: '100%',
    boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: "white",
  },
});
