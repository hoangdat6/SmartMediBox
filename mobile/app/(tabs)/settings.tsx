import { Header } from "@/components/Header";
import { Loading } from "@/components/Loading";
import { useTheme } from "@/context/ThemeContext";
import { updateData } from "@/services/firebaseService";
import { useSettingsStore } from "@/stores/settingsStore";
import { FromTo, TimeOfDay } from "@/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
	Alert,
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
	timeRange: FromTo;
	onPressStart: () => void;
	onPressEnd: () => void;
	onToggleEnable: () => void;
	icon: string;
	hasError?: boolean;
}

// Helper component for time settings
const TimeSettingRow = ({
	label,
	timeRange,
	onPressStart,
	onPressEnd,
	onToggleEnable,
	icon,
	hasError,
}: TimeSettingRowProps) => {
	const { colors } = useTheme();

	return (
		<View style={[styles.timeRow, { borderBottomColor: colors.border }]}>
			<View style={styles.timeHeaderRow}>
				<MaterialCommunityIcons
					name={icon}
					size={24}
					color={timeRange.enabled ? colors.text : colors.border}
					style={styles.timeIcon}
				/>
				<Text
					style={[
						styles.timeLabel,
						{
							color: timeRange.enabled
								? colors.text
								: colors.border,
							flex: 1,
						},
					]}
				>
					{label}
				</Text>
				<Switch
					value={timeRange.enabled}
					onValueChange={onToggleEnable}
					trackColor={{
						false: "#D3D3D3",
						true: colors.primary,
					}}
					thumbColor={timeRange.enabled ? "#fff" : "#f4f3f4"}
				/>
			</View>

			{timeRange.enabled && (
				<View style={styles.timeRangeContainer}>
					<TouchableOpacity onPress={onPressStart}>
						<Text
							style={[
								styles.timeValue,
								{ color: hasError ? "red" : colors.secondary },
							]}
						>
							{timeRange.start}
						</Text>
					</TouchableOpacity>
					<Text style={{ color: colors.text }}>-</Text>
					<TouchableOpacity onPress={onPressEnd}>
						<Text
							style={[
								styles.timeValue,
								{ color: hasError ? "red" : colors.secondary },
							]}
						>
							{timeRange.end}
						</Text>
					</TouchableOpacity>
				</View>
			)}
		</View>
	);
};

