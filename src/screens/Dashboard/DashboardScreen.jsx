import React, { useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Text,
  Surface,
  useTheme,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { useDashboard } from '../../hooks/useDashboard';
import { useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '../../utils/currency';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - 32;

// ─── Helpers ────────────────────────────────────────────────────────────────

function abbrev(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)         return (n / 1_000).toFixed(0) + 'K';
  return String(n);
}

function GrowthBadge({ value }) {
  if (value == null) return null;
  const pos = value >= 0;
  return (
    <View style={[styles.badge, pos ? styles.badgeGreen : styles.badgeRed]}>
      <Text style={[styles.badgeText, pos ? styles.badgeTextGreen : styles.badgeTextRed]}>
        {pos ? '\u2191' : '\u2193'} {Math.abs(value).toFixed(1)}%
      </Text>
    </View>
  );
}

function StatusBadge({ status }) {
  const colors = {
    completed: { bg: '#E8F5E9', text: '#2E7D32' },
    pending:   { bg: '#FFF3E0', text: '#E65100' },
    cancelled: { bg: '#F5F5F5', text: '#757575' },
  };
  const c = colors[status] ?? colors.pending;
  return (
    <View style={[styles.statusBadge, { backgroundColor: c.bg }]}>
      <Text style={[styles.statusText, { color: c.text }]}>{status}</Text>
    </View>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

// ─── Summary card icons ─────────────────────────────────────────────────────
const CARD_ICONS = {
  "Today's Sales":    'cash-register',
  'Monthly Revenue':  'chart-line',
  'Orders Today':     'clipboard-list-outline',
  'Avg Order Value':  'chart-bar',
};

function SummaryCard({ label, value, sub, growth }) {
  const theme = useTheme();
  const icon = CARD_ICONS[label] ?? 'information-outline';
  return (
    <Surface style={styles.summaryCard} elevation={1}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <MaterialCommunityIcons name={icon} size={18} color={theme.colors.primary} />
        </View>
        {growth != null && <GrowthBadge value={growth} />}
      </View>
      <Text variant="labelSmall" style={styles.cardLabel}>{label}</Text>
      <Text variant="titleMedium" style={[styles.cardValue, { color: theme.colors.secondary }]}
        numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <View style={styles.cardFooter}>
        {sub ? <Text variant="labelSmall" style={styles.cardSub}>{sub}</Text> : <View />}
      </View>
    </Surface>
  );
}

function SkeletonBox({ width, height, style }) {
  return (
    <View
      style={[
        { width, height, backgroundColor: '#E8ECF0', borderRadius: 8 },
        style,
      ]}
    />
  );
}

function DashboardSkeleton() {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.summaryGrid}>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonBox key={i} width={(SCREEN_W - 40) / 2} height={88} style={{ margin: 0 }} />
        ))}
      </View>
      <SkeletonBox width={CHART_W} height={180} style={styles.chartSkeleton} />
      <SkeletonBox width={CHART_W} height={120} style={styles.chartSkeleton} />
      <SkeletonBox width={CHART_W} height={200} style={styles.chartSkeleton} />
    </ScrollView>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function DashboardScreen({ navigation }) {
  const theme = useTheme();
  const qc = useQueryClient();

  const { data, isLoading, isFetching, error } = useDashboard();

  const onRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  }, [qc]);

  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load dashboard.</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sales      = data?.sales ?? {};
  const orders     = data?.orders ?? {};
  const customers  = data?.customers ?? {};
  const last7      = sales.last_7_days ?? [];
  const topProds   = data?.top_products ?? [];
  const pmStats    = data?.payment_method_stats ?? [];
  const lowStock   = data?.low_stock_products ?? [];
  const recentOrds = data?.recent_orders ?? [];

  // Bar chart data
  const barLabels = last7.map((d) => d.label.split(',')[0].trim().substring(0, 3));
  const barData   = last7.map((d) => d.total);
  const todayDate = new Date().toISOString().slice(0, 10);
  const todayIdx  = last7.findIndex((d) => d.date === todayDate);

  const chartColors = barData.map((_, i) =>
    i === todayIdx
      ? (opacity = 1) => `rgba(84,119,146,${opacity})`
      : (opacity = 1) => `rgba(148,180,193,${opacity})`,
  );

  // Top products max revenue for progress bar
  const maxRevenue = topProds.reduce((m, p) => Math.max(m, parseFloat(p.revenue)), 0) || 1;

  // Payment method label map
  const pmLabel = { cash: 'Cash', card: 'Card', qris: 'QRIS', transfer: 'Transfer' };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={isFetching && !isLoading}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="titleMedium" style={styles.headerGreeting}>Overview</Text>
          <Text variant="bodySmall" style={styles.headerDate}>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
      </View>

      {/* ── Section 1: Summary Cards ───────────────────────────────── */}
      <View style={styles.summaryGrid}>
        <SummaryCard
          label="Today's Sales"
          value={formatCurrency(sales.today ?? 0)}
          growth={sales.today_growth}
        />
        <SummaryCard
          label="Monthly Revenue"
          value={formatCurrency(sales.monthly ?? 0)}
          growth={sales.monthly_growth}
        />
        <SummaryCard
          label="Orders Today"
          value={String(orders.today ?? 0)}
          sub={`${orders.completed ?? 0} completed`}
        />
        <SummaryCard
          label="Avg Order Value"
          value={formatCurrency(sales.avg_order ?? 0)}
        />
      </View>

      {/* ── Section 2: Sales Chart ─────────────────────────────────── */}
      {last7.length > 0 && (
        <Surface style={styles.section} elevation={1}>
          <Text variant="titleSmall" style={styles.sectionTitle}>Sales — Last 7 Days</Text>
          <BarChart
            data={{
              labels: barLabels,
              datasets: [{ data: barData, colors: chartColors }],
            }}
            width={CHART_W - 32}
            height={180}
            withCustomBarColorFromData
            flatColor
            fromZero
            showValuesOnTopOfBars={false}
            yAxisLabel=""
            yAxisSuffix=""
            formatYLabel={(v) => abbrev(Number(v))}
            chartConfig={{
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              color: (opacity = 1) => `rgba(84,119,146,${opacity})`,
              labelColor: () => '#666',
              barPercentage: 0.65,
              decimalPlaces: 0,
              propsForLabels: { fontSize: 11 },
            }}
            style={{ borderRadius: 8 }}
          />
          {todayIdx >= 0 && (
            <View style={styles.chartLegend}>
              <View style={[styles.legendDot, { backgroundColor: '#547792' }]} />
              <Text variant="labelSmall" style={styles.legendText}>Today</Text>
              <View style={[styles.legendDot, { backgroundColor: '#94B4C1', marginLeft: 12 }]} />
              <Text variant="labelSmall" style={styles.legendText}>Previous days</Text>
            </View>
          )}
        </Surface>
      )}

      {/* ── Section 3: Recent Orders ───────────────────────────────── */}
      <View style={styles.sectionHeaderRow}>
        <Text variant="titleSmall" style={styles.sectionTitleFlat}>Recent Orders</Text>
      </View>
      {recentOrds.length === 0 ? (
        <Surface style={[styles.section, styles.emptyBox]} elevation={1}>
          <Text style={styles.emptyText}>No orders today yet.</Text>
        </Surface>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hScroll}
        >
          {recentOrds.map((order) => (
            <TouchableOpacity
              key={order.id}
              onPress={() => navigation.navigate('Orders', { screen: 'OrderDetail', params: { orderId: order.id } })}
              activeOpacity={0.8}
            >
              <Surface style={styles.orderCard} elevation={1}>
                <Text variant="labelSmall" style={styles.orderNum} numberOfLines={1}>
                  {order.order_number}
                </Text>
                <Text variant="bodySmall" style={styles.orderCustomer} numberOfLines={1}>
                  {order.customer ?? 'Walk-in'}
                </Text>
                <Text variant="titleSmall" style={[styles.orderTotal, { color: theme.colors.secondary }]}>
                  {formatCurrency(order.total_amount)}
                </Text>
                <StatusBadge status={order.status} />
              </Surface>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── Section 4: Top Products ────────────────────────────────── */}
      {topProds.length > 0 && (
        <Surface style={styles.section} elevation={1}>
          <Text variant="titleSmall" style={styles.sectionTitle}>Top Products</Text>
          {topProds.map((p, i) => {
            const pct = parseFloat(p.revenue) / maxRevenue;
            return (
              <View key={p.product_id}>
                <View style={styles.topProdRow}>
                  <Text style={styles.topProdRank}>{i + 1}</Text>
                  <View style={styles.topProdInfo}>
                    <Text variant="bodyMedium" style={{ fontWeight: '600' }} numberOfLines={1}>
                      {p.product_name}
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#666' }}>
                      {p.sold} sold · {formatCurrency(parseFloat(p.revenue))}
                    </Text>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` }]} />
                    </View>
                  </View>
                </View>
                {i < topProds.length - 1 && <Divider style={{ marginVertical: 6 }} />}
              </View>
            );
          })}
        </Surface>
      )}

      {/* ── Section 5: Payment Methods ─────────────────────────────── */}
      {pmStats.length > 0 && (
        <Surface style={styles.section} elevation={1}>
          <Text variant="titleSmall" style={styles.sectionTitle}>Payment Methods</Text>
          {pmStats.map((pm, i) => {
            const totalAll = pmStats.reduce((s, x) => s + parseFloat(x.total), 0) || 1;
            const pct = parseFloat(pm.total) / totalAll;
            const PAY_COLORS = ['#547792', '#94B4C1', '#213448', '#7CA9BE', '#ECEFCA'];
            const color = PAY_COLORS[i % PAY_COLORS.length];
            return (
              <View key={pm.payment_method}>
                <View style={styles.pmRow}>
                  <View style={[styles.pmDot, { backgroundColor: color }]} />
                  <Text variant="bodyMedium" style={styles.pmLabel}>
                    {pmLabel[pm.payment_method] ?? pm.payment_method}
                  </Text>
                  <Text variant="labelSmall" style={styles.pmCount}>{pm.count}x</Text>
                  <Text variant="bodySmall" style={styles.pmTotal}>
                    {formatCurrency(parseFloat(pm.total))}
                  </Text>
                </View>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: color }]} />
                </View>
                {i < pmStats.length - 1 && <Divider style={{ marginVertical: 6 }} />}
              </View>
            );
          })}
        </Surface>
      )}

      {/* ── Section 6: Low Stock ───────────────────────────────────── */}
      {lowStock.length > 0 && (
        <View>
          <View style={styles.sectionHeaderRow}>
            <Text variant="titleSmall" style={styles.sectionTitleFlat}>Low Stock Alerts</Text>
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>{lowStock.length}</Text>
            </View>
          </View>
          {lowStock.map((item) => {
            const empty = item.stock === 0;
            return (
              <TouchableOpacity
                key={`${item.product_id}-${item.outlet_id}`}
                onPress={() => navigation.navigate('Products', { screen: 'ProductDetail', params: { productId: item.product_id } })}
                activeOpacity={0.8}
              >
                <Surface
                  style={[styles.stockCard, { borderLeftColor: empty ? '#C62828' : '#E65100' }]}
                  elevation={1}
                >
                  <View style={[styles.stockIcon, { backgroundColor: empty ? '#FFEBEE' : '#FFF3E0' }]}>
                    <MaterialCommunityIcons
                      name={empty ? 'alert-outline' : 'package-variant'}
                      size={18}
                      color={empty ? '#C62828' : '#E65100'}
                    />
                  </View>
                  <View style={styles.stockInfo}>
                    <Text variant="bodyMedium" style={{ fontWeight: '600' }} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#666' }}>{item.outlet_name}</Text>
                  </View>
                  <View style={styles.stockCount}>
                    <Text
                      variant="titleSmall"
                      style={{ fontWeight: '800', color: empty ? '#C62828' : '#E65100' }}
                    >
                      {item.stock}
                    </Text>
                    <Text variant="labelSmall" style={{ color: '#999' }}>/ {item.threshold}</Text>
                  </View>
                </Surface>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* ── Customers Quick Stat ───────────────────────────────────── */}
      <Surface style={[styles.section, styles.customerRow]} elevation={1}>
        <View style={styles.custStat}>
          <Text variant="labelSmall" style={styles.cardLabel}>Total Customers</Text>
          <Text variant="titleMedium" style={{ fontWeight: '700', color: '#213448' }}>
            {customers.total ?? 0}
          </Text>
        </View>
        <Divider style={styles.custDivider} />
        <View style={styles.custStat}>
          <Text variant="labelSmall" style={styles.cardLabel}>New This Week</Text>
          <Text variant="titleMedium" style={{ fontWeight: '700', color: '#547792' }}>
            +{customers.new_this_week ?? 0}
          </Text>
        </View>
        <Divider style={styles.custDivider} />
        <View style={styles.custStat}>
          <Text variant="labelSmall" style={styles.cardLabel}>Outlets</Text>
          <Text variant="titleMedium" style={{ fontWeight: '700', color: '#213448' }}>
            {data?.outlets ?? 0}
          </Text>
        </View>
      </Surface>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  scrollContent: { paddingBottom: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#888', marginBottom: 12 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 8, backgroundColor: '#547792', borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '700' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  headerLeft: { flex: 1 },
  headerGreeting: { fontWeight: '700', color: '#213448' },
  headerDate: { color: '#94B4C1', marginTop: 2 },

  // Summary
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: (SCREEN_W - 40) / 2,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EDF3F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: { color: '#888', marginBottom: 4, fontSize: 11 },
  cardValue: { fontWeight: '700', fontSize: 15 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  cardSub: { color: '#aaa', fontSize: 11 },
  badge: { borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  badgeGreen: { backgroundColor: '#E8F5E9' },
  badgeRed: { backgroundColor: '#FFEBEE' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextGreen: { color: '#2E7D32' },
  badgeTextRed: { color: '#C62828' },

  // Sections
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: { fontWeight: '700', marginBottom: 12, color: '#213448' },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    gap: 8,
  },
  sectionTitleFlat: { fontWeight: '700', color: '#213448' },
  chartSkeleton: { marginHorizontal: 16, marginTop: 16 },
  chartLegend: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: '#888', fontSize: 11 },

  // Recent orders
  hScroll: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  orderCard: {
    width: 140,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
    gap: 4,
  },
  orderNum: { color: '#547792', fontWeight: '700', fontSize: 10 },
  orderCustomer: { color: '#444', fontWeight: '600' },
  orderTotal: { fontWeight: '700' },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  emptyBox: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { color: '#aaa' },

  // Top products
  topProdRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 },
  topProdRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ECEFCA',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '700',
    color: '#213448',
    fontSize: 13,
  },
  topProdInfo: { flex: 1 },
  progressBg: { height: 6, borderRadius: 3, backgroundColor: '#EEF1F4', marginTop: 4, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: '#547792' },

  // Payment methods
  pmRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  pmDot: { width: 10, height: 10, borderRadius: 5 },
  pmLabel: { flex: 1, fontWeight: '600' },
  pmCount: { color: '#999' },
  pmTotal: { fontWeight: '600', color: '#213448' },

  // Low stock
  alertBadge: {
    backgroundColor: '#C62828',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  alertBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  stockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    gap: 12,
  },
  stockIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stockInfo: { flex: 1 },
  stockCount: { alignItems: 'flex-end' },

  // Customers row
  customerRow: { flexDirection: 'row', alignItems: 'center' },
  custStat: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  custDivider: { width: 1, height: 40 },
});
