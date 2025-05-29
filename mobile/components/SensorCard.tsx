import { useTheme } from "@/context/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface SensorCardProps {
	icon: string;
	title: string;
	value: string;
	color: string;
}

export function SensorCard({ icon, title, value, color }: SensorCardProps) {
	const { colors } = useTheme();

	return (
		<View
			style={[
				styles.card,
				{
					borderLeftColor: color,
					backgroundColor: colors.card,
				},
			]}
		>
			<MaterialCommunityIcons name={icon} size={32} color={color} />
			<View style={styles.content}>
				<Text style={[styles.title, { color: colors.cardText }]}>
					{title}
				</Text>
				<Text style={[styles.value, { color }]}>{value}</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		flexDirection: "row",
		alignItems: "center",
		padding: 15,
		borderRadius: 10,
		borderLeftWidth: 5,
		width: "48%",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	content: {
		marginLeft: 10,
	},
	title: {
		fontSize: 14,
	},
	value: {
		fontSize: 20,
		fontWeight: "bold",
		marginTop: 5,
	},
});
