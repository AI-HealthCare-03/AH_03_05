import React from "react";
import { View, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Sidebar from "../../components/Sidebar";
import Icon from "../../components/Icon";
import { colors } from "../../theme";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import HomeNavigator from "./HomeNavigator";
import RecordsNavigator from "./RecordsNavigator";
import GuideNavigator from "./GuideNavigator";
import ChatNavigator from "./ChatNavigator";
import SettingsNavigator from "./SettingsNavigator";

const Tab = createBottomTabNavigator();

const TAB_ROOT_SCREENS: Record<string, string> = {
  HomeTab: 'Home',
  RecordsTab: 'RecordList',
  GuideTab: 'GuideResult',
  ChatTab: 'ChatList',
  SettingsTab: 'Settings',
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <View>
      <Icon name={name} size={22} color={focused ? colors.accent : colors.muted} />
    </View>
  );
}

function TabNavigator() {
  const { isDesktop } = useBreakpoint();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: isDesktop
          ? { display: "none" }
          : {
              backgroundColor: colors.surface,
              borderTopColor: colors.hairline,
              borderTopWidth: 0.5,
              height: 80,
              paddingBottom: 20,
            },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" as const },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeNavigator}
        options={{
          title: "홈",
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            const isFocused = navigation.isFocused();
            if (isFocused) return;
            e.preventDefault();
            navigation.reset({ index: 0, routes: [{ name: route.name, state: { index: 0, routes: [{ name: TAB_ROOT_SCREENS[route.name] }] } }] });
          },
        })}
      />
      <Tab.Screen
        name="RecordsTab"
        component={RecordsNavigator}
        options={{
          title: "진료기록",
          tabBarIcon: ({ focused }) => <TabIcon name="doc" focused={focused} />,
        }}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            const isFocused = navigation.isFocused();
            if (isFocused) return;
            e.preventDefault();
            navigation.reset({ index: 0, routes: [{ name: route.name, state: { index: 0, routes: [{ name: TAB_ROOT_SCREENS[route.name] }] } }] });
          },
        })}
      />
      <Tab.Screen
        name="GuideTab"
        component={GuideNavigator}
        options={{
          title: "가이드",
          tabBarIcon: ({ focused }) => <TabIcon name="wand" focused={focused} />,
        }}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            const isFocused = navigation.isFocused();
            if (isFocused) return;
            e.preventDefault();
            navigation.reset({ index: 0, routes: [{ name: route.name, state: { index: 0, routes: [{ name: TAB_ROOT_SCREENS[route.name] }] } }] });
          },
        })}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatNavigator}
        options={{
          title: "챗봇",
          tabBarIcon: ({ focused }) => <TabIcon name="chat" focused={focused} />,
        }}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            const isFocused = navigation.isFocused();
            if (isFocused) return;
            e.preventDefault();
            navigation.reset({ index: 0, routes: [{ name: route.name, state: { index: 0, routes: [{ name: TAB_ROOT_SCREENS[route.name] }] } }] });
          },
        })}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsNavigator}
        options={{
          title: "마이",
          tabBarIcon: ({ focused }) => <TabIcon name="user" focused={focused} />,
        }}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            const isFocused = navigation.isFocused();
            if (isFocused) return;
            e.preventDefault();
            navigation.reset({ index: 0, routes: [{ name: route.name, state: { index: 0, routes: [{ name: TAB_ROOT_SCREENS[route.name] }] } }] });
          },
        })}
      />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  const { isDesktop } = useBreakpoint();

  if (!isDesktop) {
    return <TabNavigator />;
  }

  return (
    <View style={nav.desktopShell}>
      <Sidebar />
      <View style={nav.desktopContent}>
        <TabNavigator />
      </View>
    </View>
  );
}

const nav = StyleSheet.create({
  desktopShell: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.canvas,
  },
  desktopContent: {
    flex: 1,
    overflow: "hidden" as const,
  },
});
