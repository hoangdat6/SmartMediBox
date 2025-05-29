import { getData, removeData } from "@/services/firebaseService";
import { NotificationMap } from "@/types";
import { create } from "zustand";

interface NotificationsStore {
	notifications: NotificationMap | null;
	loading: boolean;
	error: string | null;
	fetchNotifications: () => Promise<void>;
	clearNotification: (id: string) => Promise<boolean>;
	clearAllNotifications: () => Promise<boolean>;
}

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
	notifications: null,
	loading: true,
	error: null,

	fetchNotifications: async () => {
		set({ loading: true, error: null });
		try {
			const data = await getData<NotificationMap>("notifications");

			if (data) {
				set({ notifications: data, loading: false });
			} else {
				set({ notifications: {}, loading: false });
			}
		} catch (err: any) {
			set({
				error: `Failed to load notifications: ${err.message}`,
				loading: false,
			});
		}
	},

	clearNotification: async (id: string) => {
		try {
			await removeData(`notifications/${id}`);

			// Update local state
			set((state) => {
				const updatedNotifications = {
					...state.notifications,
				} as NotificationMap;
				if (updatedNotifications) {
					delete updatedNotifications[id];
				}
				return { notifications: updatedNotifications };
			});

			return true;
		} catch (err: any) {
			set({ error: `Failed to remove notification: ${err.message}` });
			return false;
		}
	},

	clearAllNotifications: async () => {
		try {
			await removeData("notifications");
			set({ notifications: {} });
			return true;
		} catch (err: any) {
			set({ error: `Failed to clear notifications: ${err.message}` });
			return false;
		}
	},
}));

// Initialize notifications
useNotificationsStore.getState().fetchNotifications();
