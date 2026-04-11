import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Modal as RNModal,
  Image,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Switch,
  Divider,
  Snackbar,
  useTheme,
  Menu,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import CategoryPicker from '../../components/CategoryPicker';
import { useCreateProduct, useUpdateProduct } from '../../hooks/useProducts';
import { useAllOutlets } from '../../hooks/useOutlets';
import { resolveImageUrl } from '../../utils/image';

const INITIAL_FORM = {
  name: '',
  sku: '',
  barcode: '',
  description: '',
  price: '',
  cost_price: '',
  unit: '',
  stock: '',
  low_stock_threshold: '',
  outlet_id: null,
  category: null,
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
          name:                editingProduct.name              ?? '',
          sku:                 editingProduct.sku               ?? '',
          barcode:             editingProduct.barcode           ?? '',
          description:         editingProduct.description       ?? '',
          price:               String(editingProduct.price      ?? ''),
          cost_price:          String(editingProduct.cost_price ?? ''),
          unit:                editingProduct.unit              ?? '',
          stock:               editingProduct.stock != null ? String(editingProduct.stock) : '',
          low_stock_threshold: editingProduct.low_stock_threshold != null ? String(editingProduct.low_stock_threshold) : '',
          outlet_id:           '',
          category:            editingProduct?.category?.name ?? editingProduct?.category ?? null,
          category_id:         editingProduct?.category_id ?? null,
          track_stock:         editingProduct.track_stock      ?? false,
          is_active:           editingProduct.is_active        ?? true,
        }
      : { ...INITIAL_FORM },
  );

  // ── Image ─────────────────────────────────────────────────────────────────
  // localImageUri: newly picked image (local file URI)
  // existingImageUrl: image already on the server (for edit mode)
  const [localImageUri, setLocalImageUri] = useState(null);
  const existingImageUrl = isEdit ? (editingProduct.image ?? null) : null;

  const pickImage = async (fromCamera) => {
    const { status } = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      setSnackbar({ visible: true, message: 'Permission denied.' });
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

    if (!result.canceled) {
      setLocalImageUri(result.assets[0].uri);
    }
  };

  const [imageMenuVisible, setImageMenuVisible] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // ── Categories ───────────────────────────────────────────────────────────────
  const [catPickerVisible, setCatPickerVisible] = useState(false);
  const catLabel = form.category ?? 'Select category';

  // ── Outlets ──────────────────────────────────────────────────────────────────
  const { data: outlets = [] } = useAllOutlets();
  const [outletMenuVisible, setOutletMenuVisible] = useState(false);
  const selectedOutletName = outlets.find((o) => o.id === form.outlet_id)?.name ?? 'Select outlet (optional)';

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

    if (!form.name.trim()) {
      setFieldErrors({ name: ['Name is required.'] });
      return;
    }

    try {
      if (isEdit) {
        const payload = {
          name:                form.name.trim()               || undefined,
          price:               form.price                     ? parseFloat(form.price)                     : undefined,
          cost_price:          form.cost_price                ? parseFloat(form.cost_price)                : undefined,
          stock:               form.stock !== ''              ? parseFloat(form.stock)                     : undefined,
          low_stock_threshold: form.low_stock_threshold !== '' ? parseFloat(form.low_stock_threshold)      : undefined,
          category:            form.category                  || undefined,
          is_active:           form.is_active,
          ...(localImageUri ? { image: localImageUri } : {}),
        };
        await updateMutation.mutateAsync({ id: editingProduct.id, data: payload });
      } else {
        if (!form.price) {
          setFieldErrors({ price: ['Price is required.'] });
          return;
        }
        const payload = {
          name:                form.name.trim(),
          sku:                 form.sku.trim()                || undefined,
          barcode:             form.barcode.trim()            || undefined,
          description:         form.description.trim()        || undefined,
          price:               parseFloat(form.price),
          cost_price:          form.cost_price                ? parseFloat(form.cost_price)                : undefined,
          stock:               form.stock !== ''              ? parseFloat(form.stock)                     : undefined,
          low_stock_threshold: form.low_stock_threshold !== '' ? parseFloat(form.low_stock_threshold)      : undefined,
          unit:                form.unit.trim()               || undefined,
          category:            form.category                  || undefined,
          outlet_id:           form.outlet_id                 ? form.outlet_id                             : undefined,
          track_stock:         form.track_stock,
          is_active:           form.is_active,
          ...(localImageUri ? { image: localImageUri } : {}),
        };
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
        {/* ── Image picker ───────────────────────────────────────────────────── */}
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Product Image
        </Text>
        <Divider style={styles.divider} />

        <View style={styles.imagePickerRow}>
          <TouchableOpacity
            style={styles.imagePreview}
            onPress={() => setImageMenuVisible(true)}
          >
            {localImageUri ? (
              <Image source={{ uri: localImageUri }} style={styles.imagePreviewImg} />
            ) : existingImageUrl ? (
              <Image source={{ uri: resolveImageUrl(existingImageUrl) }} style={styles.imagePreviewImg} />
            ) : (
              <View style={styles.imagePreviewPlaceholder}>
                <MaterialCommunityIcons name="image-plus" size={36} color="#94B4C1" />
                <Text variant="bodySmall" style={styles.imageHint}>Tap to add image</Text>
              </View>
            )}
          </TouchableOpacity>

          {(localImageUri || existingImageUrl) && (
            <Button
              mode="outlined"
              icon="pencil-outline"
              onPress={() => setImageMenuVisible(true)}
              style={styles.imageEditBtn}
            >
              Change
            </Button>
          )}
          {localImageUri && (
            <Button
              mode="outlined"
              icon="close"
              onPress={() => setLocalImageUri(null)}
              style={styles.imageEditBtn}
              textColor="#C62828"
            >
              Remove
            </Button>
          )}
        </View>

        <Menu
          visible={imageMenuVisible}
          onDismiss={() => setImageMenuVisible(false)}
          anchor={{ x: 16, y: 160 }}
        >
          <Menu.Item
            leadingIcon="camera"
            title="Take Photo"
            onPress={() => {
              setImageMenuVisible(false);
              pickImage(true);
            }}
          />
          <Menu.Item
            leadingIcon="image"
            title="Choose from Library"
            onPress={() => {
              setImageMenuVisible(false);
              pickImage(false);
            }}
          />
        </Menu>

        <Text variant="titleLarge" style={[styles.sectionTitle, { marginTop: 16 }]}>
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

        {!isEdit && (
          <>
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
          </>
        )}

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
        <FieldError errors={fieldErrors} field="category" />

        {!isEdit && (
          <FormTextInput
            label="Unit (e.g. pcs, kg)"
            field="unit"
            form={form}
            onChange={handleChange}
            errors={fieldErrors}
          />
        )}

        <Text variant="titleLarge" style={[styles.sectionTitle, { marginTop: 16 }]}>
          Stock & Inventory
        </Text>
        <Divider style={styles.divider} />

        <FormTextInput
          label="Stock Quantity"
          field="stock"
          form={form}
          onChange={handleChange}
          errors={fieldErrors}
          keyboardType="numeric"
        />
        <FormTextInput
          label="Low Stock Threshold"
          field="low_stock_threshold"
          form={form}
          onChange={handleChange}
          errors={fieldErrors}
          keyboardType="numeric"
        />
        {!isEdit && (
          <>
            <Menu
              visible={outletMenuVisible}
              onDismiss={() => setOutletMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  icon="store-outline"
                  onPress={() => setOutletMenuVisible(true)}
                  style={styles.input}
                  contentStyle={{ justifyContent: 'flex-start' }}
                >
                  {selectedOutletName}
                </Button>
              }
            >
              <Menu.Item
                title="None"
                onPress={() => {
                  handleChange('outlet_id', null);
                  setOutletMenuVisible(false);
                }}
              />
              {outlets.map((o) => (
                <Menu.Item
                  key={o.id}
                  title={o.name}
                  leadingIcon={form.outlet_id === o.id ? 'check' : undefined}
                  onPress={() => {
                    handleChange('outlet_id', o.id);
                    setOutletMenuVisible(false);
                  }}
                />
              ))}
            </Menu>
            <FieldError errors={fieldErrors} field="outlet_id" />
          </>
        )}

        <Text variant="titleLarge" style={[styles.sectionTitle, { marginTop: 16 }]}>
          Settings
        </Text>
        <Divider style={styles.divider} />

        {!isEdit && (
          <View style={styles.switchRow}>
            <Text variant="bodyMedium">Track Stock</Text>
            <Switch
              value={form.track_stock}
              onValueChange={(v) => handleChange('track_stock', v)}
            />
          </View>
        )}

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
          handleChange('category', cat ? cat.name : null);
          handleChange('category_id', cat ? cat.id : null);
          setCatPickerVisible(false);
        }}
      />

      {/* ── Barcode scanner modal ─────────────────────────────────────────────── */}
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
  imagePickerRow: { flexDirection: 'column', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#EDF3F7',
    borderWidth: 1,
    borderColor: '#D0DDE3',
    borderStyle: 'dashed',
  },
  imagePreviewImg: { width: '100%', height: '100%' },
  imagePreviewPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 4 },
  imageHint: { color: '#94B4C1', textAlign: 'center' },
  imageEditBtn: { alignSelf: 'flex-start' },
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
