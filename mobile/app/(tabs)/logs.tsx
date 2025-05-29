import LogItem from "@/components/LogItem";
import { LogEntry } from "@/types";
import { database } from "@/utils/firebaseConfig";
import { format } from "date-fns";
import { off, onValue, ref } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { LogData } from "react-native-reanimated/lib/typescript/logger";

// Type definitions for grouped logs
interface GroupedLogsByPeriod {
	morning: { timestamp: string; entry: LogEntry }[];
	noon: { timestamp: string; entry: LogEntry }[];
	evening: { timestamp: string; entry: LogEntry }[];
	other: { timestamp: string; entry: LogEntry }[];
}

interface GroupedLogsByDate {
	[date: string]: GroupedLogsByPeriod;
}

export default function LogScreen() {
	const [logs, setLogs] = useState<{ timestamp: string; entry: LogEntry }[]>(
		[]
	);
	const [groupedLogs, setGroupedLogs] = useState<GroupedLogsByDate>({});
	const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>(
		{}
	);
	const [expandedPeriods, setExpandedPeriods] = useState<
		Record<string, Record<string, boolean>>
	>({});
	const [loading, setLoading] = useState(true);

	// Process logs into grouped structure
	const processLogs = (
		logsArray: { timestamp: string; entry: LogEntry }[]
	) => {
		const grouped: GroupedLogsByDate = {};

		logsArray.forEach((log) => {
			const date = format(new Date(log.timestamp), "dd/MM/yyyy");
			const hour = new Date(log.timestamp).getHours();

			let period: keyof GroupedLogsByPeriod = "other";
			if (hour >= 5 && hour < 11) period = "morning";
			else if (hour >= 11 && hour < 14) period = "noon";
			else if (hour >= 17 && hour < 22) period = "evening";

			// Initialize date group if not exists
			if (!grouped[date]) {
				grouped[date] = {
					morning: [],
					noon: [],
					evening: [],
					other: [],
				};
				// Auto-expand new dates
				if (!expandedDates[date]) {
					setExpandedDates((prev) => ({ ...prev, [date]: true }));
				}
			}

			// Add log to appropriate group
			grouped[date][period].push(log);
		});

		return grouped;
	};

	useEffect(() => {
		const logsRef = ref(database, "logs");

		const unsubscribe = onValue(
			logsRef,
			(snapshot) => {
				if (snapshot.exists()) {
					const logData: LogData = snapshot.val();

					// Convert the object into an array and sort by timestamp (descending)
					const logArray = Object.entries(logData)
						.map(([timestamp, entry]) => ({
							timestamp,
							entry,
						}))
						.sort(
							(a, b) =>
								new Date(b.timestamp).getTime() -
								new Date(a.timestamp).getTime()
						);

					setLogs(logArray);
					setGroupedLogs(processLogs(logArray));
				} else {
					setLogs([]);
					setGroupedLogs({});
				}

				setLoading(false);
			},
			(error) => {
				console.error("Error fetching logs:", error);
				setLoading(false);
			}
		);

		return () => off(logsRef);
	}, []);

	// Toggle expansion of a date
	const toggleDateExpansion = (date: string) => {
		setExpandedDates((prev) => ({
			...prev,
			[date]: !prev[date],
		}));
	};

	// Toggle expansion of a period within a date
	const togglePeriodExpansion = (date: string, period: string) => {
		setExpandedPeriods((prev) => ({
			...prev,
			[date]: {
				...prev[date],
				[period]: !prev[date]?.[period],
			},
		}));
	};

	// Initialize period expansion state if not exists
	const isPeriodExpanded = (date: string, period: string) => {
		if (!expandedPeriods[date]) {
			setExpandedPeriods((prev) => ({
				...prev,
				[date]: { [period]: true },
			}));
			return true;
		}
		return expandedPeriods[date][period] !== false;
	};

	const renderPeriodSection = (
		date: string,
		periodKey: keyof GroupedLogsByPeriod,
		title: string
	) => {
		const logs = groupedLogs[date][periodKey];
		if (logs.length === 0) return null;

		const isExpanded = isPeriodExpanded(date, periodKey);

		return (
			<View style={styles.periodSection} key={`${date}-${periodKey}`}>
				<TouchableOpacity
					style={styles.periodHeader}
					onPress={() => togglePeriodExpansion(date, periodKey)}
				>
					<Text style={styles.periodTitle}>
						{title} ({logs.length})
					</Text>
					<Text>{isExpanded ? "▼" : "►"}</Text>
				</TouchableOpacity>

				{isExpanded && (
					<View style={styles.periodContent}>
						{logs.map((log) => (
							<LogItem
								key={log.timestamp}
								timestamp={log.timestamp}
								entry={log.entry}
							/>
						))}
					</View>
				)}
			</View>
		);
	};

	if (loading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Text style={styles.header}>Nhật ký tủ thuốc thông minh</Text>

			{Object.keys(groupedLogs).length === 0 ? (
				<Text style={styles.emptyText}>Không có dữ liệu nhật ký</Text>
			) : (
				<FlatList
					data={Object.keys(groupedLogs).sort((a, b) => {
						// Sort dates in descending order (newest first)
						const dateA = new Date(
							a.split("/").reverse().join("-")
						);
						const dateB = new Date(
							b.split("/").reverse().join("-")
						);
						return dateB.getTime() - dateA.getTime();
					})}
					keyExtractor={(date) => date}
					renderItem={({ item: date }) => (
						<View style={styles.dateSection}>
							<TouchableOpacity
								style={styles.dateHeader}
								onPress={() => toggleDateExpansion(date)}
							>
								<Text style={styles.dateTitle}>{date}</Text>
								<Text>{expandedDates[date] ? "▼" : "►"}</Text>
							</TouchableOpacity>

							{expandedDates[date] && (
								<View style={styles.dateContent}>
									{renderPeriodSection(
										date,
										"morning",
										"Buổi sáng"
									)}
									{renderPeriodSection(
										date,
										"noon",
										"Buổi trưa"
									)}
									{renderPeriodSection(
										date,
										"evening",
										"Buổi tối"
									)}
									{renderPeriodSection(
										date,
										"other",
										"Thời gian khác"
									)}
								</View>
							)}
						</View>
					)}
					contentContainerStyle={styles.listContent}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: "#f5f5f5",
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	header: {
		fontSize: 22,
		fontWeight: "bold",
		marginBottom: 16,
		textAlign: "center",
	},
	emptyText: {
		textAlign: "center",
		marginTop: 50,
		fontSize: 16,
		color: "#888",
	},
	listContent: {
		paddingBottom: 20,
	},
	dateSection: {
		marginBottom: 16,
		backgroundColor: "white",
		borderRadius: 8,
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 2,
		elevation: 3,
	},
	dateHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 12,
		backgroundColor: "#e0f2fe",
	},
	dateTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#0369a1",
	},
	dateContent: {
		padding: 8,
	},
	periodSection: {
		marginBottom: 10,
	},
	periodHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 8,
		paddingHorizontal: 12,
		backgroundColor: "#f1f5f9",
		borderRadius: 6,
	},
	periodTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#334155",
	},
	periodContent: {
		paddingTop: 8,
	},
});
