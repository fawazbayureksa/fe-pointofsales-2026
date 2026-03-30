import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
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
import { useCreateCategory, useUpdateCategory } from '../../hooks/useCategories';
import CategoryPicker from '../../components/CategoryPicker';

export default function CategoryFormScreen({ route, navigation }) {
  const theme = useTheme();
  const editingCategory = route.params?.category ?? null;
  const isEdit = !!editingCategory;

  // ── Form state ───────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name:       editingCategory?.name       ?? '',
    slug:       editingCategory?.slug       ?? '',
    sort_order: String(editingCategory?.sort_order ?? '0'),
    is_active:  editingCategory?.is_active  ?? true,
    parent_id:  editingCategory?.parent_id  ?? null,
  });
  const [parentName, setParentName] = useState(
    editingCategory?.parent?.name ?? null,
  );

  const [fieldErrors, setFieldErrors] = useState({});
  const [snackbar, setSnackbar]   = useState({ visible: false, message: '' });
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async () => {
    setFieldErrors({});

    const payload = {
      name:       form.name.trim(),
      slug:       form.slug.trim()     || undefined,
      parent_id:  form.parent_id       ?? null,
      sort_order: parseInt(form.sort_order, 10) || 0,
      is_active:  form.is_active,
    };

    if (!payload.name) {
      setFieldErrors({ name: 'Name is required.' });
      return;
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: editingCategory.id, data: payload });
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

  const parentLabel = parentName ? parentName : 'None (top-level)';

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="titleLarge" style={styles.sectionTitle}>Category Info</Text>
        <Divider style={styles.divider} />

        {/* Name */}
        <TextInput
          label="Name *"
          value={form.name}
          onChangeText={(v) => handleChange('name', v)}
          mode="outlined"
          error={!!fieldErrors.name}
          style={styles.input}
        />
        {fieldErrors.name ? (
          <Text style={styles.errorText}>{Array.isArray(fieldErrors.name) ? fieldErrors.name[0] : fieldErrors.name}</Text>
        ) : null}

        {/* Slug */}
        <TextInput
          label="Slug (optional)"
          value={form.slug}
          onChangeText={(v) => handleChange('slug', v)}
          mode="outlined"
          style={styles.input}
          autoCapitalize="none"
          error={!!fieldErrors.slug}
        />
        {fieldErrors.slug ? (
          <Text style={styles.errorText}>{Array.isArray(fieldErrors.slug) ? fieldErrors.slug[0] : fieldErrors.slug}</Text>
        ) : null}

        <Text variant="titleLarge" style={[styles.sectionTitle, { marginTop: 16 }]}>
          Hierarchy
        </Text>
        <Divider style={styles.divider} />

        {/* Parent category picker */}
        <Button
          mode="outlined"
          icon="sitemap"
          onPress={() => setPickerVisible(true)}
          style={styles.input}
          contentStyle={{ justifyContent: 'flex-start' }}
        >
          Parent: {parentLabel}
        </Button>

        {/* Sort order */}
        <TextInput
          label="Sort Order"
          value={form.sort_order}
          onChangeText={(v) => handleChange('sort_order', v)}
          mode="outlined"
          keyboardType="number-pad"
          style={styles.input}
        />

        <Text variant="titleLarge" style={[styles.sectionTitle, { marginTop: 16 }]}>
          Settings
        </Text>
        <Divider style={styles.divider} />

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
          {isEdit ? 'Save Changes' : 'Create Category'}
        </Button>
      </ScrollView>

      {/* ── Parent category picker ─────────────────────────────────────────── */}
      <CategoryPicker
        visible={pickerVisible}
        onDismiss={() => setPickerVisible(false)}
        selectedId={form.parent_id}
        excludeId={isEdit ? editingCategory.id : undefined}
        rootsOnly
        onSelect={(cat) => {
          handleChange('parent_id', cat ? cat.id : null);
          setParentName(cat ? cat.name : null);
          setPickerVisible(false);
        }}
      />

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
});
