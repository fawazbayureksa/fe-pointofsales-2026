import React from 'react';
import { View, ScrollView, Image, StyleSheet } from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  Divider,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import { useProduct } from '../../hooks/useProducts';
import { formatCurrency } from '../../utils/currency';

function DetailRow({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <View style={styles.detailRow}>
      <Text variant="labelMedium" style={styles.label}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={styles.value}>
        {String(value)}
      </Text>
    </View>
  );
}

export default function ProductDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const theme = useTheme();
  const { data: product, isLoading } = useProduct(id);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text>Product not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ── Hero image ────────────────────────────────────────────────────────── */}
      {product.image ? (
        <Image source={{ uri: product.image }} style={styles.hero} />
      ) : (
        <View style={styles.heroPlaceholder}>
          <Text style={styles.heroIcon}>📦</Text>
        </View>
      )}

      {/* ── Header card ───────────────────────────────────────────────────────── */}
      <Card style={styles.card} elevation={2}>
        <Card.Content>
          <View style={styles.titleRow}>
            <Text variant="headlineSmall" style={styles.name}>
              {product.name}
            </Text>
            <Chip
              compact
              style={{
                backgroundColor: product.is_active ? '#E8F5E9' : '#FAFAFA',
              }}
              textStyle={{
                color: product.is_active ? '#2E7D32' : '#9E9E9E',
                fontWeight: '700',
              }}
            >
              {product.is_active ? 'Active' : 'Inactive'}
            </Chip>
          </View>

          <Text variant="headlineMedium" style={styles.price}>
            {formatCurrency(parseFloat(product.price))}
          </Text>

          {product.description ? (
            <Text variant="bodyMedium" style={styles.description}>
              {product.description}
            </Text>
          ) : null}
        </Card.Content>
      </Card>

      {/* ── Details card ──────────────────────────────────────────────────────── */}
      <Card style={styles.card} elevation={1}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Details
          </Text>
          <Divider style={styles.divider} />

          <DetailRow label="SKU"         value={product.sku} />
          <DetailRow label="Barcode"     value={product.barcode} />
          <DetailRow label="Unit"        value={product.unit} />
          <DetailRow
            label="Cost Price"
            value={product.cost_price ? formatCurrency(parseFloat(product.cost_price)) : null}
          />
          <DetailRow
            label="Track Stock"
            value={product.track_stock ? 'Yes' : 'No'}
          />
          {product.stock !== undefined && product.track_stock ? (
            <DetailRow label="Stock" value={product.stock} />
          ) : null}
        </Card.Content>
      </Card>

      {/* ── Edit button ───────────────────────────────────────────────────────── */}
      <Button
        mode="contained"
        icon="pencil"
        onPress={() => navigation.navigate('ProductForm', { product })}
        style={styles.editBtn}
      >
        Edit Product
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16, paddingBottom: 40 },
  hero: { width: '100%', height: 220, borderRadius: 12, marginBottom: 16 },
  heroPlaceholder: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIcon: { fontSize: 64 },
  card: { marginBottom: 12, borderRadius: 12 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  name: { flex: 1, fontWeight: '700', marginRight: 8 },
  price: { color: '#6200ee', fontWeight: '800', marginBottom: 8 },
  description: { color: '#555', marginTop: 4 },
  sectionTitle: { fontWeight: '700', marginBottom: 4 },
  divider: { marginBottom: 12 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  label: { color: '#888', flex: 1 },
  value: { flex: 2, textAlign: 'right' },
  editBtn: { marginTop: 8, borderRadius: 8 },
});
