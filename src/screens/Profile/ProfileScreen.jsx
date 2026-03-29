import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Text,
  Button,
  Card,
  Avatar,
  Chip,
  Modal,
  Portal,
  TextInput,
  Divider,
  ActivityIndicator,
  Snackbar,
  useTheme,
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, updateProfile, changePassword } from '../../api/auth';
import useAuth from '../../hooks/useAuth';

/** Role → { bg, text } colour map */
const ROLE_COLORS = {
  admin:    { bg: '#FFEBEE', text: '#C62828' },
  cashier:  { bg: '#E3F2FD', text: '#1565C0' },
  manager:  { bg: '#E8F5E9', text: '#2E7D32' },
  owner:    { bg: '#FFF8E1', text: '#F57F17' },
};

function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function fieldLabel(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Change Password field order ──────────────────────────────────────────────
const PW_FIELDS = ['current_password', 'password', 'password_confirmation'];

export default function ProfileScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { logout, isLoading: isLoggingOut } = useAuth();

  // ── Server state ─────────────────────────────────────────────────────────────
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });

  // ── Edit Profile modal ────────────────────────────────────────────────────────
  const [editVisible, setEditVisible] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [editErrors, setEditErrors] = useState({});

  const openEditModal = () => {
    setEditForm({
      name:  user?.name  ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
    });
    setEditErrors({});
    setEditVisible(true);
  };

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(['me'], updated);
      setEditVisible(false);
      showSnack('Profile updated successfully');
    },
    onError: (err) => {
      if (err?.errors) setEditErrors(err.errors);
      else showSnack(err?.message ?? 'Update failed');
    },
  });

  // ── Change Password modal ─────────────────────────────────────────────────────
  const [pwVisible, setPwVisible] = useState(false);
  const [pwForm, setPwForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [pwErrors, setPwErrors] = useState({});

  const openPwModal = () => {
    setPwForm({ current_password: '', password: '', password_confirmation: '' });
    setPwErrors({});
    setPwVisible(true);
  };

  const pwMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setPwVisible(false);
      showSnack('Password changed successfully');
    },
    onError: (err) => {
      if (err?.errors) setPwErrors(err.errors);
      else showSnack(err?.message ?? 'Password change failed');
    },
  });

  // ── Snackbar ──────────────────────────────────────────────────────────────────
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const showSnack = (message) => setSnackbar({ visible: true, message });

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (isLoadingUser) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Profile card ───────────────────────────────────────────────────────── */}
      <Card style={styles.card} elevation={2}>
        <Card.Content style={styles.cardContent}>
          <Avatar.Text
            size={80}
            label={getInitials(user?.name)}
            style={styles.avatar}
          />

          <Text variant="headlineSmall" style={styles.name}>
            {user?.name}
          </Text>

          <Text variant="bodyMedium" style={styles.email}>
            {user?.email}
          </Text>

          {user?.phone ? (
            <Text variant="bodySmall" style={styles.phone}>
              {user.phone}
            </Text>
          ) : null}

          {/* Role chips */}
          <View style={styles.chips}>
            {user?.roles?.map((role) => {
              const colors = ROLE_COLORS[role] ?? { bg: '#F5F5F5', text: '#616161' };
              return (
                <Chip
                  key={role}
                  compact
                  style={[styles.chip, { backgroundColor: colors.bg }]}
                  textStyle={{ color: colors.text, fontWeight: '700', textTransform: 'capitalize' }}
                >
                  {role}
                </Chip>
              );
            })}
          </View>
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />

      {/* ── Actions ────────────────────────────────────────────────────────────── */}
      <Button
        mode="outlined"
        icon="account-edit"
        onPress={openEditModal}
        style={styles.actionBtn}
      >
        Edit Profile
      </Button>

      <Button
        mode="outlined"
        icon="lock-reset"
        onPress={openPwModal}
        style={styles.actionBtn}
      >
        Change Password
      </Button>

      <Button
        mode="contained"
        icon="logout"
        buttonColor={theme.colors.error}
        onPress={logout}
        loading={isLoggingOut}
        disabled={isLoggingOut}
        style={styles.actionBtn}
      >
        Logout
      </Button>

      {/* ── Edit Profile Modal ──────────────────────────────────────────────────── */}
      <Portal>
        <Modal
          visible={editVisible}
          onDismiss={() => setEditVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.background }]}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Edit Profile
          </Text>

          {(['name', 'email', 'phone']).map((field) => (
            <View key={field}>
              <TextInput
                label={fieldLabel(field)}
                value={editForm[field]}
                onChangeText={(v) =>
                  setEditForm((prev) => ({ ...prev, [field]: v }))
                }
                keyboardType={field === 'email' ? 'email-address' : field === 'phone' ? 'phone-pad' : 'default'}
                autoCapitalize={field === 'email' ? 'none' : 'words'}
                mode="outlined"
                error={!!editErrors[field]}
                style={styles.modalInput}
              />
              {editErrors[field] ? (
                <Text style={styles.errorText}>
                  {Array.isArray(editErrors[field])
                    ? editErrors[field][0]
                    : editErrors[field]}
                </Text>
              ) : null}
            </View>
          ))}

          <Button
            mode="contained"
            onPress={() => updateMutation.mutate(editForm)}
            loading={updateMutation.isPending}
            disabled={updateMutation.isPending}
            style={styles.modalBtn}
          >
            Save Changes
          </Button>
          <Button
            mode="text"
            onPress={() => setEditVisible(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
        </Modal>
      </Portal>

      {/* ── Change Password Modal ───────────────────────────────────────────────── */}
      <Portal>
        <Modal
          visible={pwVisible}
          onDismiss={() => setPwVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.background }]}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Change Password
          </Text>

          {PW_FIELDS.map((field) => (
            <View key={field}>
              <TextInput
                label={fieldLabel(field)}
                value={pwForm[field]}
                onChangeText={(v) =>
                  setPwForm((prev) => ({ ...prev, [field]: v }))
                }
                secureTextEntry
                mode="outlined"
                error={!!pwErrors[field]}
                style={styles.modalInput}
              />
              {pwErrors[field] ? (
                <Text style={styles.errorText}>
                  {Array.isArray(pwErrors[field])
                    ? pwErrors[field][0]
                    : pwErrors[field]}
                </Text>
              ) : null}
            </View>
          ))}

          <Button
            mode="contained"
            onPress={() => pwMutation.mutate(pwForm)}
            loading={pwMutation.isPending}
            disabled={pwMutation.isPending}
            style={styles.modalBtn}
          >
            Update Password
          </Button>
          <Button
            mode="text"
            onPress={() => setPwVisible(false)}
            disabled={pwMutation.isPending}
          >
            Cancel
          </Button>
        </Modal>
      </Portal>

      {/* ── Snackbar ───────────────────────────────────────────────────────────── */}
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 8,
    borderRadius: 12,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    marginBottom: 12,
  },
  name: {
    fontWeight: '700',
    marginBottom: 2,
  },
  email: {
    color: '#666',
    marginBottom: 2,
  },
  phone: {
    color: '#888',
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    borderRadius: 16,
  },
  divider: {
    marginVertical: 16,
  },
  actionBtn: {
    marginBottom: 12,
    borderRadius: 8,
  },
  // Modal
  modal: {
    margin: 20,
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontWeight: '700',
    marginBottom: 16,
  },
  modalInput: {
    marginBottom: 4,
  },
  modalBtn: {
    marginTop: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#B00020',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
});
