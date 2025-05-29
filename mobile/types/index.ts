// Define TimeOfDay type for compartments
export type TimeOfDay = "morning" | "noon" | "evening";
export type CompartmentState = "opened" | "closed";

// Cabinet status types
export interface CabinetStatus {
	morning: CompartmentState;
	noon: CompartmentState;
	evening: CompartmentState;
}

// Status data structure from Firebase
export interface StatusData {
	cabinet: CabinetStatus;
	temperature: number;
	humidity: number;
	fan: boolean;
	lastUpdated: string;
}

// Settings types
export interface ReminderTimes {
	morning: string;
	noon: string;
	evening: string;
}

export interface AlertThresholds {
	temperature: number;
	humidity: number;
}

export interface AutoControl {
	enabled: boolean;
}

export interface Settings {
	reminderTimes: ReminderTimes;
	alertThresholds: AlertThresholds;
	autoControl: AutoControl;
}

// History data types
export interface HistoryTimepoint {
	temperature: number;
	humidity: number;
	cabinetOpened?: TimeOfDay;
}

export interface HistoryDay {
	[timepoint: string]: HistoryTimepoint;
}

export interface HistoryData {
	[date: string]: HistoryDay;
}

// Notification types
export type NotificationType = "alert" | "reminder" | "info";

export interface Notification {
	title: string;
	type: NotificationType;
	message: string;
	timestamp: string;
}

export interface NotificationWithId extends Notification {
	id: string;
}

export type NotificationMap = Record<string, Notification>;

// Log types
export interface LogEntry {
	event: string;
	cabinet?: TimeOfDay;
	timestamp: string;
}
