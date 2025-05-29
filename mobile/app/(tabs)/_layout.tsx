import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { useTheme } from "@/context/ThemeContext";

export default function TabLayout() {
	const { colors, theme } = useTheme();

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: colors.primary,
				tabBarInactiveTintColor: theme === "dark" ? "#888" : "#999",
				headerShown: false,
				tabBarButton: HapticTab,
				tabBarBackground: TabBarBackground,
				tabBarStyle: Platform.select({
					ios: {
						// Use a transparent background on iOS to show the blur effect
						position: "absolute",
						backgroundColor:
							theme === "dark"
								? "rgba(18, 18, 18, 0.9)"
								: undefined,
					},
					default: {
						backgroundColor:
							theme === "dark" ? "#1E1E1E" : "#FFFFFF",
					},
				}),
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Dashboard",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name="home"
							size={28}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="monitor"
				options={{
					title: "Monitor",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name="chart-line"
							size={28}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="history"
				options={{
					title: "History",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name="chart-bar"
							size={28}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="notifications"
				options={{
					title: "Alerts",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name="bell"
							size={28}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: "Settings",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name="cog"
							size={28}
							color={color}
						/>
					),
				}}
			/>
		</Tabs>
	);
}
