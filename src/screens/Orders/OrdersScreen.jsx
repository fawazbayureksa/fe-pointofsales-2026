import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function OrdersScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Orders</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Order history coming soon
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  subtitle: { marginTop: 8, color: '#666' },
});
