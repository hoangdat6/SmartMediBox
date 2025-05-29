import { Header } from "@/components/Header";
import { useTheme } from "@/context/ThemeContext";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Import the new components
import { InfoSection } from "@/components/monitor/InfoSection";
import { SensorChart } from "@/components/monitor/SensorChart";
import { StatusCard } from "@/components/monitor/StatusCard";
import {
	QuickTimeNavigation,
	TimeNavigation,
} from "@/components/monitor/TimeNavigation";
import { TimeWindowSelector } from "@/components/monitor/TimeWindowSelector";

export default function MonitorScreen() {
	const { colors, theme } = useTheme();
	const [timeWindow, setTimeWindow] = useState<number>(3600000); // 1 hour in milliseconds
	const [viewingHistorical, setViewingHistorical] = useState<boolean>(false);
	const [timeOffset, setTimeOffset] = useState<number>(0); // 0 means current time

	const {
		realtimeData,
		currentTemperature,
		currentHumidity,
		isCurrentTemperatureAnomaly,
		isCurrentHumidityAnomaly,
		loading,
		error,
	} = useRealtimeData(timeWindow);

	// Time window options
	const timeWindows = [
		{ label: "15 Phút", value: 15 * 60 * 1000 },
		{ label: "1 Giờ", value: 60 * 60 * 1000 },
		{ label: "3 Giờ", value: 3 * 60 * 60 * 1000 },
		{ label: "6 Giờ", value: 6 * 60 * 60 * 1000 },
	];

	// Function to navigate time periods
	const navigateTime = (direction: "forward" | "backward") => {
		// Calculate new offset based on 30 minute increments
		const increment = 30 * 60 * 1000; // 30 minutes in milliseconds
		const newOffset =
			direction === "forward"
				? Math.max(0, timeOffset - increment)
				: timeOffset + increment;

		setTimeOffset(newOffset);
		setViewingHistorical(newOffset > 0);
	};

	// Enhanced navigation with more time ranges
	const quickNavigateTo = (minutesAgo: number) => {
		const newOffset = minutesAgo * 60 * 1000;
		setTimeOffset(newOffset);
		setViewingHistorical(newOffset > 0);
	};

	// Function to reset to current time view
	const resetToCurrentTime = () => {
		setTimeOffset(0);
		setViewingHistorical(false);
	};

	// Filter data based on time offset
	const getFilteredData = () => {
		if (timeOffset === 0) {
			return realtimeData; // Current data
		} else {
			// Apply time offset to filter historical data
			const now = Date.now();
			const offsetTime = now - timeOffset;
			const endTime = offsetTime;
			const startTime = endTime - timeWindow;

			return realtimeData.filter((point) => {
				return (
					point.timestamp >= startTime && point.timestamp <= endTime
				);
			});
		}
	};

	const filteredData = getFilteredData();

	// Debug: Log data when it changes
	useEffect(() => {
		console.log(`Filtered data count: ${filteredData.length}`);
	}, [filteredData]);

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: colors.background }]}
			edges={["bottom"]}
		>
			<Header title="Theo dõi thời gian thực" />

			{loading && realtimeData.length === 0 ? (
				<Text style={[styles.loadingText, { color: colors.text }]}>
					Đang tải dữ liệu cảm biến...
				</Text>
			) : error ? (
				<Text style={styles.errorText}>Lỗi: {error}</Text>
			) : (
				<ScrollView style={styles.scrollView}>
					<View style={styles.statusCards}>
						<StatusCard
							title="Nhiệt độ"
							value={currentTemperature}
							unit="°C"
							isAnomaly={isCurrentTemperatureAnomaly}
							iconName="thermometer"
							primaryColor="#FF5722"
							colors={{
								card: colors.card,
								text: colors.text,
								border: colors.border,
							}}
						/>

						<StatusCard
							title="Độ ẩm"
							value={currentHumidity}
							unit="%"
							isAnomaly={isCurrentHumidityAnomaly}
							iconName="water-percent"
							primaryColor="#03A9F4"
							colors={{
								card: colors.card,
								text: colors.text,
								border: colors.border,
							}}
						/>
					</View>

					<TimeWindowSelector
						options={timeWindows}
						selectedValue={timeWindow}
						onSelect={setTimeWindow}
						colors={{
							text: colors.text,
							primary: colors.primary,
						}}
						theme={theme}
					/>

					<TimeNavigation
						timeOffset={timeOffset}
						timeWindow={timeWindow}
						viewingHistorical={viewingHistorical}
						onNavigate={navigateTime}
						onReset={resetToCurrentTime}
						colors={{
							card: colors.card,
							text: colors.text,
							primary: colors.primary,
						}}
						theme={theme}
					/>

					<QuickTimeNavigation
						onQuickNavigate={quickNavigateTo}
						onReset={resetToCurrentTime}
						colors={{
							text: colors.text,
							primary: colors.primary,
						}}
						theme={theme}
					/>

					<SensorChart
						title="Nhiệt độ"
						data={filteredData}
						dataKey="temperature"
						viewingHistorical={viewingHistorical}
						theme={theme}
						colors={{
							card: colors.card,
							text: colors.text,
							accent: colors.accent,
						}}
						primaryColor="#FF5722"
						anomalyColor="#FF9800"
						unit="°C"
					/>

					<SensorChart
						title="Độ ẩm"
						data={filteredData}
						dataKey="humidity"
						viewingHistorical={viewingHistorical}
						theme={theme}
						colors={{
							card: colors.card,
							text: colors.text,
							accent: colors.accent,
						}}
						primaryColor="#03A9F4"
						anomalyColor="#4FC3F7"
						unit="%"
					/>

					<InfoSection theme={theme} colors={{ text: colors.text }} />
				</ScrollView>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
		padding: 20,
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
	statusCards: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 20,
	},
});
