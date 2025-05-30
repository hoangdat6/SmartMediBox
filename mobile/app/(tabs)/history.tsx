import { Header } from "@/components/Header";
import TimeSeriesChart, {
	TimeSeriesDataPoint,
} from "@/components/monitor/time-series-chart";
import { useTheme } from "@/context/ThemeContext";
import { useHistoryData } from "@/hooks/useHistoryData";
import { useSettingsStore } from "@/stores/settingsStore";
import { TimeOfDay } from "@/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface OpeningEvent {
	time: string;
	cabinet: TimeOfDay;
}

// Define a type for time scale options
type TimeScale = "realtime" | "day" | "hour";

export default function HistoryScreen() {
	const { colors, theme } = useTheme();
	const { historyData, loading, error } = useHistoryData();
	const { settings } = useSettingsStore(); // Get settings for thresholds
	const isDarkMode = theme === "dark";

	// Get a list of available dates from history data
	const availableDates = Object.keys(historyData || {}).sort(
		(a, b) => new Date(b).getTime() - new Date(a).getTime()
	);

	// Initialize with the first available date from the data or today's date as fallback
	const [selectedDate, setSelectedDate] = useState<string>(() => {
		// Use the first date from the data if available, otherwise use today's date
		if (availableDates.length > 0) {
			return availableDates[0]; // Most recent date
		}
		return format(new Date(), "yyyy-MM-dd");
	});

	// Add state for time scale selection
	const [timeScale, setTimeScale] = useState<TimeScale>("realtime");

	// Update selectedDate when availableDates changes
	useEffect(() => {
		if (
			availableDates.length > 0 &&
			!availableDates.includes(selectedDate)
		) {
			setSelectedDate(availableDates[0]);
		}
	}, [availableDates, selectedDate]);

	const [displayMode, setDisplayMode] = useState<"temperature" | "humidity">(
		"temperature"
	);

	// Function to aggregate data by hour (for day view)
	const aggregateDataByHour = (): TimeSeriesDataPoint[] => {
		if (!historyData) return [];

		// Create an object to store aggregated data for each hour
		const hourlyData: Record<
			string,
			{
				sum: number;
				count: number;
				thresholds: { temperature: number; humidity: number };
			}
		> = {};
		// Process all available dates
		Object.keys(historyData).forEach((date) => {
			// For each timepoint in the date
			Object.entries(historyData[date]).forEach(([time, values]) => {
				// Extract hour from time (format: HH:MM:SS)
				const hourMatch = time.match(/^(\d{1,2}):/);
				if (!hourMatch) return;

				const hour = hourMatch[1].padStart(2, "0");
				const key = `${hour}:00`;

				// Initialize if not exists
				if (!hourlyData[key]) {
					hourlyData[key] = {
						sum: 0,
						count: 0,
						thresholds: {
							temperature: values.temperatureThreshold || 0,
							humidity: values.humidityThreshold || 0,
						},
					};
				}

				// Add the current value to the sum based on display mode
				const value =
					displayMode === "temperature"
						? values.temperature
						: values.humidity;
				if (typeof value === "number" && !isNaN(value)) {
					hourlyData[key].sum += value;
					hourlyData[key].count += 1;

					// Update thresholds with the latest values
					if (values.temperatureThreshold) {
						hourlyData[key].thresholds.temperature =
							values.temperatureThreshold;
					}
					if (values.humidityThreshold) {
						hourlyData[key].thresholds.humidity =
							values.humidityThreshold;
					}
				}
			});
		});

		// Convert to array of data points
		return Object.entries(hourlyData)
			.map(([hour, data]) => ({
				x: hour,
				y: data.count > 0 ? data.sum / data.count : 0,
				temperatureThreshold: data.thresholds.temperature,
				humidityThreshold: data.thresholds.humidity,
			}))
			.sort((a, b) => {
				// Sort by hour
				const hourA = parseInt(a.x.toString().split(":")[0]);
				const hourB = parseInt(b.x.toString().split(":")[0]);
				return hourA - hourB;
			});
	};

	// Function to aggregate data by minute (for hour view)
	const aggregateDataByMinute = (): TimeSeriesDataPoint[] => {
		if (!historyData) return [];

		// Create an object to store aggregated data for each minute
		const minutelyData: Record<
			string,
			{
				sum: number;
				count: number;
				thresholds: { temperature: number; humidity: number };
			}
		> = {};

		// Process all available dates
		Object.keys(historyData).forEach((date) => {
			// For each timepoint in the date
			Object.entries(historyData[date]).forEach(([time, values]) => {
				// Extract hour and minute from time (format: HH:MM:SS)
				const timeMatch = time.match(/^(\d{1,2}):(\d{1,2}):/);
				if (!timeMatch) return;

				const hour = timeMatch[1].padStart(2, "0");
				const minute = timeMatch[2].padStart(2, "0");
				const key = `${hour}:${minute}`;

				// Initialize if not exists
				if (!minutelyData[key]) {
					minutelyData[key] = {
						sum: 0,
						count: 0,
						thresholds: {
							temperature: values.temperatureThreshold || 0,
							humidity: values.humidityThreshold || 0,
						},
					};
				}

				// Add the current value to the sum based on display mode
				const value =
					displayMode === "temperature"
						? values.temperature
						: values.humidity;
				if (typeof value === "number" && !isNaN(value)) {
					minutelyData[key].sum += value;
					minutelyData[key].count += 1;

					// Update thresholds with the latest values
					if (values.temperatureThreshold) {
						minutelyData[key].thresholds.temperature =
							values.temperatureThreshold;
					}
					if (values.humidityThreshold) {
						minutelyData[key].thresholds.humidity =
							values.humidityThreshold;
					}
				}
			});
		});

		// Convert to array of data points
		return Object.entries(minutelyData)
			.map(([timeKey, data]) => ({
				x: timeKey,
				y: data.count > 0 ? data.sum / data.count : 0,
				temperatureThreshold: data.thresholds.temperature,
				humidityThreshold: data.thresholds.humidity,
			}))
			.sort((a, b) => {
				// Sort by hour and minute
				const [hourA, minuteA] = a.x.toString().split(":").map(Number);
				const [hourB, minuteB] = b.x.toString().split(":").map(Number);
				if (hourA !== hourB) return hourA - hourB;
				return minuteA - minuteB;
			});
	};

	// Function to format chart data from history - limit to most recent 50 points
	const getChartData = (): TimeSeriesDataPoint[] => {
		// If using day or hour view, return aggregated data
		if (timeScale === "day") {
			return aggregateDataByHour();
		} else if (timeScale === "hour") {
			return aggregateDataByMinute();
		}

		// Real-time view (original implementation)
		if (!historyData || !historyData[selectedDate]) return [];

		// Extract timepoints and values for selected date and mode
		const data = Object.entries(historyData[selectedDate]).map(
			([time, values]) => {
				const value =
					displayMode === "temperature"
						? values.temperature
						: values.humidity;

				// Include threshold values from history data
				return {
					x: time,
					y: value,
					temperatureThreshold: values.temperatureThreshold,
					humidityThreshold: values.humidityThreshold,
				};
			}
		);

		// Sort by time including milliseconds - ensure we're using a proper time comparison
		const sortedData = data.sort((a, b) => {
			// Get the time strings
			const timeA = a.x.toString();
			const timeB = b.x.toString();

			// Parse the time strings into milliseconds for comparison
			const getTimeInMilliseconds = (timeStr: string): number => {
				const parts = timeStr.split(":");
				const secondsParts = parts[2]
					? parts[2].split(".")
					: ["0", "0"];
				const hours = parseInt(parts[0]) || 0;
				const minutes = parseInt(parts[1]) || 0;
				const seconds = parseInt(secondsParts[0]) || 0;
				const milliseconds = parseInt(secondsParts[1]) || 0;

				return (
					hours * 3600000 +
					minutes * 60000 +
					seconds * 1000 +
					milliseconds
				);
			};

			return getTimeInMilliseconds(timeA) - getTimeInMilliseconds(timeB);
		});

		// Take only the most recent 50 data points
		const recentData = sortedData.slice(-100);

		// Log the number of data points we're displaying
		console.log(
			`Displaying ${recentData.length} of ${sortedData.length} data points for ${selectedDate}`
		);

		return recentData;
	};

	// Auto-update selected date when new data comes in
	useEffect(() => {
		// If we're generating data and today's date is available
		if (availableDates.includes(format(new Date(), "yyyy-MM-dd"))) {
			// Switch to today's date to see real-time updates
			setSelectedDate(format(new Date(), "yyyy-MM-dd"));
		}
	}, [historyData, availableDates]);

	// Get opening events from history
	const getOpeningEvents = (): OpeningEvent[] => {
		if (!historyData || !historyData[selectedDate]) return [];

		return Object.entries(historyData[selectedDate])
			.filter(([_, values]) => values.cabinetOpened)
			.map(([time, values]) => ({
				time,
				cabinet: values.cabinetOpened as TimeOfDay,
			}));
	};

	// Get previous date
	const getPreviousDate = () => {
		const currentIndex = availableDates.indexOf(selectedDate);
		if (currentIndex < availableDates.length - 1) {
			setSelectedDate(availableDates[currentIndex + 1]);
		}
	};

	// Get next date
	const getNextDate = () => {
		const currentIndex = availableDates.indexOf(selectedDate);
		if (currentIndex > 0) {
			setSelectedDate(availableDates[currentIndex - 1]);
		}
	};

	// Get cabinet name for display
	const getCabinetName = (cabinet: TimeOfDay): string => {
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

	// Get title for chart based on time scale
	const getChartTitle = (): string => {
		switch (timeScale) {
			case "day":
				return displayMode === "temperature"
					? "Nhiệt độ trung bình theo giờ (°C)"
					: "Độ ẩm trung bình theo giờ (%)";
			case "hour":
				return displayMode === "temperature"
					? "Nhiệt độ trung bình theo phút (°C)"
					: "Độ ẩm trung bình theo phút (%)";
			default:
				return displayMode === "temperature"
					? "Nhiệt độ (°C)"
					: "Độ ẩm (%)";
		}
	};

	// Get x-axis label based on time scale
	const getXAxisLabel = (): string => {
		switch (timeScale) {
			case "day":
				return "Giờ trong ngày";
			case "hour":
				return "Phút trong giờ";
			default:
				return "Thời gian";
		}
	};

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: colors.background }]}
			edges={["bottom"]}
		>
			<Header title="Lịch sử" />

			{loading ? (
				<Text style={[styles.loadingText, { color: colors.text }]}>
					Đang tải dữ liệu lịch sử...
				</Text>
			) : error ? (
				<Text style={styles.errorText}>Lỗi: {error}</Text>
			) : availableDates.length === 0 ? (
				<View>
					<Text
						style={[
							styles.noDataText,
							{ color: isDarkMode ? "#AAA" : "#666" },
						]}
					>
						Chưa có dữ liệu lịch sử
					</Text>
				</View>
			) : (
				<ScrollView style={styles.scrollView}>
					{/* Add controls for auto-generation */}
					<View
						style={[
							styles.dateNavigator,
							{
								backgroundColor: isDarkMode
									? colors.card
									: "#f5f5f5",
							},
						]}
					>
						<TouchableOpacity
							style={styles.navButton}
							onPress={getPreviousDate}
							disabled={
								availableDates.indexOf(selectedDate) ===
								availableDates.length - 1
							}
						>
							<MaterialCommunityIcons
								name="chevron-left"
								size={24}
								color={colors.text}
							/>
						</TouchableOpacity>

						<Text style={[styles.dateText, { color: colors.text }]}>
							{selectedDate}
						</Text>

						<TouchableOpacity
							style={styles.navButton}
							onPress={getNextDate}
							disabled={
								availableDates.indexOf(selectedDate) === 0
							}
						>
							<MaterialCommunityIcons
								name="chevron-right"
								size={24}
								color={colors.text}
							/>
						</TouchableOpacity>
					</View>

					{/* Time Scale Selector */}
					<View style={styles.timeScaleSelector}>
						<TouchableOpacity
							style={[
								styles.scaleButton,
								{
									backgroundColor: isDarkMode
										? "#333"
										: "#f0f0f0",
								},
								timeScale === "realtime" && {
									backgroundColor: isDarkMode
										? "#444"
										: "#e0e0e0",
								},
							]}
							onPress={() => setTimeScale("realtime")}
						>
							<Text
								style={[
									styles.scaleText,
									{
										color: isDarkMode ? "#CCC" : "#666",
									},
									timeScale === "realtime" && {
										color: isDarkMode ? "#FFF" : "#333",
										fontWeight: "bold",
									},
								]}
							>
								Thời gian thực
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[
								styles.scaleButton,
								{
									backgroundColor: isDarkMode
										? "#333"
										: "#f0f0f0",
								},
								timeScale === "hour" && {
									backgroundColor: isDarkMode
										? "#444"
										: "#e0e0e0",
								},
							]}
							onPress={() => setTimeScale("hour")}
						>
							<Text
								style={[
									styles.scaleText,
									{
										color: isDarkMode ? "#CCC" : "#666",
									},
									timeScale === "hour" && {
										color: isDarkMode ? "#FFF" : "#333",
										fontWeight: "bold",
									},
								]}
							>
								Theo phút
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[
								styles.scaleButton,
								{
									backgroundColor: isDarkMode
										? "#333"
										: "#f0f0f0",
								},
								timeScale === "day" && {
									backgroundColor: isDarkMode
										? "#444"
										: "#e0e0e0",
								},
							]}
							onPress={() => setTimeScale("day")}
						>
							<Text
								style={[
									styles.scaleText,
									{
										color: isDarkMode ? "#CCC" : "#666",
									},
									timeScale === "day" && {
										color: isDarkMode ? "#FFF" : "#333",
										fontWeight: "bold",
									},
								]}
							>
								Theo giờ
							</Text>
						</TouchableOpacity>
					</View>

					<View style={styles.chartModeSelector}>
						<TouchableOpacity
							style={[
								styles.modeButton,
								{
									backgroundColor: isDarkMode
										? "#333"
										: "#f0f0f0",
								},
								displayMode === "temperature" && {
									backgroundColor: isDarkMode
										? "#444"
										: "#e0e0e0",
								},
							]}
							onPress={() => setDisplayMode("temperature")}
						>
							<Text
								style={[
									styles.modeText,
									{
										color: isDarkMode ? "#CCC" : "#666",
									},
									displayMode === "temperature" && {
										color: isDarkMode ? "#FFF" : "#333",
										fontWeight: "bold",
									},
								]}
							>
								Nhiệt độ
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[
								styles.modeButton,
								{
									backgroundColor: isDarkMode
										? "#333"
										: "#f0f0f0",
								},
								displayMode === "humidity" && {
									backgroundColor: isDarkMode
										? "#444"
										: "#e0e0e0",
								},
							]}
							onPress={() => setDisplayMode("humidity")}
						>
							<Text
								style={[
									styles.modeText,
									{
										color: isDarkMode ? "#CCC" : "#666",
									},
									displayMode === "humidity" && {
										color: isDarkMode ? "#FFF" : "#333",
										fontWeight: "bold",
									},
								]}
							>
								Độ ẩm
							</Text>
						</TouchableOpacity>
					</View>

					<View
						style={[
							styles.chartContainer,
							{ backgroundColor: colors.card },
						]}
					>
						{getChartData().length > 0 ? (
							<TimeSeriesChart
								data={getChartData()}
								title={getChartTitle()}
								xAxisLabel={getXAxisLabel()}
								yAxisLabel={
									displayMode === "temperature" ? "°C" : "%"
								}
								color={
									displayMode === "temperature"
										? "#FF5722"
										: "#03A9F4"
								}
								darkMode={isDarkMode}
								showDataPoints={true} // Always show data points for better visibility
								showGradient={true}
								enableScrolling={true}
								maxPoints={timeScale === "realtime" ? 50 : 100} // More points for aggregated views
								dataType={displayMode} // Pass the current display mode as dataType
								thresholds={settings?.alertThresholds} // Pass thresholds from settings
								timeScale={timeScale} // Pass the current time scale
							/>
						) : (
							<Text
								style={[
									styles.noDataText,
									{
										color: isDarkMode ? "#AAA" : "#666",
									},
								]}
							>
								Không có dữ liệu cho ngày này
							</Text>
						)}
					</View>

					{timeScale === "realtime" && (
						<>
							<Text
								style={[
									styles.subheading,
									{ color: colors.text },
								]}
							>
								Sự kiện mở ngăn thuốc
							</Text>

							{getOpeningEvents().length > 0 ? (
								<View
									style={[
										styles.eventsList,
										{ backgroundColor: colors.card },
									]}
								>
									{getOpeningEvents().map((event, index) => (
										<View
											key={index}
											style={[
												styles.eventItem,
												{
													borderBottomColor:
														isDarkMode
															? "#333"
															: "#f0f0f0",
												},
											]}
										>
											<MaterialCommunityIcons
												name="pill"
												size={20}
												color={colors.primary}
												style={styles.eventIcon}
											/>
											<View style={styles.eventDetails}>
												<Text
													style={[
														styles.eventTime,
														{ color: colors.text },
													]}
												>
													{event.time}
												</Text>
												<Text
													style={[
														styles.eventText,
														{
															color: isDarkMode
																? "#AAA"
																: "#666",
														},
													]}
												>
													Ngăn thuốc{" "}
													{getCabinetName(
														event.cabinet
													)}{" "}
													đã được mở
												</Text>
											</View>
										</View>
									))}
								</View>
							) : (
								<Text
									style={[
										styles.noDataText,
										{ color: isDarkMode ? "#AAA" : "#666" },
									]}
								>
									Không có sự kiện mở ngăn nào được ghi lại
									cho ngày này
								</Text>
							)}
						</>
					)}
				</ScrollView>
			)}
		</SafeAreaView>
	);
}

