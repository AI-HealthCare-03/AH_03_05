import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { HomeStackParams } from "../types";
import HomeScreen from "../../screens/home/HomeScreen";
import OCRProcessingScreen from "../../screens/ocr/OCRProcessingScreen";
import { OCRResultScreen } from "../../screens/ocr/OCRResultScreen";
import { DrugSearchScreen } from "../../screens/ocr/DrugSearchScreen";
import { DrugDosageScreen } from "../../screens/ocr/DrugDosageScreen";
import { DrugDetailScreen } from "../../screens/ocr/DrugDetailScreen";
import GuideLoadingScreen from "../../screens/guide/GuideLoadingScreen";
import { GuideResultScreen } from "../../screens/guide/GuideResultScreen";
const HomeStack = createNativeStackNavigator<HomeStackParams>();
const noHeader = { headerShown: false };

export default function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={noHeader}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="OCRProcessing" component={OCRProcessingScreen} />
      <HomeStack.Screen name="OCRResult" component={OCRResultScreen} />
      <HomeStack.Screen name="DrugSearch" component={DrugSearchScreen} />
      <HomeStack.Screen name="DrugDosage" component={DrugDosageScreen} />
      <HomeStack.Screen name="DrugDetail" component={DrugDetailScreen} />
      <HomeStack.Screen name="GuideLoading" component={GuideLoadingScreen} />
      <HomeStack.Screen name="GuideResult" component={GuideResultScreen} />
    </HomeStack.Navigator>
  );
}
