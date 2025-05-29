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
} from "victory-native";

export interface TimeSeriesDataPoint {
	x: string | number; // Can be time string or numeric value
	y: number;
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
}) => {
	// Determine chart appearance based on dark/light mode
	const textColor = darkMode ? "#E0E0E0" : "#333333";
	const backgroundColor = darkMode ? "#1E1E1E" : "#FFFFFF";
	const gridLineColor = darkMode
		? "rgba(255,255,255,0.1)"
		: "rgba(0,0,0,0.1)";

	// Calculate domain paddings and other chart adjustments
	const calculateYDomain = () => {
		if (data.length === 0) return [0, 1];

		const yValues = data.map((d) => d.y);
		const minY = Math.min(...yValues);
		const maxY = Math.max(...yValues);
		const padding = (maxY - minY) * 0.1 || 0.5; // Add padding or default value

		return [Math.max(0, minY - padding), maxY + padding];
	};

	const screenWidth = Dimensions.get("window").width - 60; // Accounting for margins

	// Calculate dynamic width based on data points - make it wider
	const dataCount = data.length;
	const pointWidth = 40; // Increased width per data point for better readability
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
				strokeWidth: 1,
				size: 3,
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

	// Format x-axis tick labels to show more precise time
	const formatTick = (tick: any) => {
		if (typeof tick === "string" && tick.length > 5) {
			// If we have a timestamp with seconds (HH:mm:ss), highlight seconds
			const parts = tick.split(":");
			if (parts.length === 3) {
				// Return the full time with seconds highlighted
				return `${parts[0]}:${parts[1]}:${parts[2]}`;
			}
			return tick;
		}
		return tick;
	};

	const chartContent = (
		<VictoryChart
			width={chartWidth}
			height={240}
			padding={{ top: 30, right: 30, bottom: 60, left: 60 }} // Increased bottom padding for labels
			theme={darkMode ? VictoryTheme.material : VictoryTheme.grayscale}
			domain={{ y: calculateYDomain() }}
			scale={{ x: "time" }} // Add time scale to handle time properly
		>
			{/* X Axis */}
			<VictoryAxis
				label={xAxisLabel}
				axisLabelComponent={
					<VictoryLabel dy={40} style={chartStyles.axisLabel} />
				}
				style={{
					axis: { stroke: darkMode ? "#555" : "#ccc" },
					grid: chartStyles.gridLine,
					tickLabels: {
						...chartStyles.axisTickLabels,
						angle: 45,
						textAnchor: "start",
						fontSize: 8, // Smaller font to fit more labels
					},
				}}
				tickFormat={formatTick}
				tickCount={Math.min(15, Math.max(5, Math.floor(dataCount / 5)))} // Show more ticks
			/>

			{/* Y Axis */}
			<VictoryAxis
				dependentAxis
				label={yAxisLabel}
				axisLabelComponent={
					<VictoryLabel dy={-45} style={chartStyles.axisLabel} />
				}
				tickFormat={(t) => t.toFixed(1)}
				style={{
					axis: { stroke: darkMode ? "#555" : "#ccc" },
					grid: chartStyles.gridLine,
					tickLabels: chartStyles.axisTickLabels,
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
				data={data}
				x="x"
				y="y"
				interpolation="monotoneX"
				style={chartStyles.line}
			/>

			{/* Data points (optional) */}
			{showDataPoints && data.length < 30 && (
				<VictoryScatter
					data={data}
					x="x"
					y="y"
					style={chartStyles.scatter}
				/>
			)}
		</VictoryChart>
	);

	return (
		<View style={[styles.container, { backgroundColor }]}>
			{title && (
				<Text style={[styles.title, { color: textColor }]}>
					{title}{" "}
					{data.length > 0
						? `(${data.length} điểm dữ liệu mới nhất)`
						: ""}
				</Text>
			)}

			{enableScrolling ? (
				<ScrollView
					ref={scrollViewRef}
					horizontal
					showsHorizontalScrollIndicator={true}
					contentContainerStyle={styles.scrollViewContent}
				>
					{chartContent}
				</ScrollView>
			) : (
				chartContent
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		borderRadius: 10,
		padding: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		marginVertical: 10,
	},
	title: {
		fontSize: 16,
		fontWeight: "bold",
		marginBottom: 10,
		textAlign: "center",
	},
	scrollViewContent: {
		flexGrow: 1,
	},
});

export default TimeSeriesChart;
