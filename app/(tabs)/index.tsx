
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';

export default function IndexScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      console.log('Loading user data...');
      return;
    }

    if (!user) {
      console.log('No user found, redirecting to login');
      router.replace('/login');
      return;
    }

    console.log('User role:', user.role);

    // Route based on user role
    if (user.role === 'driver') {
      console.log('Routing to driver dashboard');
      router.replace('/driver-dashboard');
    } else if (user.role === 'team_leader' || user.role === 'admin') {
      console.log('Routing to team leader dashboard');
      router.replace('/leader-dashboard');
    } else {
      console.log('Unknown role, staying on index');
    }
  }, [user, loading]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>Chargement...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
  },
});
