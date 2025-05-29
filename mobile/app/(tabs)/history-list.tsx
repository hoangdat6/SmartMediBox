import { Header } from "@/components/Header";
import { useTheme } from "@/context/ThemeContext";
import { HistoryValue, useHistoryData } from "@/hooks/useHistoryData";
import { useSettingsStore } from "@/stores/settingsStore";
import { TimeOfDay } from "@/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
	ActivityIndicator,
	FlatList,
	RefreshControl,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Helper function to format ISO date string to readable format
const formatDateTime = (
	dateStr: string,
	timeStr: string
): { formattedDate: string; formattedTime: string } => {
	try {
		const dateTime = new Date(`${dateStr}T${timeStr}`);

		// Format date: DD/MM/YYYY
		const day = dateTime.getDate().toString().padStart(2, "0");
		const month = (dateTime.getMonth() + 1).toString().padStart(2, "0");
		const year = dateTime.getFullYear();
		const formattedDate = `${day}/${month}/${year}`;

		// Format time: HH:MM:SS
		const hours = dateTime.getHours().toString().padStart(2, "0");
		const minutes = dateTime.getMinutes().toString().padStart(2, "0");
		const seconds = dateTime.getSeconds().toString().padStart(2, "0");
		const formattedTime = `${hours}:${minutes}:${seconds}`;

		return { formattedDate, formattedTime };
	} catch (error) {
		console.error("Error formatting date:", error, dateStr, timeStr);
		return { formattedDate: dateStr, formattedTime: timeStr };
	}
};

interface HistoryItemProps {
	date: string;
	time: string;
	data: HistoryValue;
	temperatureThreshold: number;
	humidityThreshold: number;
	isDarkMode: boolean;
	colors: any;
}

const HistoryItem: React.FC<HistoryItemProps> = ({
	date,
	time,
	data,
	temperatureThreshold,
	humidityThreshold,
	isDarkMode,
	colors,
}) => {
	// Format date and time for display
	const { formattedDate, formattedTime } = formatDateTime(date, time);

	// Check if status is abnormal
	const isTemperatureAbnormal =
		data.temperature >= (data.temperatureThreshold || temperatureThreshold);
	const isHumidityAbnormal =
		data.humidity >= (data.humidityThreshold || humidityThreshold);
	const isAbnormal = isTemperatureAbnormal || isHumidityAbnormal;

	// Function to get cabinet name for display
	const getCabinetName = (cabinet?: TimeOfDay): string => {
		if (!cabinet) return "";

		switch (cabinet) {
			case "morning":
				return "Buổi sáng";
			case "noon":
				return "Buổi trưa";
			case "evening":
				return "Buổi tối";
			default:
				return cabinet;
		}
	};

	return (
		<View
			style={[
				styles.itemContainer,
				{ backgroundColor: isDarkMode ? "#333" : "#fff" },
			]}
		>
			<View style={styles.itemHeader}>
				<Text style={[styles.itemDate, { color: colors.text }]}>
					{formattedDate} | {formattedTime}
				</Text>
				<View
					style={[
						styles.statusBadge,
						{
							backgroundColor: isAbnormal
								? isDarkMode
									? "#5C2323"
									: "#FFEBEE"
								: isDarkMode
								? "#2E3B2E"
								: "#E8F5E9",
						},
					]}
				>
					<Text
						style={[
							styles.statusText,
							{
								color: isAbnormal
									? isDarkMode
										? "#FF8A80"
										: "#C62828"
									: isDarkMode
									? "#A5D6A7"
									: "#2E7D32",
							},
						]}
					>
						{isAbnormal ? "Bất thường" : "Bình thường"}
					</Text>
				</View>
			</View>

			<View style={styles.dataRow}>
				<View style={styles.dataItem}>
					<MaterialCommunityIcons
						name="thermometer"
						size={18}
						color={
							isTemperatureAbnormal ? "#FF5252" : colors.primary
						}
					/>
					<Text style={[styles.dataLabel, { color: colors.text }]}>
						Nhiệt độ:{" "}
						<Text
							style={{
								color: isTemperatureAbnormal
									? "#FF5252"
									: colors.text,
								fontWeight: isTemperatureAbnormal
									? "bold"
									: "normal",
							}}
						>
							{data?.temperature !== undefined
								? `${data.temperature} °C`
								: "N/A"}
						</Text>
					</Text>
				</View>

				<View style={styles.dataItem}>
					<MaterialCommunityIcons
						name="water-percent"
						size={18}
						color={isHumidityAbnormal ? "#FF5252" : colors.primary}
					/>
					<Text style={[styles.dataLabel, { color: colors.text }]}>
						Độ ẩm:{" "}
						<Text
							style={{
								color: isHumidityAbnormal
									? "#FF5252"
									: colors.text,
								fontWeight: isHumidityAbnormal
									? "bold"
									: "normal",
							}}
						>
							{data?.humidity !== undefined
								? `${data.humidity}%`
								: "N/A"}
						</Text>
					</Text>
				</View>
			</View>

			<View style={styles.dataRow}>
				<View style={styles.dataItem}>
					<MaterialCommunityIcons
						name="alert-circle-outline"
						size={18}
						color={colors.primary}
					/>
					<Text style={[styles.dataLabel, { color: colors.text }]}>
						Ngưỡng nhiệt:{" "}
						<Text>
							{data.temperatureThreshold || temperatureThreshold}
							°C
						</Text>
					</Text>
				</View>

				<View style={styles.dataItem}>
					<MaterialCommunityIcons
						name="alert-circle-outline"
						size={18}
						color={colors.primary}
					/>
					<Text style={[styles.dataLabel, { color: colors.text }]}>
						Ngưỡng ẩm:{" "}
						<Text>
							{data.humidityThreshold || humidityThreshold}%
						</Text>
					</Text>
				</View>
			</View>

			{data.cabinetOpened && (
				<View style={styles.cabinetRow}>
					<MaterialCommunityIcons
						name="pill"
						size={18}
						color={colors.primary}
					/>
					<Text style={[styles.dataLabel, { color: colors.text }]}>
						Ngăn thuốc {getCabinetName(data.cabinetOpened)} đã được
						mở
					</Text>
				</View>
			)}
		</View>
	);
};

