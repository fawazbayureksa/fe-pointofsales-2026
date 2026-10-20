import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Modal,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import {
  Text,
  Searchbar,
  Button,
  Divider,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAllOutlets } from '../hooks/useOutlets';

/**
 * A modal bottom-sheet outlet picker for selecting a store outlet or "None".
 *
 * Props:
 *   visible       {boolean}
 *   onDismiss     {() => void}
 *   selectedId    {number|null}                 currently selected outlet id
 *   onSelect      {(outlet: Object|null) => void} null = "None / All Outlets"
 *   outlets       {Array}                       optional override list
 */
export default function OutletPicker({
  visible,
  onDismiss,
  selectedId,
  onSelect,
  outlets: customOutlets,
}) {
  const theme = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = Math.min(Math.round(windowHeight * 0.75), 560);
  const [search, setSearch] = useState('');

  const { data: queriedOutlets = [], isLoading } = useAllOutlets();

  const allOutlets = useMemo(() => {
    const raw = customOutlets ?? queriedOutlets;
    return Array.isArray(raw) ? raw : (raw?.data ?? []);
  }, [customOutlets, queriedOutlets]);

  const filteredOutlets = useMemo(() => {
    if (!search.trim()) return allOutlets;
    const q = search.trim().toLowerCase();
    return allOutlets.filter(
      (o) =>
        (o.name && o.name.toLowerCase().includes(q)) ||
        (o.address && o.address.toLowerCase().includes(q)) ||
        (o.code && o.code.toLowerCase().includes(q)),
    );
  }, [allOutlets, search]);

  const handleSelect = (outlet) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(outlet);
    setSearch('');
  };

  const handleDismiss = () => {
    setSearch('');
    onDismiss();
  };

  const renderItem = ({ item }) => {
    const isSelected = item.id === selectedId;

    return (
      <TouchableOpacity
        style={[
          styles.item,
          isSelected && { backgroundColor: `${theme.colors.primary}12` },
        ]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.itemRow}>
          <View
            style={[
              styles.avatarWrap,
              isSelected && { backgroundColor: theme.colors.primary },
            ]}
          >
            <MaterialCommunityIcons
              name="storefront-outline"
              size={20}
              color={isSelected ? '#FFFFFF' : '#547792'}
            />
          </View>

          <View style={styles.itemTexts}>
            <Text
              variant="bodyMedium"
              style={[
                styles.itemName,
                isSelected && { color: theme.colors.primary, fontWeight: '700' },
              ]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {item.address ? (
              <Text variant="bodySmall" style={styles.itemMeta} numberOfLines={1}>
                {item.address}
              </Text>
            ) : item.phone ? (
              <Text variant="bodySmall" style={styles.itemMeta} numberOfLines={1}>
                {item.phone}
              </Text>
            ) : null}
          </View>

          {isSelected && (
            <MaterialCommunityIcons
              name="check-circle"
              size={22}
              color={theme.colors.primary}
            />
          )}
        </View>
        <Divider style={styles.itemDivider} />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <TouchableOpacity
        style={styles.backdrop}
        onPress={handleDismiss}
        activeOpacity={1}
      />

      <View style={styles.sheetWrapper}>
        <View style={[styles.sheet, { maxHeight: sheetHeight }]}>
          {/* Handle */}
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <MaterialCommunityIcons name="storefront" size={22} color="#547792" />
              <Text variant="titleMedium" style={styles.title}>
                Select Outlet
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleDismiss}
              style={styles.closeIconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text variant="bodySmall" style={styles.subtitle}>
            Assign this product's initial inventory to a specific outlet, or select None for all outlets.
          </Text>

          {allOutlets.length > 4 && (
            <Searchbar
              placeholder="Search outlets…"
              value={search}
              onChangeText={setSearch}
              style={styles.searchbar}
              elevation={0}
            />
          )}

          {isLoading && !allOutlets.length ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredOutlets}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              ListHeaderComponent={
                <TouchableOpacity
                  style={[
                    styles.item,
                    selectedId == null && { backgroundColor: `${theme.colors.primary}12` },
                  ]}
                  onPress={() => handleSelect(null)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemRow}>
                    <View
                      style={[
                        styles.avatarWrap,
                        selectedId == null && { backgroundColor: theme.colors.primary },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="store-off-outline"
                        size={20}
                        color={selectedId == null ? '#FFFFFF' : '#94A3B8'}
                      />
                    </View>
                    <View style={styles.itemTexts}>
                      <Text
                        variant="bodyMedium"
                        style={[
                          styles.itemName,
                          selectedId == null && {
                            color: theme.colors.primary,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        None (All Outlets)
                      </Text>
                      <Text variant="bodySmall" style={styles.itemMeta}>
                        Initial stock not tied to a specific outlet
                      </Text>
                    </View>
                    {selectedId == null && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={22}
                        color={theme.colors.primary}
                      />
                    )}
                  </View>
                  <Divider style={styles.itemDivider} />
                </TouchableOpacity>
              }
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No outlets found.</Text>
                </View>
              }
              style={styles.list}
              contentContainerStyle={styles.listContent}
            />
          )}

          <Button
            mode="outlined"
            onPress={handleDismiss}
            style={styles.closeBtn}
          >
            Cancel
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetWrapper: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 24,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontWeight: '800',
    color: '#213448',
    fontSize: 17,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  closeIconBtn: {
    padding: 4,
  },
  searchbar: {
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    height: 42,
  },
  loadingBox: {
    padding: 32,
    alignItems: 'center',
  },
  list: {
    flexGrow: 0,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 8,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDF3F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTexts: {
    flex: 1,
  },
  itemName: {
    fontWeight: '700',
    color: '#213448',
    fontSize: 14,
    marginBottom: 2,
  },
  itemMeta: {
    color: '#64748B',
    fontSize: 11,
  },
  itemDivider: {
    marginTop: 10,
    backgroundColor: '#F1F5F9',
  },
  empty: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  closeBtn: {
    marginTop: 4,
    borderRadius: 8,
    borderColor: '#CBD5E1',
  },
});
