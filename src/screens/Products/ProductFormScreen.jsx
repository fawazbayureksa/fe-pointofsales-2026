import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Modal as RNModal,
  Image,
  TouchableOpacity,
  Platform,
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import CategoryPicker from '../../components/CategoryPicker';
import OutletPicker from '../../components/OutletPicker';
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

  const [imageModalVisible, setImageModalVisible] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // ── Categories ───────────────────────────────────────────────────────────────
  const [catPickerVisible, setCatPickerVisible] = useState(false);

  // ── Outlets ──────────────────────────────────────────────────────────────────
  const { data: rawOutlets = [] } = useAllOutlets();
  const outlets = useMemo(
    () => (Array.isArray(rawOutlets) ? rawOutlets : (rawOutlets?.data ?? [])),
    [rawOutlets],
  );
  const [outletPickerVisible, setOutletPickerVisible] = useState(false);
  const selectedOutlet = outlets.find((o) => o.id === form.outlet_id) ?? null;

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

        {localImageUri || existingImageUrl ? (
          <View style={styles.imageCard}>
            <TouchableOpacity
              style={styles.imageCardThumbWrap}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setImageModalVisible(true);
              }}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri: localImageUri || resolveImageUrl(existingImageUrl) }}
                style={styles.imageCardThumb}
                resizeMode="cover"
              />
              <View style={styles.imageEditBadge}>
                <MaterialCommunityIcons name="camera" size={13} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <View style={styles.imageCardDetails}>
              <Text variant="titleSmall" style={styles.imageCardTitle}>
                Product Photo
              </Text>
              <Text variant="bodySmall" style={styles.imageCardMeta}>
                {localImageUri ? 'New photo selected' : 'Current photo from server'}
              </Text>

              <View style={styles.imageCardActions}>
                <Button
                  mode="outlined"
                  compact
                  icon="camera-flip-outline"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setImageModalVisible(true);
                  }}
                  style={styles.imageActionBtn}
                  labelStyle={{ fontSize: 12, fontWeight: '700' }}
                >
                  Change
                </Button>
                {localImageUri && (
                  <Button
                    mode="outlined"
                    compact
                    icon="trash-can-outline"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setLocalImageUri(null);
                    }}
                    style={[styles.imageActionBtn, styles.imageActionBtnDanger]}
                    textColor="#EF4444"
                    labelStyle={{ fontSize: 12, fontWeight: '700' }}
                  >
                    Remove
                  </Button>
                )}
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.imageUploadDropzone}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setImageModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.imageUploadIconCircle}>
              <MaterialCommunityIcons name="camera-plus-outline" size={28} color="#547792" />
            </View>

            <Text variant="titleSmall" style={styles.imageUploadTitle}>
              Upload Product Photo
            </Text>
            <Text variant="bodySmall" style={styles.imageUploadSubtitle}>
              Tap to take a photo or select from your gallery
            </Text>

            <View style={styles.imageUploadPillsRow}>
              <View style={styles.imageUploadPill}>
                <MaterialCommunityIcons name="camera-outline" size={14} color="#547792" />
                <Text style={styles.imageUploadPillText}>Camera</Text>
              </View>
              <View style={styles.imageUploadPill}>
                <MaterialCommunityIcons name="image-outline" size={14} color="#547792" />
                <Text style={styles.imageUploadPillText}>Gallery</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

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
        <View style={styles.pickerFieldContainer}>
          <TouchableOpacity
            onPress={() => setCatPickerVisible(true)}
            activeOpacity={0.8}
          >
            <TextInput
              label="Category (Optional)"
              value={form.category ?? ''}
              placeholder="Select category"
              mode="outlined"
              editable={false}
              pointerEvents="none"
              style={styles.input}
              left={<TextInput.Icon icon="tag-outline" color="#547792" />}
              right={
                form.category ? (
                  <TextInput.Icon
                    icon="close-circle"
                    color="#94A3B8"
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      handleChange('category', null);
                      handleChange('category_id', null);
                    }}
                  />
                ) : (
                  <TextInput.Icon icon="chevron-down" color="#547792" />
                )
              }
              error={!!fieldErrors?.category}
            />
          </TouchableOpacity>
          <FieldError errors={fieldErrors} field="category" />
        </View>

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
          <View style={styles.outletFieldContainer}>
            <TouchableOpacity
              onPress={() => setOutletPickerVisible(true)}
              activeOpacity={0.8}
            >
              <TextInput
                label="Target Outlet (Optional)"
                value={selectedOutlet ? selectedOutlet.name : ''}
                placeholder="All Outlets / Not specific"
                mode="outlined"
                editable={false}
                pointerEvents="none"
                style={styles.input}
                left={<TextInput.Icon icon="storefront-outline" color="#547792" />}
                right={
                  form.outlet_id ? (
                    <TextInput.Icon
                      icon="close-circle"
                      color="#94A3B8"
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        handleChange('outlet_id', null);
                      }}
                    />
                  ) : (
                    <TextInput.Icon icon="chevron-down" color="#547792" />
                  )
                }
                error={!!fieldErrors?.outlet_id}
              />
            </TouchableOpacity>
            <FieldError errors={fieldErrors} field="outlet_id" />
            <Text variant="bodySmall" style={styles.outletHelperText}>
              {selectedOutlet
                ? `Initial stock will be assigned to ${selectedOutlet.name}.`
                : 'Initial stock will not be restricted to a specific outlet.'}
            </Text>
          </View>
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

      {/* ── Outlet picker ─────────────────────────────────────────────────────── */}
      <OutletPicker
        visible={outletPickerVisible}
        onDismiss={() => setOutletPickerVisible(false)}
        selectedId={form.outlet_id}
        outlets={outlets}
        onSelect={(outlet) => {
          handleChange('outlet_id', outlet ? outlet.id : null);
          setOutletPickerVisible(false);
        }}
      />

      {/* ── Image Source Selection Modal ─────────────────────────────────────── */}
      <RNModal
        visible={imageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          onPress={() => setImageModalVisible(false)}
          activeOpacity={1}
        />
        <View style={styles.sheetWrapper}>
          <View style={styles.imageActionSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeaderRow}>
              <View style={styles.sheetHeaderTitleWrap}>
                <MaterialCommunityIcons name="image-edit-outline" size={22} color="#547792" />
                <Text variant="titleMedium" style={styles.sheetTitle}>
                  Product Photo
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setImageModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text variant="bodySmall" style={styles.sheetSubtitle}>
              Select an image source for this product
            </Text>

            <TouchableOpacity
              style={styles.imageOptionRow}
              onPress={() => {
                setImageModalVisible(false);
                pickImage(true);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.imageOptionIconWrap, { backgroundColor: '#EDF3F7' }]}>
                <MaterialCommunityIcons name="camera-outline" size={22} color="#547792" />
              </View>
              <View style={styles.imageOptionTexts}>
                <Text variant="bodyMedium" style={styles.imageOptionTitle}>
                  Take Photo
                </Text>
                <Text variant="bodySmall" style={styles.imageOptionSubtitle}>
                  Capture with device camera
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imageOptionRow}
              onPress={() => {
                setImageModalVisible(false);
                pickImage(false);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.imageOptionIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons name="image-multiple-outline" size={22} color="#D97706" />
              </View>
              <View style={styles.imageOptionTexts}>
                <Text variant="bodyMedium" style={styles.imageOptionTitle}>
                  Choose from Library
                </Text>
                <Text variant="bodySmall" style={styles.imageOptionSubtitle}>
                  Select from photo gallery
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
            </TouchableOpacity>

            {localImageUri && (
              <TouchableOpacity
                style={styles.imageOptionRow}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setImageModalVisible(false);
                  setLocalImageUri(null);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.imageOptionIconWrap, { backgroundColor: '#FEE2E2' }]}>
                  <MaterialCommunityIcons name="trash-can-outline" size={22} color="#EF4444" />
                </View>
                <View style={styles.imageOptionTexts}>
                  <Text variant="bodyMedium" style={[styles.imageOptionTitle, { color: '#EF4444' }]}>
                    Remove Selected Photo
                  </Text>
                  <Text variant="bodySmall" style={styles.imageOptionSubtitle}>
                    Revert to no new photo
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <Button
              mode="outlined"
              onPress={() => setImageModalVisible(false)}
              style={styles.sheetCancelBtn}
            >
              Cancel
            </Button>
          </View>
        </View>
      </RNModal>

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
  pickerFieldContainer: { marginBottom: 4 },
  outletFieldContainer: { marginBottom: 4 },
  outletHelperText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: -2,
    marginBottom: 8,
    marginLeft: 4,
  },
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
  // Product Image Card (when image present)
  imageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  imageCardThumbWrap: {
    width: 90,
    height: 90,
    borderRadius: 12,
    position: 'relative',
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  imageCardThumb: {
    width: '100%',
    height: '100%',
  },
  imageEditBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#213448',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  imageCardDetails: {
    flex: 1,
    gap: 4,
  },
  imageCardTitle: {
    fontWeight: '700',
    color: '#213448',
    fontSize: 14,
  },
  imageCardMeta: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 4,
  },
  imageCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  imageActionBtn: {
    borderRadius: 8,
    borderColor: '#CBD5E1',
  },
  imageActionBtnDanger: {
    borderColor: '#FCA5A5',
  },

  // Product Image Dropzone (when empty)
  imageUploadDropzone: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  imageUploadIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EDF3F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  imageUploadTitle: {
    fontWeight: '700',
    color: '#213448',
    fontSize: 14,
    marginBottom: 2,
  },
  imageUploadSubtitle: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  imageUploadPillsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  imageUploadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  imageUploadPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#547792',
  },

  // Image Selection Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetWrapper: {
    justifyContent: 'flex-end',
  },
  imageActionSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sheetHeaderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontWeight: '800',
    color: '#213448',
    fontSize: 17,
  },
  sheetSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 14,
  },
  imageOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  imageOptionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOptionTexts: {
    flex: 1,
  },
  imageOptionTitle: {
    fontWeight: '700',
    color: '#213448',
    fontSize: 14,
  },
  imageOptionSubtitle: {
    color: '#64748B',
    fontSize: 12,
  },
  sheetCancelBtn: {
    marginTop: 12,
    borderRadius: 8,
    borderColor: '#CBD5E1',
  },
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
