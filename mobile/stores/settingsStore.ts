import { getData, updateData } from "@/services/firebaseService";
import { Settings } from "@/types";
import { create } from "zustand";

interface SettingsStore {
	settings: Settings | null;
	loading: boolean;
	error: string | null;
	fetchSettings: () => Promise<void>;
	updateReminderTime: (
		timeOfDay: string,
		timeType: "start" | "end",
		time: string
	) => void;
	toggleReminderEnability: (timeOfDay: string) => void;
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
							morning: {
								drank: true,
								start: "06:00",
								end: "08:00",
							},
							noon: {
								drank: true,
								start: "11:30",
								end: "13:30",
							},
							evening: {
								drank: true,
								start: "18:00",
								end: "20:00",
							},
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

	updateReminderTime: (
		timeOfDay: string,
		timeType: "start" | "end",
		time: string
	) => {
		set((state) => ({
			settings: state.settings
				? {
						...state.settings,
						reminderTimes: {
							...state.settings.reminderTimes,
							[timeOfDay]: {
								...state.settings.reminderTimes[
									timeOfDay as keyof typeof state.settings.reminderTimes
								],
								[timeType]: time,
							},
						},
				  }
				: null,
		}));
	},

	toggleReminderEnability: (timeOfDay: string) => {
		set((state) => ({
			settings: state.settings
				? {
						...state.settings,
						reminderTimes: {
							...state.settings.reminderTimes,
							[timeOfDay]: {
								...state.settings.reminderTimes[
									timeOfDay as keyof typeof state.settings.reminderTimes
								],
								enabled:
									!state.settings.reminderTimes[
										timeOfDay as keyof typeof state.settings.reminderTimes
									].enabled,
							},
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
