import React from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import {
	VictoryArea,
	VictoryAxis,
	VictoryChart,
	VictoryLabel,
	VictoryLine,
	VictoryScatter,
	VictoryTheme,
	VictoryTooltip,
} from "victory-native";

export interface TimeSeriesDataPoint {
	x: string | number; // Can be time string or numeric value
	y: number;
	temperatureThreshold?: number; // Add threshold properties to each data point
	humidityThreshold?: number;
}

interface TimeSeriesChartProps {
	data: TimeSeriesDataPoint[];
	title?: string;
	xAxisLabel?: string;
	yAxisLabel?: string;
	color?: string;
	darkMode?: boolean;
	showDataPoints?: boolean;
	showGradient?: boolean;
	enableScrolling?: boolean;
	focusOnLatest?: boolean;
	maxPoints?: number; // Maximum number of points to display
	dataType?: "temperature" | "humidity"; // Add dataType property
	thresholds?: {
		// Add thresholds prop
		temperature?: number;
		humidity?: number;
	};
	timeScale?: "realtime" | "day" | "hour"; // Add timeScale property
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
	data,
	title = "",
	xAxisLabel = "",
	yAxisLabel = "",
	color = "#1E88E5",
	darkMode = false,
	showDataPoints = true,
	showGradient = true,
	enableScrolling = false,
	focusOnLatest = false,
	maxPoints = 50,
	dataType,
	thresholds,
	timeScale = "realtime",
}) => {
	// Determine chart appearance based on dark/light mode
	const textColor = darkMode ? "#E0E0E0" : "#333333";
	const backgroundColor = darkMode ? "#1E1E1E" : "#FFFFFF";
	const gridLineColor = darkMode
		? "rgba(255,255,255,0.1)"
		: "rgba(0,0,0,0.1)";

	// Calculate domain paddings and other chart adjustments
	const calculateYDomain = (): [number, number] => {
		// Return fixed ranges based on dataType
		if (dataType === "temperature") {
			return [25, 40]; // Fixed range for temperature (°C)
		} else if (dataType === "humidity") {
			return [60, 90]; // Fixed range for humidity (%)
		}

		// Fallback to dynamic calculation if dataType is not specified
		if (data.length === 0) return [0, 1];

		const yValues = data.map((d) => d.y);
		const minY = Math.min(...yValues);
		const maxY = Math.max(...yValues);
		const padding = (maxY - minY) * 0.1 || 0.5; // Add padding or default value

		return [Math.max(0, minY - padding), maxY + padding];
	};

	const screenWidth = Dimensions.get("window").width - 60; // Accounting for margins

	// Calculate dynamic width based on data points - make it wider with more spacing
	const dataCount = data.length;
	const pointWidth = timeScale === "realtime" ? 80 : 60; // Adjust spacing based on time scale
	const minWidth = screenWidth;
	const chartWidth = enableScrolling
		? Math.max(dataCount * pointWidth, minWidth)
		: screenWidth;

	// Style configuration
	const chartStyles = {
		axisLabel: {
			fill: textColor,
			fontWeight: "bold",
			fontSize: 14,
		},
		axisTickLabels: {
			fill: darkMode ? "#BDBDBD" : "#757575",
			fontSize: 10,
		},
		gridLine: {
			stroke: gridLineColor,
			strokeWidth: 0.5,
		},
		line: {
			data: {
				stroke: color,
				strokeWidth: 2,
			},
		},
		area: {
			data: {
				fill: color,
				fillOpacity: 0.2,
			},
		},
		scatter: {
			data: {
				fill: color,
				stroke: darkMode ? "#121212" : "#FFFFFF",
				strokeWidth: 1.5,
				size: 5, // Increased size for better visibility
			},
			labels: {
				fill: darkMode ? "#FFF" : "#333",
				fontSize: 9,
				fontWeight: "bold",
				padding: 5,
				backgroundColor: darkMode ? "#333" : "#F5F5F5",
				borderRadius: 3,
			},
		},
	};

	// Create a ref for the scroll view
	const scrollViewRef = React.useRef<ScrollView>(null);

	// Scroll to the end when data changes and focusOnLatest is true
	React.useEffect(() => {
		if (scrollViewRef.current && focusOnLatest && enableScrolling) {
			setTimeout(() => {
				scrollViewRef.current?.scrollToEnd({ animated: true });
			}, 50); // Reduced timeout for faster scrolling
		}
	}, [data, focusOnLatest, enableScrolling]);

	// Format x-axis tick labels based on time scale
	const formatTick = (tick: any) => {
		if (typeof tick !== "string") return tick;

		switch (timeScale) {
			case "day":
				// For day view, format as "HH:00"
				return `${tick.split(":")[0]}:00`;

			case "hour":
				// For hour view, format as "HH:MM"
				return tick;

			default:
				// For realtime view, remove milliseconds
				const parts = tick.split(":");
				if (parts.length === 3) {
					const seconds = parts[2].split(".")[0];
					return `${parts[0]}:${parts[1]}:${seconds}`;
				}
				return tick;
		}
	};

	// Check if a value is abnormal (exceeds threshold)
	const isAbnormalValue = (
		value: number,
		dataPoint?: TimeSeriesDataPoint
	): boolean => {
		// First check thresholds in the data point itself
		if (dataPoint) {
			if (dataType === "temperature" && dataPoint.temperatureThreshold) {
				return value >= dataPoint.temperatureThreshold;
			}
			if (dataType === "humidity" && dataPoint.humidityThreshold) {
				return value >= dataPoint.humidityThreshold;
			}
		}

		// Fallback to thresholds from props
		if (!thresholds) return false;

		if (dataType === "temperature" && thresholds.temperature) {
			return value >= thresholds.temperature;
		}
		if (dataType === "humidity" && thresholds.humidity) {
			return value >= thresholds.humidity;
		}
		return false;
	};

	// Format label based on time scale with multiple lines - compact version
	const formatLabel = (dataPoint: TimeSeriesDataPoint) => {
		const value =
			dataPoint.y.toFixed(1) + (dataType === "temperature" ? "°C" : "%");
		const timeStr = dataPoint.x.toString();
		const abnormal = isAbnormalValue(dataPoint.y, dataPoint);

		// Format time string based on time scale (keep it simple)
		let formattedTime = timeStr;
		if (timeScale === "realtime") {
			// For realtime view, format as HH:MM:SS without labels
			const timeParts = timeStr.split(":");
			if (timeParts.length >= 2) {
				const seconds = timeParts[2]
					? timeParts[2].split(".")[0]
					: "00";
				formattedTime = `${timeParts[0]}:${timeParts[1]}:${seconds}`;
			}
		}

		// Create compact multi-line tooltip (just time and value)
		let tooltipText = `${formattedTime}\n${value}`;

		// Add minimal abnormal indicator if applicable
		if (abnormal) {
			tooltipText += "\n⚠️"; // Use an icon instead of text
		}

		return tooltipText;
	};

	// Add data labels to points with abnormal indication
	const labeledData = data
		.filter(
			(point) =>
				point.y !== undefined && point.y !== null && !isNaN(point.y)
		)
		.map((point) => {
			const abnormal = isAbnormalValue(point.y, point);
			return {
				...point,
				label: formatLabel(point),
				abnormal, // Add this flag for styling
			};
		});

	// Fixed y-axis chart
	const yAxisChart = (
		<VictoryChart
			width={50} // Reduced width for y-axis
			height={240}
			padding={{ top: 20, right: 0, bottom: 50, left: 50 }}
			theme={darkMode ? VictoryTheme.material : VictoryTheme.grayscale}
			domain={{ y: calculateYDomain() }}
		>
			{/* Y Axis Only */}
			<VictoryAxis
				dependentAxis
				label={yAxisLabel}
				axisLabelComponent={
					<VictoryLabel dy={-40} style={chartStyles.axisLabel} />
				}
				tickFormat={(t) => t.toFixed(1)}
				style={{
					axis: { stroke: darkMode ? "#555" : "#ccc" },
					grid: chartStyles.gridLine,
					tickLabels: chartStyles.axisTickLabels,
				}}
			/>
		</VictoryChart>
	);

	// Get appropriate scale for x-axis based on time scale
	const getXAxisScale = () => {
		switch (timeScale) {
			case "day":
			case "hour":
				return "time"; // Use time scale for day and hour views
			default:
				return "time"; // Use time scale for realtime view
		}
	};

	// Determine the number of ticks based on time scale and data count
	const getTickCount = () => {
		switch (timeScale) {
			case "day":
				return Math.min(24, dataCount); // Show one tick per hour if possible
			case "hour":
				return Math.min(12, Math.max(6, Math.floor(dataCount / 5))); // Show fewer ticks for hour view
			default:
				return Math.min(10, Math.max(5, Math.floor(dataCount / 8))); // Default for realtime
		}
	};

	// Main chart content (without y-axis)
	const mainChartContent = (
		<VictoryChart
			width={chartWidth}
			height={240}
			padding={{ top: 20, right: 30, bottom: 50, left: 0 }} // Increased right padding
			theme={darkMode ? VictoryTheme.material : VictoryTheme.grayscale}
			domain={{ y: calculateYDomain() }}
			scale={{ x: getXAxisScale() }}
		>
			{/* X Axis */}
			<VictoryAxis
				label={xAxisLabel}
				axisLabelComponent={
					<VictoryLabel dy={35} style={chartStyles.axisLabel} />
				}
				style={{
					axis: { stroke: darkMode ? "#555" : "#ccc" },
					grid: chartStyles.gridLine,
					tickLabels: {
						...chartStyles.axisTickLabels,
						angle: 45,
						textAnchor: "start",
						fontSize: 9,
						fontWeight: "bold",
					},
				}}
				tickFormat={formatTick}
				tickCount={getTickCount()}
			/>

			{/* Empty Y Axis (to maintain spacing) */}
			<VictoryAxis
				dependentAxis
				style={{
					axis: { stroke: "transparent" },
					grid: chartStyles.gridLine,
					tickLabels: { opacity: 0 },
				}}
			/>

			{/* Area under the line (optional) */}
			{showGradient && (
				<VictoryArea
					data={data}
					x="x"
					y="y"
					interpolation="monotoneX"
					style={chartStyles.area}
				/>
			)}

			{/* Main data line */}
			<VictoryLine
				data={data.filter(
					(point) =>
						point.y !== undefined &&
						point.y !== null &&
						!isNaN(point.y)
				)}
				x="x"
				y="y"
				interpolation="monotoneX"
				style={chartStyles.line}
			/>

			{/* Data points with always visible labels */}
			{showDataPoints && (
				<VictoryScatter
					data={labeledData}
					x="x"
					y="y"
					style={{
						data: ({ datum }) => {
							// If the point is abnormal, use a different color or style
							if (datum.abnormal) {
								return {
									fill: "#FF0000", // Red color for abnormal points
									stroke: darkMode ? "#121212" : "#FFFFFF",
									strokeWidth: 1.5,
									size: 6, // Slightly larger
								};
							}
							// Otherwise, use the default style
							return {
								fill: color,
								stroke: darkMode ? "#121212" : "#FFFFFF",
								strokeWidth: 1.5,
								size: 5,
							};
						},
						labels: chartStyles.scatter.labels,
					}}
					size={5}
					labels={({ datum }) =>
						datum &&
						datum.y !== undefined &&
						datum.y !== null &&
						!isNaN(datum.y)
							? datum.label
							: null
					}
					labelComponent={
						<VictoryTooltip
							active={({ datum }) =>
								datum &&
								datum.y !== undefined &&
								datum.y !== null &&
								!isNaN(datum.y)
							}
							flyoutStyle={({ datum }) => ({
								stroke: datum.abnormal ? "#FF0000" : color,
								strokeWidth: datum.abnormal ? 2 : 1,
								fill: darkMode
									? "rgba(33, 33, 33, 0.95)"
									: "rgba(255, 255, 255, 0.95)",
							})}
							flyoutPadding={{
								top: 3,
								bottom: 3,
								left: 5,
								right: 5,
							}}
							pointerLength={3}
							cornerRadius={2}
							renderInPortal={false}
							style={{
								fontSize: 9,
								fontWeight: "normal",
								lineHeight: 1.2,
							}}
							// Add a constraint to ensure flyout renders only with valid coordinates
							constrainToVisibleArea={true}
						/>
					}
				/>
			)}
		</VictoryChart>
	);

	// Update the title to include appropriate count information
	const getDisplayTitle = () => {
		if (!title) return "";

		switch (timeScale) {
			case "day":
				return `${title} (${data.length} giờ)`;
			case "hour":
				return `${title} (${data.length} phút)`;
			default:
				return `${title} (${data.length} điểm dữ liệu mới nhất)`;
		}
	};

	return (
		<View style={[styles.container, { backgroundColor }]}>
			{title && (
				<Text style={[styles.title, { color: textColor }]}>
					{getDisplayTitle()}
				</Text>
			)}

			<View style={styles.chartContainer}>
				{/* Fixed Y-axis (always visible) */}
				<View style={styles.yAxisContainer}>{yAxisChart}</View>

				{/* Scrollable chart content */}
				{enableScrolling ? (
					<ScrollView
						ref={scrollViewRef}
						horizontal
						showsHorizontalScrollIndicator={true}
						contentContainerStyle={styles.scrollViewContent}
					>
						<View style={styles.mainChartContainer}>
							{mainChartContent}
						</View>
					</ScrollView>
				) : (
					<View style={styles.mainChartContainer}>
						{mainChartContent}
					</View>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		borderRadius: 0, // Remove border radius
		padding: 5, // Reduce padding
		marginVertical: 5, // Reduce margin
	},
	title: {
		fontSize: 16,
		fontWeight: "bold",
		marginBottom: 5, // Reduce margin
		textAlign: "center",
	},
	chartContainer: {
		flexDirection: "row",
		alignItems: "flex-start",
	},
	yAxisContainer: {
		width: 50, // Reduced width
		height: 240,
	},
	mainChartContainer: {
		flex: 1,
	},
	scrollViewContent: {
		flexGrow: 1,
	},
});

export default TimeSeriesChart;
