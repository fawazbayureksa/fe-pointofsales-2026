import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
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
  Snackbar,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, updateProfile, changePassword } from '../../api/auth';
import useAuth from '../../hooks/useAuth';

/** Role → { bg, text, border, icon } configuration map */
const ROLE_CONFIG = {
  admin:   { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA', icon: 'shield-account' },
  cashier: { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD', icon: 'cash-register' },
  manager: { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0', icon: 'account-tie' },
  owner:   { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', icon: 'crown' },
};
const ROLE_COLORS = ROLE_CONFIG;

function getInitials(name = '') {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return initials || '?';
}

function fieldLabel(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Change Password field order ──────────────────────────────────────────────
const PW_FIELDS = ['current_password', 'password', 'password_confirmation'];

function TouchableListItem({ icon, label, onPress, color, loading }) {
  const tint = color ?? '#213448';
  return (
    <TouchableOpacity style={pStyles.listItem} onPress={onPress} activeOpacity={0.6} disabled={loading}>
      <View style={[pStyles.listIconWrap, { backgroundColor: color ? '#FFEBEE' : '#EDF3F7' }]}>
        <MaterialCommunityIcons name={icon} size={20} color={tint} />
      </View>
      <Text style={[pStyles.listLabel, { color: tint }]}>{label}</Text>
      {loading ? (
        <ActivityIndicator size={18} color={tint} />
      ) : (
        <MaterialCommunityIcons name="chevron-right" size={20} color="#C0C0C0" />
      )}
    </TouchableOpacity>
  );
}

const pStyles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  listIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
});

export default function ProfileScreen({ navigation }) {
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
      <View style={styles.profileCard}>
        {/* Banner with modern decorative accents */}
        <View style={styles.banner}>
          <View style={styles.bannerCircle1} />
          <View style={styles.bannerCircle2} />

          <View style={styles.bannerHeader}>
            {user?.id != null ? (
              <View style={styles.idBadge}>
                <MaterialCommunityIcons name="badge-account-outline" size={13} color="#C8DCE5" />
                <Text style={styles.idBadgeText}>ID #{user.id}</Text>
              </View>
            ) : (
              <View />
            )}

            <TouchableOpacity
              style={styles.editPillBtn}
              onPress={openEditModal}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="pencil-outline" size={14} color="#FFFFFF" />
              <Text style={styles.editPillText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Card Body */}
        <View style={styles.profileBody}>
          {/* Avatar with status indicator */}
          <View style={styles.avatarWrapper}>
            <Avatar.Text
              size={76}
              label={getInitials(user?.name)}
              style={styles.avatar}
              labelStyle={styles.avatarLabel}
            />
            <View style={styles.statusDotRing}>
              <View style={styles.statusDot} />
            </View>
          </View>

          {/* User Name */}
          <Text variant="titleLarge" style={styles.userName} numberOfLines={1}>
            {user?.name || 'User'}
          </Text>

          {/* Role Badges */}
          {user?.roles && user.roles.length > 0 && (
            <View style={styles.rolesContainer}>
              {user.roles.map((role) => {
                const conf = ROLE_CONFIG[role] ?? {
                  bg: '#F1F5F9',
                  text: '#475569',
                  border: '#CBD5E1',
                  icon: 'account-outline',
                };
                return (
                  <View
                    key={role}
                    style={[
                      styles.roleBadge,
                      { backgroundColor: conf.bg, borderColor: conf.border },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={conf.icon}
                      size={13}
                      color={conf.text}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.roleBadgeText, { color: conf.text }]}>
                      {role}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Contact Details (Email & Phone) */}
          <View style={styles.contactList}>
            {user?.email ? (
              <View style={styles.contactChip}>
                <View style={styles.contactIconWrap}>
                  <MaterialCommunityIcons name="email-outline" size={14} color="#547792" />
                </View>
                <Text style={styles.contactValue} numberOfLines={1}>
                  {user.email}
                </Text>
              </View>
            ) : null}

            {user?.phone ? (
              <View style={styles.contactChip}>
                <View style={styles.contactIconWrap}>
                  <MaterialCommunityIcons name="phone-outline" size={14} color="#547792" />
                </View>
                <Text style={styles.contactValue} numberOfLines={1}>
                  {user.phone}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Quick Metrics / Summary Strip */}
          {/* <View style={styles.metaStrip}>
            <View style={styles.metaItem}>
              <Text style={styles.metaNumber}>{user?.roles?.length ?? 1}</Text>
              <Text style={styles.metaCaption}>Roles</Text>
            </View>

            <View style={styles.metaSep} />

            <View style={styles.metaItem}>
              <Text style={styles.metaNumber}>
                {user?.permissions ? user.permissions.length : '—'}
              </Text>
              <Text style={styles.metaCaption}>Permissions</Text>
            </View>

            <View style={styles.metaSep} />

            <View style={styles.metaItem}>
              <View style={styles.statusActiveWrap}>
                <View style={styles.activeDot} />
                <Text style={styles.statusActiveText}>Active</Text>
              </View>
              <Text style={styles.metaCaption}>Status</Text>
            </View>
          </View> */}
        </View>
      </View>

      <Divider style={styles.divider} />

      {/* ── Management ─────────────────────────────────────────────────────────── */}
      <Text variant="labelMedium" style={styles.sectionLabel}>Management</Text>

      <Card style={styles.actionCard} elevation={1}>
        <TouchableListItem
          icon="package-variant-closed"
          label="Products"
          onPress={() => navigation.navigate('ProductList')}
        />
        <Divider style={styles.listDivider} />
        <TouchableListItem
          icon="shape-outline"
          label="Categories"
          onPress={() => navigation.navigate('CategoryList')}
        />
        <Divider style={styles.listDivider} />
        <TouchableListItem
          icon="account-group-outline"
          label="Customers"
          onPress={() => navigation.navigate('CustomerList')}
        />
        <Divider style={styles.listDivider} />
        <TouchableListItem
          icon="package-variant-closed-check"
          label="Stock"
          onPress={() => navigation.navigate('Stock')}
        />
      </Card>

      <Divider style={styles.divider} />

      {/* ── Reports ─────────────────────────────────────────────────────────────── */}
      <Text variant="labelMedium" style={styles.sectionLabel}>Reports</Text>

      <Card style={styles.actionCard} elevation={1}>
        <TouchableListItem
          icon="cash-multiple"
          label="Payment History"
          onPress={() => navigation.navigate('PaymentHistory')}
        />
      </Card>

      <Divider style={styles.divider} />

      {/* ── Actions ────────────────────────────────────────────────────────────── */}
      <Text variant="labelMedium" style={styles.sectionLabel}>Account</Text>

      <Card style={styles.actionCard} elevation={1}>
        <TouchableListItem
          icon="account-edit-outline"
          label="Edit Profile"
          onPress={openEditModal}
        />
        <Divider style={styles.listDivider} />
        <TouchableListItem
          icon="lock-outline"
          label="Change Password"
          onPress={openPwModal}
        />
        <Divider style={styles.listDivider} />
        <TouchableListItem
          icon="logout"
          label="Logout"
          onPress={logout}
          color={theme.colors.error}
          loading={isLoggingOut}
        />
      </Card>

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
  // Profile Card
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#213448',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  banner: {
    height: 76,
    backgroundColor: '#213448',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-start',
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  bannerCircle1: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(84, 119, 146, 0.25)',
  },
  bannerCircle2: {
    position: 'absolute',
    bottom: -40,
    left: 20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  idBadgeText: {
    color: '#C8DCE5',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  editPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  editPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  profileBody: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  avatarWrapper: {
    marginTop: -38,
    marginBottom: 10,
    position: 'relative',
    borderRadius: 44,
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  avatar: {
    backgroundColor: '#547792',
  },
  avatarLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 26,
  },
  statusDotRing: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    padding: 2.5,
  },
  statusDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#10B981',
  },
  userName: {
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
    textAlign: 'center',
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 14,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 20,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    textTransform: 'capitalize',
    letterSpacing: 0.2,
  },
  contactList: {
    width: '100%',
    gap: 6,
    marginBottom: 14,
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 10,
  },
  contactIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#EDF3F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactValue: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  metaStrip: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  metaItem: {
    alignItems: 'center',
    flex: 1,
  },
  metaNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#213448',
    marginBottom: 2,
  },
  metaCaption: {
    fontSize: 11,
    color: '#8A9BA8',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metaSep: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },
  statusActiveWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusActiveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  // Backward compatibility fallback styles
  card: {
    marginBottom: 8,
    borderRadius: 12,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 24,
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
  sectionLabel: {
    color: '#94B4C1',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  actionCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  listDivider: {
    marginLeft: 62,
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
