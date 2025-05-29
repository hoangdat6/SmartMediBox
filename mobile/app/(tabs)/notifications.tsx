import { Header } from "@/components/Header";
import { Loading } from "@/components/Loading";
import { useTheme } from "@/context/ThemeContext";
import { useNotificationsStore } from "@/stores/notificationsStore";
import { NotificationType, NotificationWithId } from "@/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import React from "react";
import {
	FlatList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
	const { colors, theme } = useTheme();
	const {
		notifications,
		loading,
		error,
		fetchNotifications,
		clearAllNotifications,
	} = useNotificationsStore();

	// Get icon based on notification type
	const getNotificationIcon = (type: NotificationType) => {
		switch (type) {
			case "alert":
				return { name: "alert-circle", color: "#F44336" };
			case "reminder":
				return { name: "bell-ring", color: "#FFC107" };
			case "info":
				return { name: "information", color: "#2196F3" };
			default:
				return { name: "bell", color: "#9E9E9E" };
		}
	};

	// Format timestamp to relative time
	const formatTimestamp = (timestamp: string) => {
		try {
			const date = new Date(timestamp);
			return formatDistanceToNow(date, { addSuffix: true });
		} catch (e) {
			console.error("Error formatting timestamp:", e);
			return "Thời gian không xác định";
		}
	};

	// Pull to refresh handler
	const handleRefresh = () => {
		fetchNotifications();
	};

	// Handle clearing all notifications
	const handleClearAll = () => {
		clearAllNotifications();
	};

	// Render each notification item
	const renderNotificationItem = ({ item }: { item: NotificationWithId }) => {
		const icon = getNotificationIcon(item.type);

		return (
			<TouchableOpacity
				style={[
					styles.notificationItem,
					{ backgroundColor: colors.card },
				]}
			>
				<View
					style={[
						styles.iconContainer,
						{ backgroundColor: icon.color + "20" },
					]}
				>
					<MaterialCommunityIcons
						name={icon.name}
						size={24}
						color={icon.color}
					/>
				</View>

				<View style={styles.notificationContent}>
					<View style={styles.notificationHeader}>
						<Text
							style={[
								styles.notificationTitle,
								{ color: colors.text },
							]}
						>
							{item.title}
						</Text>
						<Text style={styles.notificationTime}>
							{formatTimestamp(item.timestamp)}
						</Text>
					</View>

					<Text
						style={[
							styles.notificationMessage,
							{ color: theme === "dark" ? "#AAA" : "#555" },
						]}
					>
						{item.message}
					</Text>
				</View>
			</TouchableOpacity>
		);
	};

	// Empty notifications component
	const EmptyNotifications = () => (
		<View style={styles.emptyContainer}>
			<MaterialCommunityIcons
				name="bell-off"
				size={50}
				color={theme === "dark" ? "#555" : "#ccc"}
			/>
			<Text
				style={[
					styles.emptyText,
					{ color: theme === "dark" ? "#777" : "#999" },
				]}
			>
				Chưa có thông báo
			</Text>
		</View>
	);

	// Footer component with clear all button
	const FooterComponent = () => {
		if (notificationsArray.length === 0) return null;

		return (
			<TouchableOpacity
				style={[
					styles.clearAllButton,
					{ backgroundColor: theme === "dark" ? "#333" : "#f0f0f0" },
				]}
				onPress={handleClearAll}
			>
				<Text
					style={[
						styles.clearAllText,
						{ color: theme === "dark" ? "#CCC" : "#666" },
					]}
				>
					Xóa tất cả
				</Text>
			</TouchableOpacity>
		);
	};

	const notificationsArray: NotificationWithId[] = notifications
		? Object.entries(notifications)
				.map(([id, notification]) => ({
					id,
					...notification,
				}))
				.sort(
					(a, b) =>
						new Date(b.timestamp).getTime() -
						new Date(a.timestamp).getTime()
				)
		: [];

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: colors.background }]}
			edges={["bottom"]}
		>
			<Header title="Thông báo" />

			{loading ? (
				<Loading message="Đang tải thông báo..." fullscreen />
			) : error ? (
				<Text style={styles.errorText}>Lỗi: {error}</Text>
			) : (
				<View style={styles.content}>
					<FlatList
						data={notificationsArray}
						renderItem={renderNotificationItem}
						keyExtractor={(item) => item.id}
						contentContainerStyle={styles.notificationsList}
						ListEmptyComponent={EmptyNotifications}
						ListFooterComponent={FooterComponent}
						refreshing={loading}
						onRefresh={handleRefresh}
					/>
				</View>
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
	},
	notificationsList: {
		flexGrow: 1,
		paddingBottom: 20,
	},
	notificationItem: {
		flexDirection: "row",
		backgroundColor: "#fff",
		borderRadius: 10,
		marginBottom: 10,
		padding: 15,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	iconContainer: {
		width: 50,
		height: 50,
		borderRadius: 25,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 15,
	},
	notificationContent: {
		flex: 1,
	},
	notificationHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 5,
	},
	notificationTitle: {
		fontSize: 16,
		fontWeight: "bold",
	},
	notificationTime: {
		fontSize: 12,
		color: "#999",
	},
	notificationMessage: {
		fontSize: 14,
		color: "#555",
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		marginTop: 50,
	},
	emptyText: {
		marginTop: 10,
		fontSize: 16,
		color: "#999",
	},
	clearAllButton: {
		backgroundColor: "#f0f0f0",
		padding: 10,
		borderRadius: 5,
		alignItems: "center",
		marginTop: 10,
	},
	clearAllText: {
		color: "#666",
		fontWeight: "500",
	},
});
