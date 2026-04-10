import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Snackbar,
  useTheme,
  Switch,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCreateCustomer, useUpdateCustomer, useCustomer } from '../../hooks/useCustomers';

const GENDER_OPTIONS = ['Male', 'Female'];
const TIER_OPTIONS = ['Regular', 'Silver', 'Gold', 'Platinum'];

function FieldError({ errors, field }) {
  const msgs = errors?.[field];
  if (!msgs) return null;
  return (
    <Text style={styles.errorText}>
      {Array.isArray(msgs) ? msgs[0] : msgs}
    </Text>
  );
}

function PickerRow({ label, value, options, onSelect }) {
  return (
    <View style={styles.pickerContainer}>
      <Text variant="labelMedium" style={styles.label}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[
              styles.optionBtn,
              value === opt && styles.optionBtnActive,
            ]}
            onPress={() => onSelect(value === opt ? null : opt)}
          >
            <Text style={[styles.optionText, value === opt && styles.optionTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function CustomerFormScreen({ route, navigation }) {
  const theme = useTheme();
  const { customerId } = route.params ?? {};
  const isEditing = !!customerId;

  const { data: existing, isLoading: loadingExisting } = useCustomer(customerId);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    gender: null,
    date_of_birth: '',
    notes: '',
    membership_tier: null,
    member_since: '',
    is_member: false,
  });
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name ?? '',
        email: existing.email ?? '',
        phone: existing.phone ?? '',
        gender: existing.gender ?? null,
        date_of_birth: existing.date_of_birth ?? '',
        notes: existing.notes ?? '',
        membership_tier: existing.membership_tier ?? null,
        member_since: existing.member_since ?? '',
        is_member: !!existing.member_since,
      });
    }
  }, [existing]);

  const setField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async () => {
    setErrors({});
    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      gender: form.gender || undefined,
      date_of_birth: form.date_of_birth.trim() || undefined,
      notes: form.notes.trim() || undefined,
      membership_tier: form.membership_tier || undefined,
      member_since: form.is_member && form.member_since ? form.member_since.trim() : undefined,
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: customerId, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigation.goBack();
    } catch (err) {
      if (err?.errors) setErrors(err.errors);
      else setSnackbar({ visible: true, message: err?.message ?? 'Save failed.' });
    }
  };

  if (isEditing && loadingExisting) {
    return (
      <View style={styles.center}>
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Basic info */}
        <Text variant="labelLarge" style={styles.sectionTitle}>Basic Information</Text>

        <TextInput
          label="Name *"
          value={form.name}
          onChangeText={(v) => setField('name', v)}
          mode="outlined"
          style={styles.input}
          error={!!errors.name}
        />
        <FieldError errors={errors} field="name" />

        <TextInput
          label="Email"
          value={form.email}
          onChangeText={(v) => setField('email', v)}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          error={!!errors.email}
        />
        <FieldError errors={errors} field="email" />

        <TextInput
          label="Phone"
          value={form.phone}
          onChangeText={(v) => setField('phone', v)}
          mode="outlined"
          keyboardType="phone-pad"
          style={styles.input}
          error={!!errors.phone}
        />
        <FieldError errors={errors} field="phone" />

        <PickerRow
          label="Gender"
          value={form.gender}
          options={GENDER_OPTIONS}
          onSelect={(v) => setField('gender', v)}
        />
        <FieldError errors={errors} field="gender" />

        <TextInput
          label="Date of Birth (YYYY-MM-DD)"
          value={form.date_of_birth}
          onChangeText={(v) => setField('date_of_birth', v)}
          mode="outlined"
          placeholder="e.g. 1990-05-20"
          style={styles.input}
          error={!!errors.date_of_birth}
        />
        <FieldError errors={errors} field="date_of_birth" />

        <TextInput
          label="Notes"
          value={form.notes}
          onChangeText={(v) => setField('notes', v)}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        <Divider style={styles.divider} />

        {/* Membership */}
        <Text variant="labelLarge" style={styles.sectionTitle}>Membership</Text>

        <View style={styles.switchRow}>
          <Text variant="bodyMedium">Register as Member</Text>
          <Switch
            value={form.is_member}
            onValueChange={(v) => setField('is_member', v)}
            color={theme.colors.primary}
          />
        </View>

        {form.is_member && (
          <>
            <TextInput
              label="Member Since (YYYY-MM-DD)"
              value={form.member_since}
              onChangeText={(v) => setField('member_since', v)}
              mode="outlined"
              placeholder="e.g. 2024-01-01"
              style={styles.input}
              error={!!errors.member_since}
            />
            <FieldError errors={errors} field="member_since" />

            <PickerRow
              label="Membership Tier"
              value={form.membership_tier}
              options={TIER_OPTIONS}
              onSelect={(v) => setField('membership_tier', v)}
            />
            <FieldError errors={errors} field="membership_tier" />
          </>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isPending}
          disabled={isPending || !form.name.trim()}
          style={styles.submitBtn}
          contentStyle={styles.submitContent}
          labelStyle={{ fontSize: 15, fontWeight: '700' }}
        >
          {isEditing ? 'Update Customer' : 'Create Customer'}
        </Button>
      </ScrollView>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  input: { marginBottom: 2 },
  errorText: { color: '#B00020', fontSize: 12, marginBottom: 6, marginLeft: 4 },
  divider: { marginVertical: 16 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: { color: '#555', fontWeight: '600', marginBottom: 8 },
  pickerContainer: { marginBottom: 8 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#94B4C1',
    backgroundColor: '#F5F5F5',
  },
  optionBtnActive: { backgroundColor: '#547792', borderColor: '#547792' },
  optionText: { fontSize: 13, color: '#333', fontWeight: '500' },
  optionTextActive: { color: '#fff', fontWeight: '700' },
  submitBtn: { marginTop: 24, borderRadius: 10, backgroundColor: '#547792' },
  submitContent: { paddingVertical: 6 },
});
