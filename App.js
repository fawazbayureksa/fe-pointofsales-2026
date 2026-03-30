import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, ActivityIndicator, MD3LightTheme } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { navigationRef } from './src/navigation/navigationRef';
import RootNavigator from './src/navigation/RootNavigator';
import useAuthStore from './src/store/authStore';

const queryClient = new QueryClient();

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#5B39C0',
    primaryContainer: '#EDE8FF',
    secondary: '#625B71',
    secondaryContainer: '#E8DEF8',
    background: '#F7F5FF',
    surface: '#FFFFFF',
    surfaceVariant: '#F0EBFF',
    error: '#B00020',
    onPrimary: '#FFFFFF',
    outline: '#CAC4D0',
  },
};

function AppContent() {
  const { initialize, isInitialized } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (!isInitialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <RootNavigator />
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <AppContent />
      </PaperProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
