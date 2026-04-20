import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useAuthStore from '../store/authStore';

// Screens
import LoginScreen from '../screens/Auth/LoginScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import POSScreen from '../screens/POS/POSScreen';
import ReceiptScreen from '../screens/POS/ReceiptScreen';
import OrdersScreen from '../screens/Orders/OrdersScreen';
import OrderDetailScreen from '../screens/Orders/OrderDetailScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import ProductListScreen from '../screens/Products/ProductListScreen';
import ProductDetailScreen from '../screens/Products/ProductDetailScreen';
import ProductFormScreen from '../screens/Products/ProductFormScreen';
import CategoryListScreen from '../screens/Categories/CategoryListScreen';
import CategoryFormScreen from '../screens/Categories/CategoryFormScreen';
import CustomerListScreen from '../screens/Customers/CustomerListScreen';
import CustomerFormScreen from '../screens/Customers/CustomerFormScreen';
import CustomerDetailScreen from '../screens/Customers/CustomerDetailScreen';
import PaymentHistoryScreen from '../screens/Payments/PaymentHistoryScreen';
import StockScreen from '../screens/Stock/StockScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ── Shared header theme ──────────────────────────────────────────────────────
const HEADER_BG = '#213448';
const HEADER_TINT = '#FFFFFF';

const sharedStackOptions = {
  headerStyle: {
    backgroundColor: HEADER_BG,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTintColor: HEADER_TINT,
  headerTitleStyle: {
    fontWeight: '600',
    fontSize: 17,
    letterSpacing: 0.3,
  },
  headerBackTitleVisible: false,
  cardStyle: { backgroundColor: '#F4F6F8' },
};

// ── Tab icon map ─────────────────────────────────────────────────────────────
const TAB_ICONS = {
  Dashboard:  { active: 'view-dashboard',        inactive: 'view-dashboard-outline' },
  POS:        { active: 'store',                  inactive: 'store-outline' },
  Products:   { active: 'package-variant-closed',         inactive: 'package-variant' },
  Categories: { active: 'shape',                  inactive: 'shape-outline' },
  Orders:     { active: 'receipt',                inactive: 'text-box-outline' },
  Profile:    { active: 'account-circle',         inactive: 'account-circle-outline' },
};

/** Nested stack for the POS tab */
function POSStack() {
  return (
    <Stack.Navigator screenOptions={sharedStackOptions}>
      <Stack.Screen
        name="POSMain"
        component={POSScreen}
        options={{ title: 'POS', headerShown: false }}
      />
      <Stack.Screen
        name="Receipt"
        component={ReceiptScreen}
        options={{ title: 'Receipt' }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'Order Detail' }}
      />
    </Stack.Navigator>
  );
}

/** Nested stack for the Orders tab */
function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={sharedStackOptions}>
      <Stack.Screen
        name="OrderList"
        component={OrdersScreen}
        options={{ title: 'Orders' }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'Order Detail' }}
      />
    </Stack.Navigator>
  );
}

/** Profile tab stack — includes Products, Categories, Customers, Payments, Stock */
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={sharedStackOptions}>
      <Stack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={{ title: 'Products' }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: 'Product Detail' }}
      />
      <Stack.Screen
        name="ProductForm"
        component={ProductFormScreen}
        options={({ route }) =>
          ({ title: route.params?.product ? 'Edit Product' : 'New Product' })
        }
      />
    </Stack.Navigator>
  );
}

/** Nested stack for the Categories tab */
function CategoriesStack() {
  return (
    <Stack.Navigator screenOptions={sharedStackOptions}>
      <Stack.Screen
        name="CategoryList"
        component={CategoryListScreen}
        options={{ title: 'Categories' }}
      />
      <Stack.Screen
        name="CategoryForm"
        component={CategoryFormScreen}
        options={({ route }) =>
          ({ title: route.params?.category ? 'Edit Category' : 'New Category' })
        }
      />
      {/* Customers */}
      <Stack.Screen
        name="CustomerList"
        component={CustomerListScreen}
        options={{ title: 'Customers' }}
      />
      <Stack.Screen
        name="CustomerDetail"
        component={CustomerDetailScreen}
        options={{ title: 'Customer Detail' }}
      />
      <Stack.Screen
        name="CustomerForm"
        component={CustomerFormScreen}
        options={({ route }) =>
          ({ title: route.params?.customerId ? 'Edit Customer' : 'New Customer' })
        }
      />
      {/* Orders (from customer detail) */}
      <Stack.Screen
        name="OrderList"
        component={OrdersScreen}
        options={{ title: 'Orders' }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'Order Detail' }}
      />
      {/* Payment History */}
      <Stack.Screen
        name="PaymentHistory"
        component={PaymentHistoryScreen}
        options={{ title: 'Payment History' }}
      />
      {/* Stock */}
      <Stack.Screen
        name="Stock"
        component={StockScreen}
        options={{ title: 'Stock Management' }}
      />
    </Stack.Navigator>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#547792',
        tabBarInactiveTintColor: '#94B4C1',
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name] ?? { active: 'circle', inactive: 'circle-outline' };
          return (
            <MaterialCommunityIcons
              name={focused ? icons.active : icons.inactive}
              size={focused ? 26 : 23}
              color={color}
            />
          );
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: -2,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: '#213448',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          height: Platform.OS === 'ios' ? 84 : 62,
          paddingTop: 4,
          paddingBottom: Platform.OS === 'ios' ? 24 : 6,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          ...sharedStackOptions,
          headerShown: true,
          title: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          ...sharedStackOptions,
          headerShown: true,
          title: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="POS"
        component={POSStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          ...sharedStackOptions,
          headerShown: true,
          title: 'My Profile',
        }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const token = useAuthStore((s) => s.token);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <Stack.Screen name="App" component={AppTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}
