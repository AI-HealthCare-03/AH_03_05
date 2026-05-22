import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { CommonActions } from "@react-navigation/native";
import Sidebar from "../../components/Sidebar";
import NotificationDrawer from "../../components/NotificationDrawer";
import Icon from "../../components/Icon";
import { useApp } from "../../context/AppContext";
import { colors, radii, shadows, spacing } from "../../theme";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import HomeNavigator from "./HomeNavigator";
import RecordsNavigator from "./RecordsNavigator";
import ChatNavigator from "./ChatNavigator";
import SettingsNavigator from "./SettingsNavigator";

const Tab = createBottomTabNavigator();

function FloatingBell() {
  const { unreadCount, setNotifDrawerOpen } = useApp();
  return (
    <TouchableOpacity style={nav.bell} onPress={() => setNotifDrawerOpen(true)}>
      <Icon name="bell" size={18} color={colors.ink2} />
      {unreadCount > 0 && (
        <View style={nav.bellDot}>
          <Text style={{ fontSize: 8, color: colors.white, fontWeight: "700" as const, lineHeight: 12 }}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

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
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: "HomeTab", state: { routes: [{ name: "Home" }] } }],
              }),
            );
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
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatNavigator}
        options={{
          title: "챗봇",
          tabBarIcon: ({ focused }) => <TabIcon name="chat" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsNavigator}
        options={{
          title: "마이",
          tabBarIcon: ({ focused }) => <TabIcon name="user" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  const { isDesktop } = useBreakpoint();

  if (!isDesktop) {
    return (
      <>
        <TabNavigator />
        <FloatingBell />
        <NotificationDrawer />
      </>
    );
  }

  return (
    <View style={nav.desktopShell}>
      <Sidebar />
      <View style={nav.desktopContent}>
        <TabNavigator />
      </View>
      <FloatingBell />
      <NotificationDrawer />
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
  bell: {
    position: "absolute",
    top: spacing.s16,
    right: spacing.s16,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.hairline,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.float,
  },
  bellDot: {
    position: "absolute",
    top: 5,
    right: 5,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
});
