import React from 'react';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from './src/components/Toast';

export default function App() {
  return (
    <AppProvider>
      <AppNavigator />
      <Toast />
    </AppProvider>
  );
}
