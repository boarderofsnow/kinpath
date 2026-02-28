import React from "react";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radii } from "../../lib/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand[500],
        tabBarInactiveTintColor: colors.stone[400],
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarBackground: () => <View style={styles.tabBarBg} />,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="browse"
        options={{
          title: "Browse",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="checklist"
        options={{
          title: "Checklist",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 28 : 16,
    left: 32,
    right: 32,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    borderTopWidth: 0,
    paddingBottom: 0,
    ...(Platform.OS === "ios"
      ? {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
        }
      : { elevation: 12 }),
  },
  tabBarBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.white,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: `${colors.stone[200]}40`,
  },
  tabBarItem: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  tabBarLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    marginTop: 2,
  },
});
