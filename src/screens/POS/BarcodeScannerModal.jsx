import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Text } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

/**
 * Props:
 *  visible    {boolean}
 *  products   {Array}    – current product cache for barcode lookup
 *  onAdd      {(product) => void}
 *  onDismiss  {() => void}
 */
export default function BarcodeScannerModal({ visible, products, onAdd, onDismiss }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [toast, setToast] = useState(null);
  const lastScanRef = useRef(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const handleBarcodeScan = useCallback(
    async ({ data }) => {
      if (lastScanRef.current === data) return;
      lastScanRef.current = data;
      setTimeout(() => {
        lastScanRef.current = null;
      }, 2000);

      const product = products.find((p) => p.barcode === data);

      if (!product) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast('Product not found');
        return;
      }

      if (product.track_stock && (product.stock ?? 0) <= 0) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast('Out of stock');
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAdd(product);
      onDismiss();
    },
    [products, onAdd, onDismiss, showToast],
  );

  if (!visible) return null;

  // Permission not yet determined
  if (!permission) {
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.overlay}>
          <Text style={styles.permText}>Checking camera permission…</Text>
        </View>
      </Modal>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
        <View style={styles.overlay}>
          <View style={styles.permCard}>
            <MaterialCommunityIcons name="camera-off" size={48} color="#94B4C1" />
            <Text style={styles.permTitle}>Camera Access Needed</Text>
            <Text style={styles.permBody}>
              Grant camera access to scan barcodes.
            </Text>
            <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
              <Text style={styles.grantBtnText}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onDismiss}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onDismiss}>
      <SafeAreaView style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Barcode</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Camera */}
        <CameraView
          style={StyleSheet.absoluteFill}
          barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e'] }}
          onBarcodeScanned={handleBarcodeScan}
        />

        {/* Scan frame overlay */}
        <View style={styles.scanFrame} pointerEvents="none">
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.scanHint}>Align barcode within the frame</Text>
        </View>

        {/* Toast */}
        {toast && (
          <View style={styles.toastWrap} pointerEvents="none">
            <View style={styles.toast}>
              <Text style={styles.toastText}>{toast}</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const FRAME_SIZE = 240;
const CORNER_LEN = 28;
const CORNER_W = 4;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 10,
  },
  closeBtn: { padding: 6 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  scanFrame: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_LEN,
    height: CORNER_LEN,
    borderColor: '#fff',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_W, borderLeftWidth: CORNER_W },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_W, borderRightWidth: CORNER_W },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_W, borderLeftWidth: CORNER_W },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_W, borderRightWidth: CORNER_W },
  scanHint: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 20,
    fontSize: 13,
    textAlign: 'center',
  },
  toastWrap: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toast: {
    backgroundColor: 'rgba(30,30,30,0.9)',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  toastText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    margin: 32,
    alignItems: 'center',
    gap: 8,
  },
  permTitle: { fontSize: 17, fontWeight: '700', color: '#213448', marginTop: 8 },
  permBody: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 8 },
  permText: { color: '#fff', fontSize: 16 },
  grantBtn: {
    backgroundColor: '#547792',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  grantBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn: { paddingVertical: 10, marginTop: 4 },
  cancelBtnText: { color: '#547792', fontWeight: '600', fontSize: 14 },
});
