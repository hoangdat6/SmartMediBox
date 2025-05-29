import { format } from "date-fns";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LogEntry, TimeOfDay } from "../types";

interface LogItemProps {
	timestamp: string;
	entry: LogEntry;
}

const cabinetLabels: Record<TimeOfDay, string> = {
	morning: "Tủ thuốc buổi sáng",
	noon: "Tủ thuốc buổi trưa",
	evening: "Tủ thuốc buổi tối",
};

export default function LogItem({ timestamp, entry }: LogItemProps) {
	// Format the timestamp to a readable date/time
	const formattedTime = format(new Date(timestamp), "dd/MM/yyyy HH:mm:ss");

	// Determine the cabinet text
	const cabinetText = entry.cabinet ? cabinetLabels[entry.cabinet] : "";

	// Translate event text
	const getVietnameseEvent = (event: string) => {
		if (event.toLowerCase().includes("open")) {
			return "Mở cửa tủ thuốc";
		} else if (event.toLowerCase().includes("close")) {
			return "Đóng cửa tủ thuốc";
		}
		return event;
	};

	return (
		<View style={styles.container}>
			<Text style={styles.timestamp}>{formattedTime}</Text>
			<View style={styles.detailsContainer}>
				<Text style={styles.event}>
					{getVietnameseEvent(entry.event)}
				</Text>
				{entry.cabinet && (
					<Text style={styles.cabinet}>{cabinetText}</Text>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: "white",
		borderRadius: 8,
		padding: 12,
		marginVertical: 6,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 1,
		elevation: 2,
	},
	timestamp: {
		fontSize: 12,
		color: "#666",
		marginBottom: 6,
	},
	detailsContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	event: {
		fontSize: 16,
		fontWeight: "500",
		flex: 1,
	},
	cabinet: {
		fontSize: 14,
		color: "#0066cc",
		fontWeight: "500",
	},
});
