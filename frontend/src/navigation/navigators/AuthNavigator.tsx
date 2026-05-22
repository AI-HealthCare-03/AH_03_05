import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParams } from '../types';
import LoginScreen from '../../screens/auth/LoginScreen';
import SignupScreen from '../../screens/auth/SignupScreen';
import ForgotPasswordScreen from '../../screens/auth/ForgotPasswordScreen';

const AuthStack = createNativeStackNavigator<AuthStackParams>();
const noHeader = { headerShown: false };

export default function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={noHeader}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}