export default function HistoryListScreen() {
	const { colors, theme } = useTheme();
	const isDarkMode = theme === "dark";
	const { historyData, loading, error } = useHistoryData();
	const [refreshing, setRefreshing] = React.useState(false);
	const { settings } = useSettingsStore();

	// Default thresholds from settings
	const temperatureThreshold = settings?.alertThresholds.temperature || 35;
	const humidityThreshold = settings?.alertThresholds.humidity || 65;

	// Handle refresh
	const onRefresh = async () => {
		setRefreshing(true);
		// The useHistoryData hook automatically refreshes when the component is mounted
		// Just wait a bit to simulate a refresh
		setTimeout(() => setRefreshing(false), 1000);
	};

	// Flatten history data for FlatList
	const flattenedData = useMemo(() => {
		if (!historyData) return [];

		const flattened: {
			id: string;
			date: string;
			time: string;
			data: HistoryValue;
		}[] = [];

		Object.entries(historyData).forEach(([date, dayData]) => {
			Object.entries(dayData).forEach(([time, timeData]) => {
				// Only add items with valid data
				if (
					timeData &&
					(timeData.temperature !== undefined ||
						timeData.humidity !== undefined)
				) {
					flattened.push({
						id: `${date}-${time}`,
						date,
						time,
						data: timeData,
					});
				} else {
					console.warn(
						"Skipping invalid data point:",
						date,
						time,
						timeData
					);
				}
			});
		});

		// Sort by date and time (newest first)
		return flattened.sort((a, b) => {
			const dateA = new Date(`${a.date}T${a.time}`);
			const dateB = new Date(`${b.date}T${b.time}`);
			return dateB.getTime() - dateA.getTime();
		});
	}, [historyData]);

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: colors.background }]}
			edges={["bottom"]}
		>
			<Header title="Lịch sử (Danh sách)" />

			<View style={styles.contentContainer}>
				{loading && !refreshing ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator
							size="large"
							color={colors.primary}
						/>
						<Text
							style={[styles.loadingText, { color: colors.text }]}
						>
							Đang tải dữ liệu...
						</Text>
					</View>
				) : error ? (
					<View style={styles.errorContainer}>
						<MaterialCommunityIcons
							name="alert-circle-outline"
							size={48}
							color="#FF5252"
						/>
						<Text style={styles.errorText}>{error}</Text>
						<TouchableOpacity
							style={styles.reloadButton}
							onPress={onRefresh}
						>
							<Text style={styles.reloadButtonText}>Thử lại</Text>
						</TouchableOpacity>
					</View>
				) : !historyData || flattenedData.length === 0 ? (
					<View style={styles.emptyContainer}>
						<MaterialCommunityIcons
							name="history"
							size={48}
							color={isDarkMode ? "#666" : "#CCC"}
						/>
						<Text
							style={[
								styles.emptyText,
								{ color: isDarkMode ? "#AAA" : "#666" },
							]}
						>
							Chưa có dữ liệu lịch sử
						</Text>
						<TouchableOpacity
							style={styles.reloadButton}
							onPress={onRefresh}
						>
							<Text style={styles.reloadButtonText}>Tải lại</Text>
						</TouchableOpacity>
					</View>
				) : (
					<>
						<TouchableOpacity
							style={[
								styles.reloadButtonSmall,
								{
									backgroundColor: isDarkMode
										? "#444"
										: "#f0f0f0",
								},
							]}
							onPress={onRefresh}
						>
							<MaterialCommunityIcons
								name="refresh"
								size={16}
								color={colors.primary}
							/>
							<Text
								style={[
									styles.reloadButtonTextSmall,
									{ color: colors.primary },
								]}
							>
								Tải lại dữ liệu
							</Text>
						</TouchableOpacity>

						<FlatList
							data={flattenedData}
							keyExtractor={(item) => item.id}
							renderItem={({ item }) => (
								<HistoryItem
									date={item.date}
									time={item.time}
									data={item.data}
									temperatureThreshold={temperatureThreshold}
									humidityThreshold={humidityThreshold}
									isDarkMode={isDarkMode}
									colors={colors}
								/>
							)}
							contentContainerStyle={styles.listContent}
							refreshControl={
								<RefreshControl
									refreshing={refreshing}
									onRefresh={onRefresh}
									colors={[colors.primary]}
									tintColor={colors.primary}
								/>
							}
						/>
					</>
				)}
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	contentContainer: {
		flex: 1,
		padding: 16,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	loadingText: {
		marginTop: 10,
		fontSize: 16,
	},
	errorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	errorText: {
		color: "#FF5252",
		fontSize: 16,
		textAlign: "center",
		marginTop: 10,
		marginBottom: 20,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	emptyText: {
		fontSize: 16,
		textAlign: "center",
		marginTop: 10,
		marginBottom: 20,
	},
	reloadButton: {
		backgroundColor: "#2196F3",
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 5,
	},
	reloadButtonText: {
		color: "#FFF",
		fontWeight: "bold",
	},
	reloadButtonSmall: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		padding: 8,
		borderRadius: 5,
		marginBottom: 10,
	},
	reloadButtonTextSmall: {
		fontSize: 14,
		marginLeft: 5,
	},
	listContent: {
		paddingBottom: 20,
	},
	itemContainer: {
		marginBottom: 12,
		borderRadius: 8,
		padding: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
		minHeight: 150, // Ensure enough height for all content
	},
	itemHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 12,
	},
	itemDate: {
		fontSize: 14,
		fontWeight: "500",
	},
	statusBadge: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
	},
	statusText: {
		fontSize: 12,
		fontWeight: "bold",
	},
	dataRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 12, // Increased spacing between rows
	},
	dataItem: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1, // Allow items to take equal space
	},
	cabinetRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 8, // Increased spacing
	},
	dataLabel: {
		fontSize: 14,
		marginLeft: 5,
		flexWrap: "wrap", // Allow text to wrap
		flex: 1, // Take available space
	},
});
