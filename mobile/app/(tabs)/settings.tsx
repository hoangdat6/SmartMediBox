import { Header } from "@/components/Header";
import { Loading } from "@/components/Loading";
import { useTheme } from "@/context/ThemeContext";
import { updateData } from "@/services/firebaseService";
import { useSettingsStore } from "@/stores/settingsStore";
import { TimeOfDay } from "@/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import React, { useState } from "react";
import {
	Platform,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface TimeSettingRowProps {
	label: string;
	time: string;
	onPress: () => void;
	icon: string;
}

// Helper component for time settings
const TimeSettingRow = ({
	label,
	time,
	onPress,
	icon,
}: TimeSettingRowProps) => {
	const { colors } = useTheme();

	return (
		<TouchableOpacity
			style={[styles.timeRow, { borderBottomColor: colors.border }]}
			onPress={onPress}
		>
			<MaterialCommunityIcons
				name={icon}
				size={24}
				color={colors.text}
				style={styles.timeIcon}
			/>
			<Text style={[styles.timeLabel, { color: colors.text }]}>
				{label}
			</Text>
			<Text style={[styles.timeValue, { color: colors.secondary }]}>
				{time}
			</Text>
			<MaterialCommunityIcons
				name="chevron-right"
				size={24}
				color={colors.border}
			/>
		</TouchableOpacity>
	);
};

export default function SettingsScreen() {
	const { colors, theme, toggleTheme } = useTheme();
	const {
		settings,
		updateReminderTime,
		updateTemperatureThreshold,
		updateHumidityThreshold,
		toggleAutoControl,
		loading,
		saveSettings,
	} = useSettingsStore();

	const [showPicker, setShowPicker] = useState(false);
	const [currentEditingTime, setCurrentEditingTime] = useState<
		TimeOfDay | ""
	>("");
	const [hasChanges, setHasChanges] = useState(false);

	// Format time string from "HH:MM" to Date object
	const parseTimeString = (timeString: string): Date => {
		const [hours, minutes] = timeString.split(":").map(Number);
		const date = new Date();
		date.setHours(hours, minutes, 0, 0);
		return date;
	};

	// Format Date object to "HH:MM" string
	const formatTime = (date: Date): string => {
		const hours = String(date.getHours()).padStart(2, "0");
		const minutes = String(date.getMinutes()).padStart(2, "0");
		return `${hours}:${minutes}`;
	};

	// Handle time changes
	const handleTimeChange = (event: any, selectedDate?: Date) => {
		setShowPicker(Platform.OS === "ios");

		if (selectedDate && currentEditingTime) {
			const timeString = formatTime(selectedDate);
			updateReminderTime(currentEditingTime, timeString);
			setHasChanges(true);
		}
	};

	// Open time picker for specific time slot
	const openTimePicker = (timeSlot: TimeOfDay) => {
		setCurrentEditingTime(timeSlot);
		setShowPicker(true);
	};

	// Handle saving all settings
	const handleSaveSettings = async () => {
		// Update settings in Firebase
		try {
			// Update reminder times
			if (settings?.reminderTimes) {
				await updateData(
					"settings/reminderTimes",
					settings.reminderTimes
				);
			}

			// Update alert thresholds
			if (settings?.alertThresholds) {
				await updateData(
					"settings/alertThresholds",
					settings.alertThresholds
				);
			}

			// Update auto control settings
			if (settings?.autoControl) {
				await updateData("settings/autoControl", settings.autoControl);
			}

			// Save to local storage
			await saveSettings();
			setHasChanges(false);
		} catch (error) {
			console.error("Error updating settings in Firebase:", error);
			// Still try to save locally even if Firebase update fails
			await saveSettings();
			setHasChanges(false);
		}
	};

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: colors.background }]}
			edges={["bottom"]}
		>
			<Header title="Cài đặt" />

			{loading ? (
				<Loading message="Đang tải cài đặt..." fullscreen />
			) : (
				<ScrollView style={styles.content}>
					<View
						style={[
							styles.section,
							{ backgroundColor: colors.card },
						]}
					>
						<Text
							style={[
								styles.sectionTitle,
								{ color: colors.text },
							]}
						>
							Thời gian nhắc nhở thuốc
						</Text>

						<TimeSettingRow
							label="Buổi sáng"
							time={settings?.reminderTimes?.morning || "07:00"}
							onPress={() => openTimePicker("morning")}
							icon="weather-sunset-up"
						/>

						<TimeSettingRow
							label="Buổi trưa"
							time={settings?.reminderTimes?.noon || "12:00"}
							onPress={() => openTimePicker("noon")}
							icon="weather-sunny"
						/>

						<TimeSettingRow
							label="Buổi tối"
							time={settings?.reminderTimes?.evening || "19:00"}
							onPress={() => openTimePicker("evening")}
							icon="weather-night"
						/>
					</View>

					<View
						style={[
							styles.section,
							{ backgroundColor: colors.card },
						]}
					>
						<Text
							style={[
								styles.sectionTitle,
								{ color: colors.text },
							]}
						>
							Ngưỡng cảnh báo
						</Text>

						<Text
							style={[styles.sliderLabel, { color: colors.text }]}
						>
							Nhiệt độ:{" "}
							{settings?.alertThresholds?.temperature || 35}°C
						</Text>
						<Slider
							style={styles.slider}
							minimumValue={20}
							maximumValue={50}
							step={1}
							value={settings?.alertThresholds?.temperature || 35}
							onValueChange={(value) => {
								updateTemperatureThreshold(value);
								setHasChanges(true);
							}}
							minimumTrackTintColor="#FF7043"
							maximumTrackTintColor={
								theme === "dark" ? "#555" : "#D3D3D3"
							}
							thumbTintColor="#FF5722"
						/>

						<Text
							style={[styles.sliderLabel, { color: colors.text }]}
						>
							Độ ẩm: {settings?.alertThresholds?.humidity || 65}%
						</Text>
						<Slider
							style={styles.slider}
							minimumValue={30}
							maximumValue={90}
							step={1}
							value={settings?.alertThresholds?.humidity || 65}
							onValueChange={(value) => {
								updateHumidityThreshold(value);
								setHasChanges(true);
							}}
							minimumTrackTintColor="#4FC3F7"
							maximumTrackTintColor={
								theme === "dark" ? "#555" : "#D3D3D3"
							}
							thumbTintColor="#03A9F4"
						/>
					</View>

					<View
						style={[
							styles.section,
							{ backgroundColor: colors.card },
						]}
					>
						<Text
							style={[
								styles.sectionTitle,
								{ color: colors.text },
							]}
						>
							Cài đặt ứng dụng
						</Text>

						<View style={styles.switchRow}>
							<Text
								style={[
									styles.switchLabel,
									{ color: colors.text },
								]}
							>
								Chế độ tối
							</Text>
							<Switch
								value={theme === "dark"}
								onValueChange={toggleTheme}
								trackColor={{
									false: "#D3D3D3",
									true: colors.primary,
								}}
								thumbColor={
									theme === "dark" ? "#fff" : "#f4f3f4"
								}
							/>
						</View>

						<View style={styles.switchRow}>
							<Text
								style={[
									styles.switchLabel,
									{ color: colors.text },
								]}
							>
								Tự động điều khiển
							</Text>
							<Switch
								value={settings?.autoControl?.enabled || false}
								onValueChange={() => {
									toggleAutoControl();
									setHasChanges(true);
								}}
								trackColor={{
									false: "#D3D3D3",
									true: colors.primary,
								}}
								thumbColor={
									settings?.autoControl?.enabled
										? "#fff"
										: "#f4f3f4"
								}
							/>
						</View>
					</View>

					{hasChanges && (
						<TouchableOpacity
							style={[
								styles.saveButton,
								{ backgroundColor: colors.primary },
							]}
							onPress={handleSaveSettings}
						>
							<Text style={styles.saveButtonText}>
								Lưu thay đổi
							</Text>
						</TouchableOpacity>
					)}

					{showPicker && (
						<DateTimePicker
							value={parseTimeString(
								currentEditingTime === "morning"
									? settings?.reminderTimes?.morning ||
											"07:00"
									: currentEditingTime === "noon"
									? settings?.reminderTimes?.noon || "12:00"
									: settings?.reminderTimes?.evening ||
									  "19:00"
							)}
							mode="time"
							is24Hour={true}
							display="default"
							onChange={handleTimeChange}
						/>
					)}
				</ScrollView>
			)}
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
		paddingBottom: 60,
	},
	heading: {
		fontSize: 28,
		fontWeight: "bold",
		marginBottom: 20,
	},
	loadingText: {
		fontSize: 18,
		textAlign: "center",
	},
	section: {
		marginBottom: 30,
		backgroundColor: "#fff",
		borderRadius: 10,
		padding: 15,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 15,
	},
	timeRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	timeIcon: {
		marginRight: 10,
	},
	timeLabel: {
		flex: 1,
		fontSize: 16,
	},
	timeValue: {
		fontSize: 16,
		fontWeight: "500",
		marginRight: 10,
		color: "#0066CC",
	},
	sliderLabel: {
		fontSize: 16,
		marginBottom: 8,
	},
	slider: {
		height: 40,
		marginBottom: 20,
	},
	switchRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 10,
	},
	switchLabel: {
		fontSize: 16,
	},
	saveButton: {
		backgroundColor: "#4CAF50",
		paddingVertical: 15,
		borderRadius: 10,
		alignItems: "center",
		marginTop: 10,
		marginBottom: 40,
	},
	saveButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
});
