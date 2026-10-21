import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

export function resetTo(name, params) {
  if (name === 'Auth') {
    // RootNavigator renders "Auth" only when there is no token, so clearing
    // the auth store is what switches to the login flow.
    require('../store/authStore').default.getState().clearAuth?.();
    return;
  }
  if (navigationRef.isReady() && navigationRef.getRootState()?.routeNames?.includes(name)) {
    navigationRef.reset({
      index: 0,
      routes: [{ name, params }],
    });
  }
}
