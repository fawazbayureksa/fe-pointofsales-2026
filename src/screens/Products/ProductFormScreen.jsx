import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Modal as RNModal,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Switch,
  Divider,
  Snackbar,
  useTheme,
} from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import CategoryPicker from '../../components/CategoryPicker';
import { useCreateProduct, useUpdateProduct } from '../../hooks/useProducts';

const INITIAL_FORM = {
  name: '',
  sku: '',
  barcode: '',
  description: '',
  price: '',
  cost_price: '',
  unit: '',
  category_id: null,
  track_stock: false,
  is_active: true,
};

function FieldError({ errors, field }) {
  const msg = errors?.[field];
  if (!msg) return null;
  const text = Array.isArray(msg) ? msg[0] : msg;
  return <Text style={styles.errorText}>{text}</Text>;
}

function FormTextInput({ label, field, form, onChange, errors, ...rest }) {
  return (
    <View>
      <TextInput
        label={label}
        value={form[field]}
        onChangeText={(v) => onChange(field, v)}
        mode="outlined"
        error={!!errors?.[field]}
        style={styles.input}
        {...rest}
      />
      <FieldError errors={errors} field={field} />
    </View>
  );
}

export default function ProductFormScreen({ route, navigation }) {
  const theme = useTheme();
  const editingProduct = route.params?.product ?? null;
  const isEdit = !!editingProduct;

  // ── Form state ───────────────────────────────────────────────────────────────
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          name:        editingProduct.name         ?? '',
          sku:         editingProduct.sku          ?? '',
          barcode:     editingProduct.barcode      ?? '',
          description: editingProduct.description  ?? '',
          price:       String(editingProduct.price   ?? ''),
          cost_price:  String(editingProduct.cost_price ?? ''),
          unit:        editingProduct.unit         ?? '',
          category_id: editingProduct.category_id  ?? null,
          track_stock: editingProduct.track_stock  ?? false,
          is_active:   editingProduct.is_active    ?? true,
        }
      : { ...INITIAL_FORM },
  );

  const [fieldErrors, setFieldErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // ── Categories ───────────────────────────────────────────────────────────────
  const [catPickerVisible, setCatPickerVisible] = useState(false);
  const [selectedCatName, setSelectedCatName] = useState(
    editingProduct?.category?.name ?? null,
  );

  const catLabel = selectedCatName ?? 'Select category';

  // ── Barcode scanner ──────────────────────────────────────────────────────────
  const [permission, requestPermission] = useCameraPermissions();
  const [scannerVisible, setScannerVisible] = useState(false);

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setSnackbar({ visible: true, message: 'Camera permission denied.' });
        return;
      }
    }
    setScannerVisible(true);
  };

  const handleBarcodeScanned = ({ data }) => {
    handleChange('barcode', data);
    setScannerVisible(false);
  };

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async () => {
    setFieldErrors({});

    const payload = {
      name:        form.name.trim(),
      sku:         form.sku.trim()         || undefined,
      barcode:     form.barcode.trim()     || undefined,
      description: form.description.trim() || undefined,
      price:       parseFloat(form.price),
      cost_price:  form.cost_price ? parseFloat(form.cost_price) : undefined,
      unit:        form.unit.trim()         || undefined,
      category_id: form.category_id         || undefined,
      track_stock: form.track_stock,
      is_active:   form.is_active,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: editingProduct.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigation.goBack();
    } catch (err) {
      if (err?.errors) {
        setFieldErrors(err.errors);
      } else {
        setSnackbar({ visible: true, message: err?.message ?? 'Save failed.' });
      }
    }
  };

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Basic Info
        </Text>
        <Divider style={styles.divider} />

        <FormTextInput
          label="Name *"
          field="name"
          form={form}
          onChange={handleChange}
          errors={fieldErrors}
        />
        <FormTextInput
          label="SKU"
          field="sku"
          form={form}
          onChange={handleChange}
          errors={fieldErrors}
          autoCapitalize="characters"
        />

        {/* Barcode with scanner trigger */}
        <View style={styles.barcodeRow}>
          <TextInput
            label="Barcode"
            value={form.barcode}
            onChangeText={(v) => handleChange('barcode', v)}
            mode="outlined"
            error={!!fieldErrors?.barcode}
            style={styles.barcodeInput}
          />
          <Button
            mode="outlined"
            icon="barcode-scan"
            onPress={openScanner}
            style={styles.scanBtn}
            contentStyle={styles.scanBtnContent}
          >
            Scan
          </Button>
        </View>
        <FieldError errors={fieldErrors} field="barcode" />

        <FormTextInput
          label="Description"
          field="description"
          form={form}
          onChange={handleChange}
          errors={fieldErrors}
          multiline
          numberOfLines={3}
        />

        <Text variant="titleLarge" style={[styles.sectionTitle, { marginTop: 16 }]}>
          Pricing
        </Text>
        <Divider style={styles.divider} />

        <FormTextInput
          label="Price *"
          field="price"
          form={form}
          onChange={handleChange}
          errors={fieldErrors}
          keyboardType="decimal-pad"
        />
        <FormTextInput
          label="Cost Price"
          field="cost_price"
          form={form}
          onChange={handleChange}
          errors={fieldErrors}
          keyboardType="decimal-pad"
        />

        <Text variant="titleLarge" style={[styles.sectionTitle, { marginTop: 16 }]}>
          Category & Unit
        </Text>
        <Divider style={styles.divider} />

        {/* Category picker */}
        <Button
          mode="outlined"
          icon="tag-outline"
          onPress={() => setCatPickerVisible(true)}
          style={styles.input}
          contentStyle={{ justifyContent: 'flex-start' }}
        >
          {catLabel}
        </Button>
        <FieldError errors={fieldErrors} field="category_id" />

        <FormTextInput
          label="Unit (e.g. pcs, kg)"
          field="unit"
          form={form}
          onChange={handleChange}
          errors={fieldErrors}
        />

        <Text variant="titleLarge" style={[styles.sectionTitle, { marginTop: 16 }]}>
          Settings
        </Text>
        <Divider style={styles.divider} />

        <View style={styles.switchRow}>
          <Text variant="bodyMedium">Track Stock</Text>
          <Switch
            value={form.track_stock}
            onValueChange={(v) => handleChange('track_stock', v)}
          />
        </View>

        <View style={styles.switchRow}>
          <Text variant="bodyMedium">Active</Text>
          <Switch
            value={form.is_active}
            onValueChange={(v) => handleChange('is_active', v)}
          />
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isSaving}
          disabled={isSaving}
          style={styles.saveBtn}
          contentStyle={styles.saveBtnContent}
        >
          {isEdit ? 'Save Changes' : 'Create Product'}
        </Button>
      </ScrollView>

      {/* ── Category picker ───────────────────────────────────────────────────── */}
      <CategoryPicker
        visible={catPickerVisible}
        onDismiss={() => setCatPickerVisible(false)}
        selectedId={form.category_id}
        onSelect={(cat) => {
          handleChange('category_id', cat ? cat.id : null);
          setSelectedCatName(cat ? cat.name : null);
          setCatPickerVisible(false);
        }}
      />

      {/* ── Barcode scanner modal ─────────────────────────────────────────────── */}}
      <RNModal
        visible={scannerVisible}
        animationType="slide"
        onRequestClose={() => setScannerVisible(false)}
      >
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e'] }}
            onBarcodeScanned={handleBarcodeScanned}
          />
          <View style={styles.scannerOverlay}>
            <Text style={styles.scannerHint}>Aim at a barcode to scan</Text>
            <Button
              mode="contained"
              onPress={() => setScannerVisible(false)}
              style={styles.scannerClose}
            >
              Cancel
            </Button>
          </View>
        </View>
      </RNModal>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={4000}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 16, paddingBottom: 48 },
  sectionTitle: { fontWeight: '700', marginBottom: 4 },
  divider: { marginBottom: 12 },
  input: { marginBottom: 4 },
  errorText: { color: '#B00020', fontSize: 12, marginBottom: 10, marginLeft: 4 },
  barcodeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 0 },
  barcodeInput: { flex: 1 },
  scanBtn: { marginTop: 6, alignSelf: 'flex-start' },
  scanBtnContent: { paddingHorizontal: 4 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  saveBtn: { marginTop: 24, borderRadius: 8 },
  saveBtnContent: { paddingVertical: 6 },
  // Barcode scanner
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scannerOverlay: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 16,
  },
  scannerHint: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scannerClose: { paddingHorizontal: 24 },
});
