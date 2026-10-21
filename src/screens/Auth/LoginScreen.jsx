import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Snackbar,
  Surface,
  Portal,
  Dialog,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAuth from '../../hooks/useAuth';

const REMEMBER_EMAIL_KEY = 'pos_remembered_email';
const REMEMBER_FLAG_KEY = 'pos_remember_email_flag';

// Theme constants
const BRAND_NAVY = '#1A2938';
const BRAND_NAVY_LIGHT = '#213448';
const BRAND_STEEL = '#547792';
const BRAND_ICE = '#C8DCE5';
const BRAND_BORDER = 'rgba(255, 255, 255, 0.15)';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [helpVisible, setHelpVisible] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Load remembered email on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const flag = await AsyncStorage.getItem(REMEMBER_FLAG_KEY);
        if (flag === 'true') {
          const savedEmail = await AsyncStorage.getItem(REMEMBER_EMAIL_KEY);
          if (isMounted) {
            setRememberEmail(true);
            if (savedEmail) setEmail(savedEmail);
          }
        }
      } catch (_) {
        // Non-critical fallback
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const triggerHaptic = (style = 'light') => {
    try {
      if (style === 'medium') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (style === 'error') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (_) {
      // Ignore on unsupported platforms
    }
  };

  const toggleRememberEmail = () => {
    triggerHaptic('light');
    setRememberEmail((prev) => !prev);
  };

  const handleLogin = async () => {
    setEmailError('');
    setGeneralError('');
    Keyboard.dismiss();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Please enter your email address');
      emailInputRef.current?.focus();
      triggerHaptic('error');
      return;
    }
    if (!password) {
      setGeneralError('Please enter your password');
      passwordInputRef.current?.focus();
      triggerHaptic('error');
      return;
    }

    triggerHaptic('medium');

    try {
      await login(trimmedEmail, password);

      // Persist or clear remembered email
      if (rememberEmail) {
        await AsyncStorage.setItem(REMEMBER_FLAG_KEY, 'true');
        await AsyncStorage.setItem(REMEMBER_EMAIL_KEY, trimmedEmail);
      } else {
        await AsyncStorage.removeItem(REMEMBER_FLAG_KEY);
        await AsyncStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
    } catch (err) {
      triggerHaptic('error');
      if (err?.errors?.email) {
        const msg = Array.isArray(err.errors.email)
          ? err.errors.email[0]
          : err.errors.email;
        setEmailError(msg);
      } else {
        const msg = err?.message ?? 'Login failed. Please verify credentials.';
        setGeneralError(msg);
        setSnackbar({
          visible: true,
          message: msg,
        });
      }
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.root}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingTop: Math.max(insets.top, 16) },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* ── Brand Header ─────────────────────────────────────────── */}
            <View style={styles.brand}>

              {/* Logo / Store Icon */}
              <View style={styles.logoOuter}>
                <View style={styles.logoInner}>
                  <MaterialCommunityIcons
                    name="storefront-outline"
                    size={42}
                    color="#FFFFFF"
                  />
                </View>
              </View>

              <Text style={styles.appName}>POS 2026</Text>
              <Text style={styles.tagline}>
                Point of Sale & Enterprise Retail ERP
              </Text>
            </View>

            {/* ── Form Sheet Card ──────────────────────────────────────── */}
            <Surface style={styles.sheet} elevation={4}>
              <View style={styles.sheetHandle} />

              <View style={styles.form}>
                <View style={styles.headingRow}>
                  <View>
                    <Text variant="headlineSmall" style={styles.formTitle}>
                      Welcome back
                    </Text>
                    <Text variant="bodyMedium" style={styles.formSubtitle}>
                      Sign in with your account to begin
                    </Text>
                  </View>
                </View>

                {/* Inline General Error Banner */}
                {generalError ? (
                  <View style={styles.errorBanner}>
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={20}
                      color="#B00020"
                      style={styles.errorBannerIcon}
                    />
                    <Text style={styles.errorBannerText}>{generalError}</Text>
                    <TouchableOpacity
                      onPress={() => setGeneralError('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={18}
                        color="#B00020"
                      />
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* Email Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                  <TextInput
                    ref={emailInputRef}
                    placeholder="cashier@example.com"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={(v) => {
                      setEmail(v);
                      if (emailError) setEmailError('');
                      if (generalError) setGeneralError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    mode="outlined"
                    error={!!emailError}
                    style={styles.input}
                    outlineStyle={[
                      styles.inputOutline,
                      email ? styles.inputOutlineActive : null,
                    ]}
                    activeOutlineColor={BRAND_STEEL}
                    outlineColor="#E2E8F0"
                    textColor="#1E293B"
                    left={
                      <TextInput.Icon
                        icon="email-outline"
                        color={(isFocused) =>
                          isFocused ? BRAND_STEEL : '#94A3B8'
                        }
                      />
                    }
                    right={
                      email.length > 0 ? (
                        <TextInput.Icon
                          icon="close-circle-outline"
                          color="#94A3B8"
                          onPress={() => setEmail('')}
                        />
                      ) : null
                    }
                  />
                  {emailError ? (
                    <View style={styles.errorRow}>
                      <MaterialCommunityIcons
                        name="alert-circle"
                        size={14}
                        color="#B00020"
                      />
                      <Text style={styles.errorText}>{emailError}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Password Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  <TextInput
                    ref={passwordInputRef}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      if (generalError) setGeneralError('');
                    }}
                    secureTextEntry={!showPassword}
                    returnKeyType="go"
                    onSubmitEditing={handleLogin}
                    mode="outlined"
                    style={styles.input}
                    outlineStyle={[
                      styles.inputOutline,
                      password ? styles.inputOutlineActive : null,
                    ]}
                    activeOutlineColor={BRAND_STEEL}
                    outlineColor="#E2E8F0"
                    textColor="#1E293B"
                    left={
                      <TextInput.Icon
                        icon="lock-outline"
                        color={(isFocused) =>
                          isFocused ? BRAND_STEEL : '#94A3B8'
                        }
                      />
                    }
                    right={
                      <TextInput.Icon
                        icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        color="#94A3B8"
                        onPress={() => {
                          triggerHaptic('light');
                          setShowPassword((v) => !v);
                        }}
                      />
                    }
                  />
                </View>

                {/* Options row: Remember Email & Need Help */}
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={styles.rememberOption}
                    onPress={toggleRememberEmail}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={
                        rememberEmail
                          ? 'checkbox-marked'
                          : 'checkbox-blank-outline'
                      }
                      size={20}
                      color={rememberEmail ? BRAND_STEEL : '#94A3B8'}
                    />
                    <Text style={styles.rememberText}>Remember email</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic('light');
                      setHelpVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.helpLink}>Need help?</Text>
                  </TouchableOpacity>
                </View>

                {/* Sign In Button */}
                <Button
                  mode="contained"
                  onPress={handleLogin}
                  disabled={isLoading || !email.trim() || !password}
                  style={[
                    styles.btn,
                    (!email.trim() || !password || isLoading) &&
                      styles.btnDisabled,
                  ]}
                  contentStyle={styles.btnContent}
                  labelStyle={styles.btnLabel}
                >
                  {isLoading ? (
                    <View style={styles.btnLoadingRow}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.btnLoadingText}>
                        Authenticating…
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.btnLabelRow}>
                      <Text style={styles.btnLabel}>Sign In</Text>
                      <MaterialCommunityIcons
                        name="arrow-right"
                        size={18}
                        color="#FFFFFF"
                        style={styles.btnIcon}
                      />
                    </View>
                  )}
                </Button>

                {/* ── Register / Free Trial Link ─────────────────────────────── */}
                <View style={styles.registerContainer}>
                  <Text style={styles.registerPrompt}>
                    New to POS 2026?
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic('light');
                      navigation?.navigate?.('Register');
                    }}
                    style={styles.registerBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.registerLink}>Start 14-day free trial</Text>
                    <MaterialCommunityIcons
                      name="arrow-right"
                      size={16}
                      color={BRAND_STEEL}
                      style={{ marginLeft: 3 }}
                    />
                  </TouchableOpacity>
                </View>

                {/* Footer Version */}
                <View
                  style={[
                    styles.footer,
                    { paddingBottom: Math.max(insets.bottom, 20) },
                  ]}
                >
                  <Text style={styles.footerVersion}>POS 2026 • v1.0.1</Text>
                </View>
              </View>
            </Surface>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* ── Supervisor Help Dialog ───────────────────────────────────── */}
        <Portal>
          <Dialog
            visible={helpVisible}
            onDismiss={() => setHelpVisible(false)}
            style={styles.dialog}
          >
            <View style={styles.dialogIconWrap}>
              <MaterialCommunityIcons
                name="shield-account-outline"
                size={36}
                color={BRAND_STEEL}
              />
            </View>
            <Dialog.Title style={styles.dialogTitle}>
              Staff Account Assistance
            </Dialog.Title>
            <Dialog.Content>
              <Text style={styles.dialogText}>
                For terminal security and store compliance, cashier and manager
                accounts are managed directly by your Store Administrator.
              </Text>
              <View style={styles.dialogTipBox}>
                <MaterialCommunityIcons
                  name="information"
                  size={18}
                  color={BRAND_STEEL}
                  style={{ marginRight: 8, marginTop: 1 }}
                />
                <Text style={styles.dialogTipText}>
                  Please contact your Shift Supervisor or Store IT Desk to reset
                  passwords or unlock PIN sessions.
                </Text>
              </View>
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                mode="text"
                textColor={BRAND_STEEL}
                onPress={() => setHelpVisible(false)}
              >
                Understood
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* ── Global Snackbar ─────────────────────────────────────────── */}
        <Snackbar
          visible={snackbar.visible}
          onDismiss={() => setSnackbar({ visible: false, message: '' })}
          duration={4000}
          action={{
            label: 'Dismiss',
            onPress: () => setSnackbar({ visible: false, message: '' }),
          }}
          style={styles.snackbar}
        >
          {snackbar.message}
        </Snackbar>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND_NAVY,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },

  // ── Decorative Ambient Shapes ──────────────────────────────────────────────
  ambientCircleLarge: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(84, 119, 146, 0.18)',
  },
  ambientCircleSmall: {
    position: 'absolute',
    top: 100,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(200, 220, 229, 0.08)',
  },

  // ── Brand Section ──────────────────────────────────────────────────────────
  brand: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 20,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 7,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
    letterSpacing: 0.8,
  },
  logoOuter: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: BRAND_BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  logoInner: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: BRAND_STEEL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500',
    color: BRAND_ICE,
    marginTop: 4,
    letterSpacing: 0.3,
  },

  // ── Form Sheet Card ────────────────────────────────────────────────────────
  sheet: {
    flexGrow: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  form: {
    paddingHorizontal: 26,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
  },
  securityBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Error Banner ───────────────────────────────────────────────────────────
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorBannerIcon: {
    marginRight: 10,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: '500',
  },

  // ── Input Fields ───────────────────────────────────────────────────────────
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    backgroundColor: '#F8FAFC',
    fontSize: 15,
  },
  inputOutline: {
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
  },
  inputOutlineActive: {
    borderColor: BRAND_STEEL,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 4,
  },
  errorText: {
    color: '#B00020',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },

  // ── Options Row ────────────────────────────────────────────────────────────
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 22,
    paddingHorizontal: 2,
  },
  rememberOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberText: {
    fontSize: 13,
    color: '#475569',
    marginLeft: 8,
    fontWeight: '500',
  },
  helpLink: {
    fontSize: 13,
    color: BRAND_STEEL,
    fontWeight: '600',
  },

  // ── Submit Button ──────────────────────────────────────────────────────────
  btn: {
    borderRadius: 14,
    backgroundColor: BRAND_STEEL,
    shadowColor: BRAND_STEEL,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  btnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.1,
    elevation: 0,
  },
  btnContent: {
    height: 52,
    justifyContent: 'center',
  },
  btnLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  btnIcon: {
    marginLeft: 8,
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLoadingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 10,
  },

  // ── Register Link Container ────────────────────────────────────────────────
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    flexWrap: 'wrap',
  },
  registerPrompt: {
    fontSize: 13,
    color: '#64748B',
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND_STEEL,
  },

  // ── Footer ─────────────────────────────────────────────────────────────────
  footer: {
    alignItems: 'center',
    marginTop: 28,
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 6,
    fontWeight: '500',
  },
  footerVersion: {
    fontSize: 11,
    color: '#94A3B8',
    letterSpacing: 0.3,
  },

  // ── Help Dialog ────────────────────────────────────────────────────────────
  dialog: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
  },
  dialogIconWrap: {
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EEF2F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  dialogTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },
  dialogText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 14,
  },
  dialogTipBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
  },
  dialogTipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#334155',
  },

  // ── Snackbar ───────────────────────────────────────────────────────────────
  snackbar: {
    backgroundColor: BRAND_NAVY_LIGHT,
    borderRadius: 10,
  },
});
