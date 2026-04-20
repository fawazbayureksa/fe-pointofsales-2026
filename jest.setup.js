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
