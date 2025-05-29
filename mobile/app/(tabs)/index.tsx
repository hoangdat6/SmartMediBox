import { CompartmentBox } from "@/components/CompartmentBox";
import { Header } from "@/components/Header";
import { Loading } from "@/components/Loading";
import { SensorCard } from "@/components/SensorCard";
import { useTheme } from "@/context/ThemeContext";
import { useFirebaseData } from "@/hooks/useFirebaseData";
import { useSettingsStore } from "@/stores/settingsStore";
import { TimeOfDay } from "@/types";
import { getCurrentTimeOfDayFromSettings } from "@/utils/timeUtils";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DashboardScreen() {
	const { colors } = useTheme();
	const { settings } = useSettingsStore();
	const {
		fanStatus,
		toggleFan,
		cabinetStatus,
		temperatureData,
		humidityData,
		openCabinet,
		closeCabinet,
		loading,
		error,
	} = useFirebaseData();
	const [currentTimeOfDay, setCurrentTimeOfDay] = useState<TimeOfDay | null>(
		getCurrentTimeOfDayFromSettings()
	);

	// Refresh the current time of day every minute
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentTimeOfDay(getCurrentTimeOfDayFromSettings());
		}, 60000);

		return () => clearInterval(interval);
	}, []);

	// Check if a compartment is available based on settings
	const isCompartmentAvailable = (timeOfDay: TimeOfDay): boolean => {
		return !!settings?.reminderTimes[timeOfDay]?.enabled;
	};

	if (loading) {
		return (
			<SafeAreaView
				style={[
					styles.container,
					{ backgroundColor: colors.background },
				]}
			>
				<Header />
				<Loading message="Đang tải trạng thái tủ thuốc..." fullscreen />
			</SafeAreaView>
		);
	}

	if (error) {
		return (
			<SafeAreaView
				style={[
					styles.container,
					{ backgroundColor: colors.background },
				]}
			>
				<Header />
				<Text style={styles.errorText}>Lỗi: {error}</Text>
			</SafeAreaView>
		);
	}

	// Get compartment name for display
	const getCompartmentName = (timeOfDay: TimeOfDay): string => {
		switch (timeOfDay) {
			case "morning":
				return "Buổi sáng";
			case "noon":
				return "Buổi trưa";
			case "evening":
				return "Buổi tối";
		}
	};

	// Handler for toggling the current time compartment
	const handleToggleCurrentCompartment = () => {
		// Don't do anything if not in a valid time period
		if (!currentTimeOfDay) return;

		const isCurrentOpen = cabinetStatus?.[currentTimeOfDay] === "opened";
		if (isCurrentOpen) {
			closeCabinet(currentTimeOfDay);
		} else {
			openCabinet(currentTimeOfDay);
		}
	};

	// Handler for toggling any compartment
	const handleToggleCompartment = (timeOfDay: TimeOfDay) => {
		// Only allow toggling if the compartment is available in settings
		if (!isCompartmentAvailable(timeOfDay)) return;

		const isOpen = cabinetStatus?.[timeOfDay] === "opened";
		if (isOpen) {
			closeCabinet(timeOfDay);
		} else {
			openCabinet(timeOfDay);
		}
	};

	// Get appropriate text for the main action button
	const getActionButtonText = () => {
		if (!currentTimeOfDay) {
			return "Không trong khung giờ uống thuốc";
		}

		const isCurrentOpen = cabinetStatus?.[currentTimeOfDay] === "opened";
		return isCurrentOpen
			? `Đóng ngăn ${getCompartmentName(currentTimeOfDay)}`
			: `Mở ngăn ${getCompartmentName(currentTimeOfDay)}`;
	};

	// Check if the current time compartment is open
	const isCurrentCompartmentOpen =
		currentTimeOfDay && cabinetStatus?.[currentTimeOfDay] === "opened";

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: colors.background }]}
			edges={["bottom"]}
		>
			<Header />

			<View style={styles.content}>
				<View style={styles.sensorContainer}>
					<SensorCard
						icon="thermometer"
						title="Nhiệt độ"
						value={`${temperatureData}°C`}
						color="#FF7043"
					/>
					<SensorCard
						icon="water-percent"
						title="Độ ẩm"
						value={`${humidityData}%`}
						color="#4FC3F7"
					/>
				</View>

				{/* Fan Control Card */}
				<View style={styles.fanControlContainer}>
					<View
						style={[
							styles.fanStatusCard,
							{ backgroundColor: colors.card },
						]}
					>
						<View
							style={[
								styles.fanIconContainer,
								{ backgroundColor: colors.background },
							]}
						>
							<MaterialCommunityIcons
								name="fan"
								size={50}
								color={fanStatus ? "#4CAF50" : colors.secondary}
								style={[
									styles.fanIcon,
									fanStatus && styles.spinningIcon,
								]}
							/>
						</View>
						<View style={styles.fanInfoContainer}>
							<Text
								style={[
									styles.fanTitle,
									{ color: colors.text },
								]}
							>
								Quạt hút ẩm
							</Text>
							<Text
								style={[
									styles.fanStatus,
									{
										color: fanStatus
											? "#4CAF50"
											: colors.secondary,
									},
								]}
							>
								{fanStatus ? "BẬT" : "TẮT"}
							</Text>
							<TouchableOpacity
								style={[
									styles.fanToggleButton,
									{
										backgroundColor: fanStatus
											? "#F44336"
											: "#4CAF50",
									},
								]}
								onPress={() => toggleFan(!fanStatus)}
							>
								<Text style={styles.fanToggleText}>
									{fanStatus ? "Tắt" : "Bật"}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>

				<Text style={[styles.subheading, { color: colors.text }]}>
					Ngăn chứa thuốc
				</Text>

				<View style={styles.compartmentsContainer}>
					<CompartmentBox
						title="Buổi sáng"
						isOpen={cabinetStatus?.morning === "opened"}
						timeOfDay="morning"
						isCurrent={currentTimeOfDay === "morning"}
						isDisabled={!isCompartmentAvailable("morning")}
						onPress={handleToggleCompartment}
					/>
					<CompartmentBox
						title="Buổi trưa"
						isOpen={cabinetStatus?.noon === "opened"}
						timeOfDay="noon"
						isCurrent={currentTimeOfDay === "noon"}
						isDisabled={!isCompartmentAvailable("noon")}
						onPress={handleToggleCompartment}
					/>
					<CompartmentBox
						title="Buổi tối"
						isOpen={cabinetStatus?.evening === "opened"}
						timeOfDay="evening"
						isCurrent={currentTimeOfDay === "evening"}
						isDisabled={!isCompartmentAvailable("evening")}
						onPress={handleToggleCompartment}
					/>
				</View>

				<TouchableOpacity
					style={[
						styles.openButton,
						{
							backgroundColor: !currentTimeOfDay
								? "#888888"
								: isCurrentCompartmentOpen
								? "#F44336"
								: "#4CAF50",
						},
					]}
					disabled={!currentTimeOfDay}
					onPress={handleToggleCurrentCompartment}
				>
					<MaterialCommunityIcons
						name={
							!currentTimeOfDay
								? "clock-outline"
								: isCurrentCompartmentOpen
								? "close-box"
								: "pill"
						}
						size={24}
						color="white"
					/>
					<Text style={styles.openButtonText}>
						{getActionButtonText()}
					</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		padding: 20,
	},
	heading: {
		fontSize: 28,
		fontWeight: "bold",
		marginBottom: 20,
		textAlign: "center",
	},
	subheading: {
		fontSize: 20,
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
	sensorContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 20,
	},
	compartmentsContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 30,
	},
	openButton: {
		backgroundColor: "#4CAF50",
		paddingVertical: 15,
		paddingHorizontal: 20,
		borderRadius: 10,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
	},
	openButtonText: {
		color: "white",
		fontSize: 16,
		marginLeft: 8,
		fontWeight: "bold",
	},
	// Fan control styles
	fanControlContainer: {
		marginBottom: 20,
	},
	fanStatusCard: {
		borderRadius: 12,
		padding: 15,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		flexDirection: "row",
		alignItems: "center",
	},
	fanIconContainer: {
		width: 80,
		height: 80,
		borderRadius: 40,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 15,
	},
	fanIcon: {
		// This will be animated in a real implementation
	},
	spinningIcon: {
		// In a real implementation, you would add an animation here
	},
	fanInfoContainer: {
		flex: 1,
	},
	fanTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 5,
	},
	fanStatus: {
		fontSize: 16,
		fontWeight: "bold",
		marginBottom: 10,
	},
	fanToggleButton: {
		paddingVertical: 8,
		paddingHorizontal: 15,
		borderRadius: 8,
		alignItems: "center",
	},
	fanToggleText: {
		color: "white",
		fontWeight: "bold",
	},
});
