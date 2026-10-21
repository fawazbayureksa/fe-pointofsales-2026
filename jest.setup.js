// Mock expo-secure-store globally
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock the navigation ref to avoid issues in non-rendered tests
jest.mock('./src/navigation/navigationRef', () => ({
  navigationRef: { isReady: jest.fn(() => false) },
  navigate: jest.fn(),
  resetTo: jest.fn(),
}));

// Mock @expo/vector-icons for UI unit tests
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const MockIcon = (props) => React.createElement(Text, props, props.name || 'icon');
  return {
    MaterialCommunityIcons: MockIcon,
    Ionicons: MockIcon,
    FontAwesome: MockIcon,
    Feather: MockIcon,
  };
});

// Suppress react-native-paper icon warning in Jest environment
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Tried to use the icon')) return;
  originalWarn(...args);
};
