import { useTheme } from "@/context/ThemeContext";
import { TimeOfDay } from "@/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
	Animated,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

interface CompartmentBoxProps {
	title: string;
	isOpen: boolean;
	timeOfDay: TimeOfDay;
	isCurrent: boolean;
	isDisabled?: boolean;
	hasTakenMeds: boolean;
	onPress?: (timeOfDay: TimeOfDay, timestamp?: string) => void;
}

export function CompartmentBox({
	title,
	isOpen,
	timeOfDay,
	isCurrent,
	isDisabled = false,
	hasTakenMeds,
	onPress,
}: CompartmentBoxProps) {
	const { colors, theme } = useTheme();

	// Animation value for compartment opening
	const animatedValue = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

	// Update animation when isOpen changes
	useEffect(() => {
		Animated.timing(animatedValue, {
			toValue: isOpen ? 1 : 0,
			duration: 300,
			useNativeDriver: false,
		}).start();
	}, [isOpen, animatedValue]);

	// Interpolate animation values
	const boxRotation = animatedValue.interpolate({
		inputRange: [0, 1],
		outputRange: ["0deg", "-45deg"],
	});

	// Icon for each time of day
	const getTimeIcon = () => {
		switch (timeOfDay) {
			case "morning":
				return "weather-sunset-up";
			case "noon":
				return "weather-sunny";
			case "evening":
				return "weather-night";
		}
	};

	// Determine box background color
	const getBoxColor = () => {
		if (isDisabled) return "#CCCCCC"; // Disabled gray color
		if (isOpen) return "#F44336"; // Red when open
		if (isCurrent) return "#4CAF50"; // Green when current
		return colors.card; // Default color
	};

	const getLidColor = () => {
		if (theme === "dark") {
			return isCurrent ? "#3949AB" : "#424242"; // Dark blue when current, gray otherwise
		} else {
			return isCurrent ? "#BBDEFB" : "#E0E0E0"; // Light blue when current, light gray otherwise
		}
	};

	const getBorderColor = () => {
		if (theme === "dark") {
			return isCurrent ? "#3F51B5" : "#424242"; // Blue when current, gray otherwise
		} else {
			return isCurrent ? "#2196F3" : "#BDBDBD"; // Blue when current, gray otherwise
		}
	};

	const handlePress = () => {
		if (onPress) {
			// Pass the current timestamp as ISO string to avoid Firebase serialization issues
			const timestamp = new Date().toISOString();
			onPress(timeOfDay, timestamp);
		}
	};

	return (
		<View style={styles.container}>
			<Text
				style={[
					styles.title,
					{ color: colors.text },
					isCurrent && {
						color: theme === "dark" ? "#7986CB" : "#1976D2",
						fontWeight: "bold",
					},
				]}
			>
				{title}
			</Text>

			<TouchableOpacity
				activeOpacity={0.7}
				onPress={handlePress}
				disabled={isDisabled}
			>
				<Animated.View
					style={[
						styles.box,
						{
							backgroundColor: getBoxColor(),
							borderColor: getBorderColor(),
							opacity: isDisabled ? 0.7 : 1,
						},
					]}
				>
					<View style={styles.boxContent}>
						<Animated.View
							style={[
								styles.lid,
								{
									transform: [{ rotateX: boxRotation }],
									backgroundColor: getLidColor(),
								},
							]}
						/>

						<View style={styles.pillsContainer}>
							<MaterialCommunityIcons
								name={getTimeIcon()}
								size={24}
								color={
									isDisabled
										? "#888888"
										: isOpen || isCurrent
										? "white"
										: colors.text
								}
							/>
						</View>
					</View>
				</Animated.View>
			</TouchableOpacity>

			<Text
				style={[
					styles.status,
					{ color: theme === "dark" ? colors.text : undefined },
					isOpen ? styles.openStatus : styles.closedStatus,
				]}
			>
				{isDisabled ? "Tắt" : isOpen ? "Mở" : "Đóng"}
			</Text>

			{hasTakenMeds && (
				<Text style={styles.takenText}>Đã uống thuốc</Text>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		width: "30%",
	},
	title: {
		fontSize: 14,
		fontWeight: "500",
		marginBottom: 5,
	},
	box: {
		width: 80,
		height: 80,
		borderRadius: 10,
		borderWidth: 2,
		overflow: "hidden",
		marginBottom: 5,
	},
	boxContent: {
		position: "relative",
		width: "100%",
		height: "100%",
	},
	lid: {
		position: "absolute",
		width: "100%",
		height: "30%",
		top: 0,
		zIndex: 2,
		borderBottomWidth: 1,
		borderBottomColor: "#DDD",
		transformOrigin: "top",
	},
	pillsContainer: {
		position: "absolute",
		bottom: 15,
		left: 0,
		right: 0,
		alignItems: "center",
	},
	status: {
		fontSize: 12,
		fontWeight: "500",
	},
	openStatus: {
		color: "#4CAF50",
	},
	closedStatus: {
		color: "#9E9E9E",
	},
	takenText: {
		fontSize: 10,
		color: "#4CAF50",
		marginTop: 4,
		textAlign: "center",
	},
});
