import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, ActivityIndicator, MD3LightTheme, Snackbar, Portal } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { navigationRef } from './src/navigation/navigationRef';
import RootNavigator from './src/navigation/RootNavigator';
import useAuthStore from './src/store/authStore';
import PinReEntryDialog from './src/components/PinReEntryDialog';
import {
  setSessionLockedHandler,
  setPermissionDeniedHandler,
  setServerErrorHandler,
} from './src/api/client';

const queryClient = new QueryClient();

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#547792',
    primaryContainer: '#C8DCE5',
    secondary: '#213448',
    secondaryContainer: '#ECEFCA',
    background: '#F4F6F8',
    surface: '#FFFFFF',
    surfaceVariant: '#ECEFCA',
    error: '#B00020',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    outline: '#94B4C1',
  },
};

function AppContent() {
  const { initialize, isInitialized, clearAuth } = useAuthStore();

  // Global session lock (401 + locked: true)
  const [sessionLocked, setSessionLocked] = useState(false);

  // Global snackbar for 403 and 500
  const [globalSnack, setGlobalSnack] = useState({ visible: false, message: '' });

  useEffect(() => {
    initialize();

    setSessionLockedHandler(() => setSessionLocked(true));
    setPermissionDeniedHandler((msg) =>
      setGlobalSnack({ visible: true, message: msg })
    );
    setServerErrorHandler((msg) =>
      setGlobalSnack({ visible: true, message: msg })
    );
  }, []);

  const handlePinSuccess = useCallback(() => {
    setSessionLocked(false);
  }, []);

  const handlePinLogout = useCallback(async () => {
    setSessionLocked(false);
    await clearAuth();
  }, [clearAuth]);

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

      <PinReEntryDialog
        visible={sessionLocked}
        onSuccess={handlePinSuccess}
        onLogout={handlePinLogout}
      />

      <Portal>
        <Snackbar
          visible={globalSnack.visible}
          onDismiss={() => setGlobalSnack({ visible: false, message: '' })}
          duration={4000}
        >
          {globalSnack.message}
        </Snackbar>
      </Portal>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <BottomSheetModalProvider>
            <AppContent />
          </BottomSheetModalProvider>
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
