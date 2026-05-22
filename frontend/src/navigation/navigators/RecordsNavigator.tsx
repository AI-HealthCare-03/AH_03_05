import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RecordsStackParams } from '../types';
import RecordListScreen from '../../screens/records/RecordListScreen';
import { RecordDetailScreen } from '../../screens/records/RecordDetailScreen';
import { DrugDosageScreen } from '../../screens/ocr/DrugDosageScreen';

const RecordsStack = createNativeStackNavigator<RecordsStackParams>();
const noHeader = { headerShown: false };

export default function RecordsNavigator() {
  return (
    <RecordsStack.Navigator screenOptions={noHeader}>
      <RecordsStack.Screen name="RecordList" component={RecordListScreen} />
      <RecordsStack.Screen name="RecordDetail" component={RecordDetailScreen} />
      <RecordsStack.Screen name="DrugDosage" component={DrugDosageScreen} />
    </RecordsStack.Navigator>
  );
}
