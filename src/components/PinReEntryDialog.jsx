import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Text,
  Button,
  Dialog,
  Portal,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuth from '../hooks/useAuth';

const PIN_LENGTH = 6;

/**
 * Modal that appears when the session has auto-expired (401 + locked: true).
 * Allows re-authentication via PIN without full logout.
 *
 * Props:
 *   visible  {boolean}
 *   onSuccess(): void
 *   onLogout(): void
 */
export default function PinReEntryDialog({ visible, onSuccess, onLogout }) {
  const theme = useTheme();
  const { loginWithPin, isLoading } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) {
      setPin('');
      setError('');
    }
  }, [visible]);

  const handleDigit = (d) => {
    if (pin.length < PIN_LENGTH) {
      setPin((prev) => prev + d);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleSubmit = async () => {
    if (pin.length < PIN_LENGTH) {
      setError('Please enter your 6-digit PIN.');
      return;
    }
    try {
      await loginWithPin(pin);
      setPin('');
      onSuccess();
    } catch (err) {
      setPin('');
      setError(err?.message ?? 'Incorrect PIN. Please try again.');
    }
  };

  const DIGITS = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '⌫'],
  ];

  return (
    <Portal>
      <Dialog visible={visible} dismissable={false} style={styles.dialog}>
        <Dialog.Title style={styles.title}>Session Expired</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodySmall" style={styles.subtitle}>
            Your session has expired. Please enter your PIN to continue.
          </Text>

          {/* PIN dots */}
          <View style={styles.pinRow}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.pinDot,
                  i < pin.length && { backgroundColor: theme.colors.primary },
                ]}
              />
            ))}
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.keypad}>
              {DIGITS.map((row, ri) => (
                <View key={ri} style={styles.keyRow}>
                  {row.map((d, di) => {
                    if (d === '') return <View key={di} style={styles.keyEmpty} />;
                    return (
                      <TouchableOpacity
                        key={di}
                        style={styles.key}
                        onPress={() => {
                          if (d === '⌫') handleBackspace();
                          else handleDigit(d);
                        }}
                        activeOpacity={0.7}
                      >
                        {d === '⌫' ? (
                          <MaterialCommunityIcons name="backspace-outline" size={22} color="#213448" />
                        ) : (
                          <Text style={styles.keyText}>{d}</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </Dialog.Content>

        <Dialog.Actions style={{ justifyContent: 'space-between' }}>
          <Button onPress={onLogout} disabled={isLoading} textColor={theme.colors.error}>
            Log Out
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={isLoading || pin.length < PIN_LENGTH}
            loading={isLoading}
          >
            Unlock
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: { borderRadius: 16 },
  title: { textAlign: 'center', fontWeight: '700' },
  subtitle: { color: '#666', textAlign: 'center', marginBottom: 16 },
  pinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#547792',
    backgroundColor: 'transparent',
  },
  errorText: {
    color: '#B00020',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingWrap: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypad: { marginTop: 8 },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 10,
  },
  key: {
    width: 68,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  keyEmpty: { width: 68, height: 52 },
  keyText: { fontSize: 22, fontWeight: '600', color: '#213448' },
});
