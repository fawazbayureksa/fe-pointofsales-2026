import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { TextInput, Button, Text, Snackbar, Surface } from 'react-native-paper';
import useAuth from '../../hooks/useAuth';

const PRIMARY = '#213448';
const PRIMARY_DARK = '#0F1E2E';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const handleLogin = async () => {
    setEmailError('');
    try {
      await login(email.trim(), password);
    } catch (err) {
      if (err?.errors?.email) {
        const msg = Array.isArray(err.errors.email)
          ? err.errors.email[0]
          : err.errors.email;
        setEmailError(msg);
      } else {
        setSnackbar({
          visible: true,
          message: err?.message ?? 'Login failed. Please try again.',
        });
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Brand header ───────────────────────────────────────────────────── */}
        <View style={styles.brand}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoEmoji}>🏪</Text>
          </View>
          <Text style={styles.appName}>POS 2026</Text>
          <Text style={styles.tagline}>Point of Sales Management</Text>
        </View>

        {/* ── Form sheet ─────────────────────────────────────────────────────── */}
        <Surface style={styles.sheet} elevation={0}>
          <View style={styles.form}>
            <Text variant="headlineSmall" style={styles.formTitle}>
              Welcome back 👋
            </Text>
            <Text variant="bodyMedium" style={styles.formSubtitle}>
              Sign in to your account to continue
            </Text>

            {/* Email */}
            <TextInput
              label="Email address"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              mode="outlined"
              error={!!emailError}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="email-outline" />}
            />
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}

            {/* Password */}
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="lock-outline" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  onPress={() => setShowPassword((v) => !v)}
                />
              }
            />

            {/* Login button */}
            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading || !email.trim() || !password}
              style={styles.btn}
              contentStyle={styles.btnContent}
              labelStyle={styles.btnLabel}
            >
              {isLoading ? 'Signing in…' : 'Sign In'}
            </Button>
          </View>
        </Surface>
      </ScrollView>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={4000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbar({ visible: false, message: '' }),
        }}
      >
        {snackbar.message}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PRIMARY,
  },
  scroll: {
    flexGrow: 1,
  },

  // ── Brand section ────────────────────────────────────────────────────────────
  brand: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 72,
    paddingBottom: 36,
  },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  logoEmoji: {
    fontSize: 44,
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 4,
    letterSpacing: 0.4,
  },

  // ── Form sheet ────────────────────────────────────────────────────────────────
  sheet: {
    flexGrow: 1,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  form: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 48,
  },
  formTitle: {
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 6,
  },
  formSubtitle: {
    color: '#7A7A8C',
    marginBottom: 28,
  },
  input: {
    marginBottom: 4,
    backgroundColor: '#FAFAFA',
  },
  inputOutline: {
    borderRadius: 12,
  },
  errorText: {
    color: '#B00020',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 12,
  },
  btn: {
    marginTop: 28,
    borderRadius: 14,
    backgroundColor: '#547792',
    shadowColor: PRIMARY_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  btnContent: {
    paddingVertical: 8,
  },
  btnLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
