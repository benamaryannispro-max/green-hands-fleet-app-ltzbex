
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function LeaderDashboardScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    console.log('User tapped Sign Out button');
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const firstName = user?.firstName || 'Chef';
  const lastName = user?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'GREEN HANDS',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerRight: () => (
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
              <IconSymbol
                ios_icon_name="rectangle.portrait.and.arrow.right"
                android_material_icon_name="logout"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.welcomeText}>Bonjour,</Text>
            <Text style={styles.nameText}>{fullName}</Text>
            <Text style={styles.roleText}>Chef d&apos;équipe</Text>
          </View>

          <View style={styles.menuGrid}>
            <TouchableOpacity style={styles.menuCard}>
              <View style={[styles.menuIconContainer, { backgroundColor: colors.primary }]}>
                <IconSymbol
                  ios_icon_name="book.fill"
                  android_material_icon_name="book"
                  size={32}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.menuTitle}>Journal de bord</Text>
              <Text style={styles.menuDescription}>Historique des shifts</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuCard}
              onPress={() => router.push('/driver-management')}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: colors.accent }]}>
                <IconSymbol
                  ios_icon_name="person.badge.plus"
                  android_material_icon_name="person-add"
                  size={32}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.menuTitle}>Approbation</Text>
              <Text style={styles.menuDescription}>Gérer les chauffeurs</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuCard}>
              <View style={[styles.menuIconContainer, { backgroundColor: colors.secondary }]}>
                <IconSymbol
                  ios_icon_name="qrcode"
                  android_material_icon_name="qr-code-scanner"
                  size={32}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.menuTitle}>Scanner QR</Text>
              <Text style={styles.menuDescription}>Véhicules</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuCard}>
              <View style={[styles.menuIconContainer, { backgroundColor: colors.error }]}>
                <IconSymbol
                  ios_icon_name="wrench.fill"
                  android_material_icon_name="build"
                  size={32}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.menuTitle}>Maintenance</Text>
              <Text style={styles.menuDescription}>Véhicules</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuCard}
              onPress={() => router.push('/fleet-map')}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: colors.success }]}>
                <IconSymbol
                  ios_icon_name="map.fill"
                  android_material_icon_name="map"
                  size={32}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.menuTitle}>Carte flotte</Text>
              <Text style={styles.menuDescription}>Suivi en temps réel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuCard}>
              <View style={[styles.menuIconContainer, { backgroundColor: colors.warning }]}>
                <IconSymbol
                  ios_icon_name="doc.text.fill"
                  android_material_icon_name="description"
                  size={32}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.menuTitle}>Rapports</Text>
              <Text style={styles.menuDescription}>Inspections</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  header: {
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  nameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  roleText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  menuCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    width: '47%',
    minHeight: 140,
  },
  menuIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  signOutButton: {
    marginRight: 16,
  },
});
