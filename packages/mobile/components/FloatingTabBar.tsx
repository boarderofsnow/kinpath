import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors, fonts, radii, shadows } from "../lib/theme";

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label = options.title ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tabItem, isFocused && styles.tabItemActive]}
            >
              {options.tabBarIcon?.({
                focused: isFocused,
                color: isFocused ? colors.white : colors.stone[500],
                size: 20,
              })}
              <Text
                style={[styles.tabLabel, isFocused && styles.tabLabelActive]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 28 : 16,
    left: 24,
    right: 24,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.stone[100],
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.stone[300],
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
    ...shadows.navBar,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: radii.xl,
    gap: 2,
  },
  tabItemActive: {
    backgroundColor: colors.brand[500],
    ...(Platform.OS === "ios"
      ? {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        }
      : { elevation: 2 }),
  },
  tabLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.stone[500],
  },
  tabLabelActive: {
    color: colors.white,
  },
});
