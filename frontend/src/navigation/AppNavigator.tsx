import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useApp } from "../context/AppContext";
import type { RootStackParams } from "./types";
import AuthNavigator from "./navigators/AuthNavigator";
import OnboardingNavigator from "./navigators/OnboardingNavigator";
import MainNavigator from "./navigators/TabNavigator";

const RootStack = createNativeStackNavigator<RootStackParams>();
const noHeader = { headerShown: false };

export default function AppNavigator() {
  const { user } = useApp();

  const initialRoute: keyof RootStackParams = !user.loggedIn ? "Auth" : !user.profileComplete ? "Onboarding" : "Main";

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={noHeader} initialRouteName={initialRoute}>
        <RootStack.Screen name="Auth" component={AuthNavigator} />
        <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        <RootStack.Screen name="Main" component={MainNavigator} />
        <RootStack.Screen name="UploadModal" component={UploadModalScreen} options={{ presentation: "transparentModal" }} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