// Update styles to include new time scale selector
const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
		padding: 20,
	},
	heading: {
		fontSize: 28,
		fontWeight: "bold",
		marginBottom: 20,
	},
	subheading: {
		fontSize: 18,
		fontWeight: "bold",
		marginVertical: 15,
	},
	loadingText: {
		fontSize: 18,
		textAlign: "center",
		marginTop: 50,
	},
	errorText: {
		fontSize: 18,
		color: "red",
		textAlign: "center",
		marginTop: 50,
	},
	noDataText: {
		textAlign: "center",
		fontSize: 16,
		fontStyle: "italic",
		color: "#666",
		marginVertical: 20,
	},
	dateNavigator: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 20,
		backgroundColor: "#f5f5f5",
		borderRadius: 10,
		padding: 10,
	},
	navButton: {
		padding: 5,
	},
	dateText: {
		fontSize: 16,
		fontWeight: "bold",
	},
	timeScaleSelector: {
		flexDirection: "row",
		marginBottom: 15,
	},
	scaleButton: {
		flex: 1,
		paddingVertical: 10,
		alignItems: "center",
		backgroundColor: "#f0f0f0",
		borderRadius: 5,
		marginHorizontal: 3,
	},
	scaleText: {
		fontSize: 12,
		color: "#666",
	},
	chartContainer: {
		marginVertical: 5, // Reduced margin
		backgroundColor: "transparent", // Make background transparent
		borderRadius: 0, // Remove border radius
		padding: 0, // Remove padding
		// Remove all shadow properties
	},
	chartModeSelector: {
		flexDirection: "row",
		marginBottom: 15,
	},
	modeButton: {
		flex: 1,
		paddingVertical: 10,
		alignItems: "center",
		backgroundColor: "#f0f0f0",
		borderRadius: 5,
		marginHorizontal: 5,
	},
	modeText: {
		fontSize: 14,
		color: "#666",
	},
	eventsList: {
		backgroundColor: "#fff",
		borderRadius: 10,
		padding: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	eventItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	eventIcon: {
		marginRight: 15,
	},
	eventDetails: {
		flex: 1,
	},
	eventTime: {
		fontSize: 16,
		fontWeight: "bold",
	},
	eventText: {
		fontSize: 14,
		color: "#666",
	},
	autoGenerationControls: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 15,
		padding: 10,
		backgroundColor: "rgba(0,0,0,0.03)",
		borderRadius: 8,
	},
	controlLabel: {
		fontSize: 16,
		fontWeight: "500",
	},
	controlButton: {
		paddingVertical: 8,
		paddingHorizontal: 15,
		borderRadius: 6,
	},
	controlButtonText: {
		color: "white",
		fontWeight: "bold",
	},
});
