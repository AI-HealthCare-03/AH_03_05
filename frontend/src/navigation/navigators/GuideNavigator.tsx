import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { GuideStackParams } from '../types';
import { GuideResultScreen } from '../../screens/guide/GuideResultScreen';
import GuideLoadingScreen from '../../screens/guide/GuideLoadingScreen';

const GuideStack = createNativeStackNavigator<GuideStackParams>();
const noHeader = { headerShown: false };

export default function GuideNavigator() {
  return (
    <GuideStack.Navigator screenOptions={noHeader}>
      <GuideStack.Screen name="GuideResult" component={GuideResultScreen} />
      <GuideStack.Screen name="GuideLoading" component={GuideLoadingScreen} />
    </GuideStack.Navigator>
  );
}
