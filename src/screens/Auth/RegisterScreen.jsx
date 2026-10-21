import React, { useState, useRef } from 'react';
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
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAuth from '../../hooks/useAuth';

const BRAND_NAVY = '#1A2938';
const BRAND_STEEL = '#547792';

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { register, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    business_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const businessNameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const triggerHaptic = (style = 'light') => {
    try {
      if (style === 'medium') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (style === 'error') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (style === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (_) {
      // Ignore on unsupported platforms
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const validate = () => {
    const errors = {};
    const trimmedName = formData.name.trim();
    const trimmedBusiness = formData.business_name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phone.trim();

    if (!trimmedName) {
      errors.name = 'Full name is required';
    } else if (trimmedName.length > 255) {
      errors.name = 'Name must not exceed 255 characters';
    }

    if (trimmedBusiness.length > 255) {
      errors.business_name = 'Business name must not exceed 255 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address';
    } else if (trimmedEmail.length > 255) {
      errors.email = 'Email must not exceed 255 characters';
    }

    if (trimmedPhone.length > 20) {
      errors.phone = 'Phone number must not exceed 20 characters';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!formData.password_confirmation) {
      errors.password_confirmation = 'Please confirm your password';
    } else if (formData.password !== formData.password_confirmation) {
      errors.password_confirmation = 'The password confirmation does not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    Keyboard.dismiss();
    setGeneralError('');

    if (!validate()) {
      triggerHaptic('error');
      return;
    }

    triggerHaptic('medium');

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      password_confirmation: formData.password_confirmation,
    };

    if (formData.business_name.trim()) {
      payload.business_name = formData.business_name.trim();
    }

    if (formData.phone.trim()) {
      payload.phone = formData.phone.trim();
    }

    try {
      await register(payload);
      triggerHaptic('success');
    } catch (err) {
      triggerHaptic('error');
      const hasFieldErrors = err?.errors && Object.keys(err.errors).length > 0;
      if (hasFieldErrors) {
        const mappedErrors = {};
        for (const [key, val] of Object.entries(err.errors)) {
          mappedErrors[key] = Array.isArray(val) ? val[0] : val;
        }
        setFieldErrors(mappedErrors);
      }

      const msg = err?.message || 'Registration failed. Please try again.';
      const fieldErrorValues = hasFieldErrors
        ? Object.values(err.errors).flat()
        : [];
      if (!hasFieldErrors || !fieldErrorValues.includes(msg)) {
        setGeneralError(msg);
      }
      setSnackbar({
        visible: true,
        message: msg,
      });
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
            {/* Top Navigation */}
            <View style={styles.navBar}>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('light');
                  if (navigation?.canGoBack?.()) {
                    navigation.goBack();
                  } else {
                    navigation?.navigate?.('Login');
                  }
                }}
                style={styles.backBtn}
                accessibilityLabel="Go back to login"
                accessibilityRole="button"
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={24}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
              <Text style={styles.navTitle}>Register</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Form Sheet */}
            <Surface style={styles.sheet} elevation={4}>
              <View style={styles.sheetHandle} />

              <View style={styles.form}>
                {/* General Error Banner */}
                {generalError ? (
                  <View style={styles.errorBanner}>
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

                {/* Full Name */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Full Name *</Text>
                  <TextInput
                    placeholder="Budi Santoso"
                    placeholderTextColor="#94A3B8"
                    value={formData.name}
                    onChangeText={(v) => updateField('name', v)}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => businessNameRef.current?.focus()}
                    mode="outlined"
                    error={!!fieldErrors.name}
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                    activeOutlineColor={BRAND_STEEL}
                    outlineColor="#E2E8F0"
                    textColor="#1E293B"
                  />
                  {fieldErrors.name ? (
                    <Text style={styles.errorText}>{fieldErrors.name}</Text>
                  ) : null}
                </View>

                {/* Business Name */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Business Name</Text>
                  <TextInput
                    ref={businessNameRef}
                    placeholder="Kopi Nusantara"
                    placeholderTextColor="#94A3B8"
                    value={formData.business_name}
                    onChangeText={(v) => updateField('business_name', v)}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    mode="outlined"
                    error={!!fieldErrors.business_name}
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                    activeOutlineColor={BRAND_STEEL}
                    outlineColor="#E2E8F0"
                    textColor="#1E293B"
                  />
                  {fieldErrors.business_name ? (
                    <Text style={styles.errorText}>
                      {fieldErrors.business_name}
                    </Text>
                  ) : null}
                </View>

                {/* Email */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Email *</Text>
                  <TextInput
                    ref={emailRef}
                    placeholder="budi@kopinusantara.id"
                    placeholderTextColor="#94A3B8"
                    value={formData.email}
                    onChangeText={(v) => updateField('email', v)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => phoneRef.current?.focus()}
                    mode="outlined"
                    error={!!fieldErrors.email}
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                    activeOutlineColor={BRAND_STEEL}
                    outlineColor="#E2E8F0"
                    textColor="#1E293B"
                  />
                  {fieldErrors.email ? (
                    <Text style={styles.errorText}>{fieldErrors.email}</Text>
                  ) : null}
                </View>

                {/* Phone */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    ref={phoneRef}
                    placeholder="081234567890"
                    placeholderTextColor="#94A3B8"
                    value={formData.phone}
                    onChangeText={(v) => updateField('phone', v)}
                    keyboardType="phone-pad"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    mode="outlined"
                    error={!!fieldErrors.phone}
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                    activeOutlineColor={BRAND_STEEL}
                    outlineColor="#E2E8F0"
                    textColor="#1E293B"
                  />
                  {fieldErrors.phone ? (
                    <Text style={styles.errorText}>{fieldErrors.phone}</Text>
                  ) : null}
                </View>

                {/* Password */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Password *</Text>
                  <TextInput
                    ref={passwordRef}
                    placeholder="At least 8 characters"
                    placeholderTextColor="#94A3B8"
                    value={formData.password}
                    onChangeText={(v) => updateField('password', v)}
                    secureTextEntry={!showPassword}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                    mode="outlined"
                    error={!!fieldErrors.password}
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                    activeOutlineColor={BRAND_STEEL}
                    outlineColor="#E2E8F0"
                    textColor="#1E293B"
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
                  {fieldErrors.password ? (
                    <Text style={styles.errorText}>{fieldErrors.password}</Text>
                  ) : null}
                </View>

                {/* Confirm Password */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Confirm Password *</Text>
                  <TextInput
                    ref={confirmPasswordRef}
                    placeholder="Confirm password"
                    placeholderTextColor="#94A3B8"
                    value={formData.password_confirmation}
                    onChangeText={(v) => updateField('password_confirmation', v)}
                    secureTextEntry={!showConfirmPassword}
                    returnKeyType="go"
                    onSubmitEditing={handleRegister}
                    mode="outlined"
                    error={!!fieldErrors.password_confirmation}
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                    activeOutlineColor={BRAND_STEEL}
                    outlineColor="#E2E8F0"
                    textColor="#1E293B"
                    right={
                      <TextInput.Icon
                        icon={
                          showConfirmPassword
                            ? 'eye-off-outline'
                            : 'eye-outline'
                        }
                        color="#94A3B8"
                        onPress={() => {
                          triggerHaptic('light');
                          setShowConfirmPassword((v) => !v);
                        }}
                      />
                    }
                  />
                  {fieldErrors.password_confirmation ? (
                    <Text style={styles.errorText}>
                      {fieldErrors.password_confirmation}
                    </Text>
                  ) : null}
                </View>

                {/* Submit Button */}
                <Button
                  mode="contained"
                  onPress={handleRegister}
                  disabled={isLoading}
                  style={[styles.btn, isLoading && styles.btnDisabled]}
                  contentStyle={styles.btnContent}
                  labelStyle={styles.btnLabel}
                >
                  {isLoading ? (
                    <View style={styles.btnLoadingRow}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.btnLoadingText}>Creating account…</Text>
                    </View>
                  ) : (
                    'Create Account'
                  )}
                </Button>

                {/* Already have account */}
                <View style={styles.signInRow}>
                  <Text style={styles.signInPrompt}>
                    Already have an account?
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic('light');
                      if (navigation?.canGoBack?.()) {
                        navigation.goBack();
                      } else {
                        navigation?.navigate?.('Login');
                      }
                    }}
                    style={styles.signInBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.signInLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>

                {/* Minimal Footer */}
                <View
                  style={[
                    styles.footer,
                    { paddingBottom: Math.max(insets.bottom, 20) },
                  ]}
                >
                  <Text style={styles.footerVersion}>POS 2026</Text>
                </View>
              </View>
            </Surface>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Global Toast */}
        <Snackbar
          visible={snackbar.visible}
          onDismiss={() => setSnackbar({ visible: false, message: '' })}
          duration={4000}
          style={styles.snackbar}
          action={{
            label: 'OK',
            textColor: '#FFFFFF',
            onPress: () => setSnackbar({ visible: false, message: '' }),
          }}
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
  },

  // Top Nav Bar
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Sheet Card
  sheet: {
    flexGrow: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 8,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },

  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: '500',
    marginRight: 8,
  },
  errorText: {
    color: '#B00020',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    marginLeft: 2,
  },

  // Inputs
  inputWrapper: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginLeft: 2,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    fontSize: 15,
  },
  inputOutline: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },

  // Submit Button
  btn: {
    borderRadius: 10,
    backgroundColor: BRAND_STEEL,
    marginTop: 8,
    elevation: 2,
  },
  btnDisabled: {
    backgroundColor: '#94A3B8',
    elevation: 0,
  },
  btnContent: {
    height: 48,
    justifyContent: 'center',
  },
  btnLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLoadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },

  // Sign In Row
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  signInPrompt: {
    fontSize: 13,
    color: '#64748B',
  },
  signInBtn: {
    marginLeft: 6,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  signInLink: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND_STEEL,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 16,
  },
  footerVersion: {
    fontSize: 12,
    color: '#94A3B8',
  },

  // Snackbar
  snackbar: {
    backgroundColor: BRAND_NAVY,
    borderRadius: 8,
  },
});
