import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Dashboard</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Sales overview coming soon
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  subtitle: { marginTop: 8, color: '#666' },
});
