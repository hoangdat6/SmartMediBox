import { getData, updateData } from "@/services/firebaseService"; // Changed from mockDataService
import { Settings } from "@/types";
import { create } from "zustand";

interface SettingsStore {
	settings: Settings | null;
	loading: boolean;
	error: string | null;
	fetchSettings: () => Promise<void>;
	updateReminderTime: (timeOfDay: string, time: string) => void;
	updateTemperatureThreshold: (value: number) => void;
	updateHumidityThreshold: (value: number) => void;
	toggleAutoControl: () => void;
	saveSettings: () => Promise<boolean>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
	settings: null,
	loading: true,
	error: null,

	fetchSettings: async () => {
		set({ loading: true, error: null });
		try {
			const data = await getData<Settings>("settings");

			if (data) {
				set({ settings: data, loading: false });
			} else {
				set({
					settings: {
						reminderTimes: {
							morning: "07:00",
							noon: "12:00",
							evening: "19:00",
						},
						alertThresholds: { temperature: 35, humidity: 65 },
						autoControl: { enabled: true },
					},
					loading: false,
				});
			}
		} catch (err: any) {
			set({
				error: `Failed to load settings: ${err.message}`,
				loading: false,
			});
		}
	},

	updateReminderTime: (timeOfDay: string, time: string) => {
		set((state) => ({
			settings: state.settings
				? {
						...state.settings,
						reminderTimes: {
							...state.settings.reminderTimes,
							[timeOfDay]: time,
						},
				  }
				: null,
		}));
	},

	updateTemperatureThreshold: (value: number) => {
		set((state) => ({
			settings: state.settings
				? {
						...state.settings,
						alertThresholds: {
							...state.settings.alertThresholds,
							temperature: value,
						},
				  }
				: null,
		}));
	},

	updateHumidityThreshold: (value: number) => {
		set((state) => ({
			settings: state.settings
				? {
						...state.settings,
						alertThresholds: {
							...state.settings.alertThresholds,
							humidity: value,
						},
				  }
				: null,
		}));
	},

	toggleAutoControl: () => {
		set((state) => ({
			settings: state.settings
				? {
						...state.settings,
						autoControl: {
							enabled: !state.settings.autoControl.enabled,
						},
				  }
				: null,
		}));
	},

	saveSettings: async () => {
		try {
			const settings = get().settings;
			if (settings) {
				await updateData("settings", settings);
				return true;
			}
			return false;
		} catch (err: any) {
			set({ error: `Failed to save settings: ${err.message}` });
			return false;
		}
	},
}));

// Initialize settings
useSettingsStore.getState().fetchSettings();
