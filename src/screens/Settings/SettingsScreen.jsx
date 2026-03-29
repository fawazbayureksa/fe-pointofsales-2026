import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import useAuthStore from '../../store/authStore';

export default function SettingsScreen() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const user = useAuthStore((s) => s.user);

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Settings</Text>
      {user && (
        <Text variant="bodyMedium" style={styles.subtitle}>
          Logged in as {user.name}
        </Text>
      )}
      <Button mode="outlined" onPress={clearAuth} style={styles.logout}>
        Logout
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  subtitle: { marginTop: 8, color: '#666' },
  logout: { marginTop: 24 },
});
