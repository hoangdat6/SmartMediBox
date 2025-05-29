import { useSettingsStore } from "@/stores/settingsStore";

export type TimeOfDay = "morning" | "noon" | "evening";

/**
 * Determines the current time of day (morning, noon, evening) based on settings
 * @returns TimeOfDay or null if not in any time period
 */
export const getCurrentTimeOfDayFromSettings = (): TimeOfDay | null => {
	const settings = useSettingsStore.getState().settings;
	if (!settings?.reminderTimes) return null;

	const now = new Date();
	const currentHour = now.getHours();
	const currentMinute = now.getMinutes();
	const currentTimeInMinutes = currentHour * 60 + currentMinute;

	const { morning, noon, evening } = settings.reminderTimes;

	// Check if current time falls within any of the defined periods
	if (morning.available) {
		const morningStart = timeToMinutes(morning.start);
		const morningEnd = timeToMinutes(morning.end);
		if (
			currentTimeInMinutes >= morningStart &&
			currentTimeInMinutes <= morningEnd
		) {
			return "morning";
		}
	}

	if (noon.available) {
		const noonStart = timeToMinutes(noon.start);
		const noonEnd = timeToMinutes(noon.end);
		if (
			currentTimeInMinutes >= noonStart &&
			currentTimeInMinutes <= noonEnd
		) {
			return "noon";
		}
	}

	if (evening.available) {
		const eveningStart = timeToMinutes(evening.start);
		const eveningEnd = timeToMinutes(evening.end);
		if (
			currentTimeInMinutes >= eveningStart &&
			currentTimeInMinutes <= eveningEnd
		) {
			return "evening";
		}
	}

	return null;
};

/**
 * Legacy function - kept for backward compatibility
 * @returns TimeOfDay based on hard-coded time ranges
 */
export const getCurrentTimeOfDay = (): TimeOfDay => {
	const currentHour = new Date().getHours();

	if (currentHour >= 5 && currentHour < 11) {
		return "morning"; // Morning (5am-11am)
	} else if (currentHour >= 11 && currentHour < 17) {
		return "noon"; // Noon (11am-5pm)
	} else {
		return "evening"; // Evening (5pm-5am)
	}
};

/**
 * Formats a time string (HH:MM) to be displayed
 * @param timeString Time in "HH:MM" format
 * @returns Formatted time string (e.g., "7:00 AM")
 */
export const formatTimeForDisplay = (timeString: string): string => {
	try {
		const [hours, minutes] = timeString.split(":").map(Number);
		const period = hours >= 12 ? "PM" : "AM";
		const displayHours = hours % 12 || 12;
		return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
	} catch (e) {
		return timeString;
	}
};

/**
 * Convert time string to minutes for comparison
 */
export const timeToMinutes = (timeString: string | undefined): number => {
	if (!timeString) return 0;

	try {
		const [hours, minutes] = timeString.split(":").map(Number);
		return (hours || 0) * 60 + (minutes || 0);
	} catch (error) {
		console.error("Error converting time to minutes:", error);
		return 0;
	}
};
