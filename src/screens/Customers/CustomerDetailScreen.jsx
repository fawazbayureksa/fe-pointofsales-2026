import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Text,
  Button,
  Divider,
  ActivityIndicator,
  Chip,
  Snackbar,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCustomer, useDeleteCustomer } from '../../hooks/useCustomers';
import { formatDate } from '../../utils/date';

const TIER_COLORS = {
  Regular:  { bg: '#F5F5F5', text: '#555' },
  Silver:   { bg: '#ECEFF1', text: '#455A64' },
  Gold:     { bg: '#FFF8E1', text: '#F57F17' },
  Platinum: { bg: '#EDE7F6', text: '#6A1B9A' },
};

function MembershipBadge({ tier }) {
  if (!tier) return null;
  const c = TIER_COLORS[tier] ?? { bg: '#F5F5F5', text: '#555' };
  return (
    <Chip
      compact
      style={{ backgroundColor: c.bg, alignSelf: 'flex-start' }}
      textStyle={{ color: c.text, fontWeight: '700' }}
    >
      {tier}
    </Chip>
  );
}

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={18} color="#547792" style={styles.infoIcon} />
      <View style={styles.infoBody}>
        <Text variant="bodySmall" style={styles.infoLabel}>{label}</Text>
        <Text variant="bodyMedium" style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function CustomerDetailScreen({ route, navigation }) {
  const theme = useTheme();
  const { customerId } = route.params;

  const { data: customer, isLoading, isError, refetch } = useCustomer(customerId);
  const deleteMutation = useDeleteCustomer();
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(customerId);
      navigation.goBack();
    } catch (err) {
      setSnackbar({ visible: true, message: err?.message ?? 'Delete failed.' });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !customer) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load customer.</Text>
        <Button onPress={refetch} style={{ marginTop: 8 }}>Retry</Button>
      </View>
    );
  }

  const isMember = !!customer.member_since;

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: '#213448' }]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(customer.name ?? '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text variant="headlineSmall" style={styles.headerName}>{customer.name}</Text>
          {isMember && (
            <View style={[styles.memberChip, { backgroundColor: '#547792' }]}>
              <MaterialCommunityIcons name="card-account-details-outline" size={14} color="#fff" />
              <Text style={styles.memberChipText}>Member since {formatDate(customer.member_since)}</Text>
            </View>
          )}
        </View>

        {/* Loyalty & Membership */}
        {(customer.loyalty_points > 0 || customer.membership_tier) && (
          <>
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionTitle}>Membership</Text>
              {customer.membership_tier && (
                <View style={styles.tierRow}>
                  <Text variant="bodyMedium" style={{ color: '#555' }}>Tier</Text>
                  <MembershipBadge tier={customer.membership_tier} />
                </View>
              )}
              {customer.loyalty_points > 0 && (
                <View style={styles.tierRow}>
                  <Text variant="bodyMedium" style={{ color: '#555' }}>Loyalty Points</Text>
                  <Text variant="bodyMedium" style={{ fontWeight: '700', color: '#547792' }}>
                    {Number(customer.loyalty_points).toLocaleString('id-ID')} pts
                  </Text>
                </View>
              )}
            </View>
            <Divider />
          </>
        )}

        {/* Contact & Personal Info */}
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionTitle}>Contact</Text>
          <InfoRow icon="email-outline" label="Email" value={customer.email} />
          <InfoRow icon="phone-outline" label="Phone" value={customer.phone} />
          <InfoRow icon="gender-male-female" label="Gender" value={customer.gender} />
          <InfoRow icon="calendar-outline" label="Date of Birth" value={customer.date_of_birth ? formatDate(customer.date_of_birth) : null} />
          {customer.notes && (
            <InfoRow icon="note-text-outline" label="Notes" value={customer.notes} />
          )}
        </View>

        <Divider />

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            icon="account-edit-outline"
            onPress={() => navigation.navigate('CustomerForm', { customerId })}
            style={[styles.actionBtn, { backgroundColor: '#547792' }]}
            contentStyle={styles.actionContent}
          >
            Edit Customer
          </Button>
          <Button
            mode="outlined"
            icon="history"
            onPress={() => navigation.navigate('OrderList', { customerId })}
            style={styles.actionBtn}
            contentStyle={styles.actionContent}
          >
            Order History
          </Button>
          <Button
            mode="outlined"
            icon="delete-outline"
            onPress={handleDelete}
            loading={deleteMutation.isPending}
            disabled={deleteMutation.isPending}
            textColor={theme.colors.error}
            style={styles.actionBtn}
            contentStyle={styles.actionContent}
          >
            Delete
          </Button>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { paddingBottom: 32 },
  header: { padding: 24, alignItems: 'center', gap: 8 },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  headerName: { color: '#fff', fontWeight: '800' },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
    marginTop: 4,
  },
  memberChipText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  section: { padding: 16 },
  sectionTitle: {
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  infoIcon: { marginTop: 2 },
  infoBody: { flex: 1 },
  infoLabel: { color: '#888', marginBottom: 1 },
  infoValue: { fontWeight: '500', color: '#213448' },
  actions: { padding: 16, gap: 10 },
  actionBtn: { borderRadius: 10 },
  actionContent: { paddingVertical: 4 },
  errorText: { color: '#B00020', fontSize: 15 },
});
