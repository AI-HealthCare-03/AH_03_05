import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { OnboardingStackParams } from '../types';
import OnboardingScreen from '../../screens/onboarding/OnboardingScreen';

const OnboardingStack = createNativeStackNavigator<OnboardingStackParams>();
const noHeader = { headerShown: false };

export default function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={noHeader}>
      <OnboardingStack.Screen
        name="OnboardingStep"
        component={OnboardingScreen}
        initialParams={{ step: 1 }}
      />
    </OnboardingStack.Navigator>
  );
}
