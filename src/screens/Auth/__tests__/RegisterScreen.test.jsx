import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../RegisterScreen';
import useAuth from '../../../hooks/useAuth';

jest.mock('../../../hooks/useAuth');
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium', Light: 'light' },
  NotificationFeedbackType: { Error: 'error', Success: 'success' },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 20, bottom: 20, left: 0, right: 0 }),
}));

describe('RegisterScreen', () => {
  const mockRegister = jest.fn();
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn(() => true),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      register: mockRegister,
      isLoading: false,
    });
  });

  it('renders all form input fields and registration button', () => {
    const { getByPlaceholderText, getByText } = render(
      <RegisterScreen navigation={mockNavigation} />,
    );

    expect(getByPlaceholderText('Budi Santoso')).toBeTruthy();
    expect(getByPlaceholderText('Kopi Nusantara')).toBeTruthy();
    expect(getByPlaceholderText('budi@kopinusantara.id')).toBeTruthy();
    expect(getByPlaceholderText('081234567890')).toBeTruthy();
    expect(getByPlaceholderText('At least 8 characters')).toBeTruthy();
    expect(getByPlaceholderText('Confirm password')).toBeTruthy();
    expect(getByText('Create Account')).toBeTruthy();
  });

  it('shows validation errors when submitting with empty required fields', async () => {
    const { getByText, getByPlaceholderText } = render(
      <RegisterScreen navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Budi Santoso'), '   ');
    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(getByText('Full name is required')).toBeTruthy();
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('validates invalid email format', async () => {
    const { getByText, getByPlaceholderText } = render(
      <RegisterScreen navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Budi Santoso'), 'Budi Santoso');
    fireEvent.changeText(getByPlaceholderText('budi@kopinusantara.id'), 'invalid-email');
    fireEvent.changeText(getByPlaceholderText('At least 8 characters'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'password123');

    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(getByText('Please enter a valid email address')).toBeTruthy();
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('validates password length < 8 chars', async () => {
    const { getByText, getByPlaceholderText } = render(
      <RegisterScreen navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Budi Santoso'), 'Budi Santoso');
    fireEvent.changeText(getByPlaceholderText('budi@kopinusantara.id'), 'budi@kopinusantara.id');
    fireEvent.changeText(getByPlaceholderText('At least 8 characters'), '12345');
    fireEvent.changeText(getByPlaceholderText('Confirm password'), '12345');

    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(getByText('Password must be at least 8 characters')).toBeTruthy();
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('validates password confirmation mismatch', async () => {
    const { getByText, getByPlaceholderText } = render(
      <RegisterScreen navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Budi Santoso'), 'Budi Santoso');
    fireEvent.changeText(getByPlaceholderText('budi@kopinusantara.id'), 'budi@kopinusantara.id');
    fireEvent.changeText(getByPlaceholderText('At least 8 characters'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'password456');

    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(getByText('The password confirmation does not match')).toBeTruthy();
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('submits valid registration payload successfully', async () => {
    mockRegister.mockResolvedValueOnce({
      message: 'Tenant registered successfully.',
      token: 'mock-token',
    });

    const { getByText, getByPlaceholderText } = render(
      <RegisterScreen navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Budi Santoso'), 'Budi Santoso');
    fireEvent.changeText(getByPlaceholderText('Kopi Nusantara'), 'Kopi Nusantara');
    fireEvent.changeText(getByPlaceholderText('budi@kopinusantara.id'), 'budi@kopinusantara.id');
    fireEvent.changeText(getByPlaceholderText('081234567890'), '081234567890');
    fireEvent.changeText(getByPlaceholderText('At least 8 characters'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'password123');

    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Budi Santoso',
        business_name: 'Kopi Nusantara',
        email: 'budi@kopinusantara.id',
        phone: '081234567890',
        password: 'password123',
        password_confirmation: 'password123',
      });
    });
  });

  it('displays 422 error from server response', async () => {
    mockRegister.mockRejectedValueOnce({
      status: 422,
      message: 'The email has already been taken.',
      errors: {
        email: ['The email has already been taken.'],
      },
    });

    const { getAllByText, getByPlaceholderText, getByText } = render(
      <RegisterScreen navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Budi Santoso'), 'Budi Santoso');
    fireEvent.changeText(getByPlaceholderText('budi@kopinusantara.id'), 'budi@kopinusantara.id');
    fireEvent.changeText(getByPlaceholderText('At least 8 characters'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'password123');

    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(getAllByText('The email has already been taken.').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('displays general error banner when server error occurs', async () => {
    mockRegister.mockRejectedValueOnce({
      status: 500,
      message: 'Unable to connect to server. Please check your connection.',
    });

    const { getAllByText, getByPlaceholderText, getByText } = render(
      <RegisterScreen navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Budi Santoso'), 'Budi Santoso');
    fireEvent.changeText(getByPlaceholderText('budi@kopinusantara.id'), 'budi@kopinusantara.id');
    fireEvent.changeText(getByPlaceholderText('At least 8 characters'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'password123');

    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(
        getAllByText('Unable to connect to server. Please check your connection.').length,
      ).toBeGreaterThanOrEqual(1);
    });
  });

  it('navigates back to Login on Sign In press', () => {
    const { getByText } = render(
      <RegisterScreen navigation={mockNavigation} />,
    );

    fireEvent.press(getByText('Sign In'));
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });
});
