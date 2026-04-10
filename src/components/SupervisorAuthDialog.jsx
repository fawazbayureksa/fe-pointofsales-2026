import React, { useState, useRef } from 'react';
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
import { supervisorAuthorize } from '../api/supervisor';

const MAX_ATTEMPTS = 3;
const PIN_LENGTH = 6;

/**
 * Reusable Supervisor Auth Dialog.
 *
 * Props:
 *   visible  {boolean}
 *   action   {'refund'|'void'|'discount_override'}
 *   onSuccess(supervisorId: number, supervisorName: string): void
 *   onCancel(): void
 */
export default function SupervisorAuthDialog({ visible, action, onSuccess, onCancel }) {
  const theme = useTheme();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);

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

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleSubmit = async () => {
    if (pin.length < PIN_LENGTH) {
      setError('Please enter a 6-digit PIN.');
      return;
    }
    setLoading(true);
    try {
      const result = await supervisorAuthorize({ pin, action });
      if (result.authorized) {
        // reset state before calling success
        setPin('');
        setError('');
        setAttempts(0);
        onSuccess(result.supervisor_id, result.supervisor);
      }
    } catch (err) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin('');

      if (err?.status === 403) {
        setError('Supervisor does not have permission for this action.');
      } else if (newAttempts >= MAX_ATTEMPTS) {
        setError('Too many failed attempts.');
        setTimeout(() => {
          setPin('');
          setError('');
          setAttempts(0);
          onCancel();
        }, 1500);
      } else {
        setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setPin('');
    setError('');
    setAttempts(0);
    onCancel();
  };

  const DIGITS = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '⌫'],
  ];

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleCancel} style={styles.dialog}>
        <Dialog.Title style={styles.title}>Supervisor PIN Required</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodySmall" style={styles.subtitle}>
            This action requires supervisor authorization.
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

          {/* Error */}
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {/* Keypad */}
          {loading ? (
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

        <Dialog.Actions>
          <Button onPress={handleCancel} disabled={loading}>Cancel</Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={loading || pin.length < PIN_LENGTH}
            loading={loading}
          >
            Verify
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