export default function SettingsScreen() {
	const { colors, theme, toggleTheme } = useTheme();
	const {
		fetchSettings,
		settings,
		updateReminderTime,
		toggleReminderEnability,
		updateTemperatureThreshold,
		updateHumidityThreshold,
		updateThresholdClose, // Add the new method
		loading,
		saveSettings,
	} = useSettingsStore();

	// Replace the useEffect with useFocusEffect to fetch settings when screen comes into focus
	useFocusEffect(
		useCallback(() => {
			console.log("Settings screen in focus - fetching latest settings");
			fetchSettings();
		}, [fetchSettings])
	);

	const [showPicker, setShowPicker] = useState(false);
	const [currentEditingTime, setCurrentEditingTime] = useState<
		TimeOfDay | ""
	>("");
	const [currentEditingType, setCurrentEditingType] = useState<
		"start" | "end"
	>("start");
	const [hasChanges, setHasChanges] = useState(false);
	const [timeErrors, setTimeErrors] = useState<{
		morning: boolean;
		noon: boolean;
		evening: boolean;
	}>({ morning: false, noon: false, evening: false });

	// Format time string from "HH:MM" to Date object
	const parseTimeString = (timeString: string | undefined): Date => {
		if (!timeString) {
			// Return a default time if the string is undefined
			const defaultDate = new Date();
			defaultDate.setHours(8, 0, 0, 0);
			return defaultDate;
		}

		try {
			const [hours, minutes] = timeString.split(":").map(Number);
			const date = new Date();
			date.setHours(hours || 0, minutes || 0, 0, 0);
			return date;
		} catch (error) {
			console.error("Error parsing time string:", error);
			// Return a default time if parsing fails
			const defaultDate = new Date();
			defaultDate.setHours(8, 0, 0, 0);
			return defaultDate;
		}
	};

	// Convert time string to minutes for comparison
	const timeToMinutes = useCallback(
		(timeString: string | undefined): number => {
			if (!timeString) return 0;

			try {
				const [hours, minutes] = timeString.split(":").map(Number);
				return (hours || 0) * 60 + (minutes || 0);
			} catch (error) {
				console.error("Error converting time to minutes:", error);
				return 0;
			}
		},
		[]
	);

	// Validate time ranges to ensure they don't overlap and are in correct order
	const validateTimeRanges = useCallback(() => {
		if (!settings?.reminderTimes) return false;

		try {
			const { morning, noon, evening } = settings.reminderTimes;

			// Check each time range is valid (start before end)
			const morningValid =
				timeToMinutes(morning?.start) < timeToMinutes(morning?.end);
			const noonValid =
				timeToMinutes(noon?.start) < timeToMinutes(noon?.end);
			const eveningValid =
				timeToMinutes(evening?.start) < timeToMinutes(evening?.end);

			// Check time ranges don't overlap
			const morningEndsBeforeNoonStarts =
				timeToMinutes(morning?.end) <= timeToMinutes(noon?.start);
			const noonEndsBeforeEveningStarts =
				timeToMinutes(noon?.end) <= timeToMinutes(evening?.start);

			setTimeErrors({
				morning: !morningValid || !morningEndsBeforeNoonStarts,
				noon:
					!noonValid ||
					!morningEndsBeforeNoonStarts ||
					!noonEndsBeforeEveningStarts,
				evening: !eveningValid || !noonEndsBeforeEveningStarts,
			});

			return (
				morningValid &&
				noonValid &&
				eveningValid &&
				morningEndsBeforeNoonStarts &&
				noonEndsBeforeEveningStarts
			);
		} catch (error) {
			console.error("Error validating time ranges:", error);
			return false;
		}
	}, [settings?.reminderTimes, timeToMinutes]);

	// Validate times whenever they change
	useEffect(() => {
		if (settings?.reminderTimes) {
			validateTimeRanges();
		}
	}, [settings?.reminderTimes, hasChanges, validateTimeRanges]);

	// Handle time changes
	const handleTimeChange = (event: any, selectedDate?: Date) => {
		setShowPicker(Platform.OS === "ios");

		if (selectedDate && currentEditingTime) {
			const timeString = formatTime(selectedDate);
			updateReminderTime(
				currentEditingTime,
				currentEditingType,
				timeString
			);
			setHasChanges(true);
		}
	};

	// Open time picker for specific time slot
	const openTimePicker = (timeSlot: TimeOfDay, type: "start" | "end") => {
		setCurrentEditingTime(timeSlot);
		setCurrentEditingType(type);
		setShowPicker(true);
	};

	// Handle saving all settings
	const handleSaveSettings = async () => {
		// Validate time ranges before saving
		if (!validateTimeRanges()) {
			Alert.alert(
				"Thời gian không hợp lệ",
				"Vui lòng đảm bảo thời gian không chồng lấp và sắp xếp theo thứ tự sáng < trưa < tối",
				[{ text: "OK" }]
			);
			return;
		}

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

	// Fix the DateTimePicker value calculation
	const getTimePickerValue = (): Date => {
		try {
			if (!currentEditingTime || !settings?.reminderTimes) {
				return parseTimeString("08:00"); // Default fallback
			}

			const timeSlot =
				settings.reminderTimes[currentEditingTime as TimeOfDay];
			if (!timeSlot) {
				return parseTimeString("08:00"); // Default fallback
			}

			return parseTimeString(
				currentEditingType === "start" ? timeSlot.start : timeSlot.end
			);
		} catch (error) {
			console.error("Error getting time picker value:", error);
			return parseTimeString("08:00"); // Default fallback
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

						{timeErrors.morning ||
						timeErrors.noon ||
						timeErrors.evening ? (
							<Text style={styles.errorText}>
								Vui lòng đảm bảo thời gian không chồng lấp và
								sắp xếp theo thứ tự sáng {"<"} trưa {"<"} tối
							</Text>
						) : null}

						<TimeSettingRow
							label="Buổi sáng"
							timeRange={
								settings?.reminderTimes?.morning || {
									enabled: true,
									drank:
										settings?.reminderTimes?.morning
											?.drank ?? true,
									start: "06:00",
									end: "08:00",
								}
							}
							onPressStart={() =>
								openTimePicker("morning", "start")
							}
							onPressEnd={() => openTimePicker("morning", "end")}
							onToggleEnable={() =>
								toggleReminderEnability("morning")
							}
							icon="weather-sunset-up"
							hasError={timeErrors.morning}
						/>

						<TimeSettingRow
							label="Buổi trưa"
							timeRange={
								settings?.reminderTimes?.noon || {
									enabled: true,
									drank:
										settings?.reminderTimes?.noon?.drank ??
										true,
									start: "11:30",
									end: "13:30",
								}
							}
							onPressStart={() => openTimePicker("noon", "start")}
							onPressEnd={() => openTimePicker("noon", "end")}
							onToggleEnable={() =>
								toggleReminderEnability("noon")
							}
							icon="weather-sunny"
							hasError={timeErrors.noon}
						/>

						<TimeSettingRow
							label="Buổi tối"
							timeRange={
								settings?.reminderTimes?.evening || {
									enabled: true,
									drank:
										settings?.reminderTimes?.evening
											?.drank ?? true,
									start: "18:00",
									end: "20:00",
								}
							}
							onPressStart={() =>
								openTimePicker("evening", "start")
							}
							onPressEnd={() => openTimePicker("evening", "end")}
							onToggleEnable={() =>
								toggleReminderEnability("evening")
							}
							icon="weather-night"
							hasError={timeErrors.evening}
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

						{/* Add the new thresholdClose slider */}
						<Text
							style={[styles.sliderLabel, { color: colors.text }]}
						>
							Thời gian tự đóng: {settings?.thresholdClose || 30}{" "}
							giây
						</Text>
						<Slider
							style={styles.slider}
							minimumValue={5}
							maximumValue={120}
							step={5}
							value={settings?.thresholdClose || 30}
							onValueChange={(value) => {
								updateThresholdClose(value);
								setHasChanges(true);
							}}
							minimumTrackTintColor="#81C784"
							maximumTrackTintColor={
								theme === "dark" ? "#555" : "#D3D3D3"
							}
							thumbTintColor="#4CAF50"
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
							value={getTimePickerValue()}
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
	timeHeaderRow: {
		flexDirection: "row",
		alignItems: "center",
		width: "100%",
	},
	timeRow: {
		flexDirection: "column",
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
		marginHorizontal: 5,
	},
	timeRangeContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 8,
		paddingLeft: 34, // To align with the label
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
	errorText: {
		color: "red",
		marginBottom: 10,
		fontSize: 14,
	},
});

function formatTime(selectedDate: Date): string {
	const hours = selectedDate.getHours().toString().padStart(2, "0");
	const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
	return `${hours}:${minutes}`;
}
