import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/** Nested stack for the POS tab */
function POSStack() {
  return (
    <Stack.Navigator>
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
    <Stack.Navigator>
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

/** Nested stack for the Products tab */
function ProductsStack() {
  return (
    <Stack.Navigator>
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
    <Stack.Navigator>
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
    </Stack.Navigator>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#547792',
        tabBarInactiveTintColor: '#94B4C1',
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen
        name="POS"
        component={POSStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesStack}
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
        options={{ headerShown: true, title: 'My Profile' }}
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
