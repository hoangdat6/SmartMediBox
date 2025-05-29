import {
	pushData,
	subscribeToData,
	updateData,
} from "@/services/firebaseService";
import { CabinetStatus, StatusData, TimeOfDay } from "@/types";
import { useEffect, useState } from "react";

interface FirebaseDataResult {
	cabinetStatus: CabinetStatus | null;
	temperatureData: number | null;
	humidityData: number | null;
	fanStatus: boolean;
	loading: boolean;
	error: string | null;
	openCabinet: (timeOfDay: TimeOfDay) => Promise<boolean>;
	closeCabinet: (timeOfDay: TimeOfDay) => Promise<boolean>;
	toggleFan: (status: boolean) => Promise<boolean>;
}

export function useFirebaseData(): FirebaseDataResult {
	const [cabinetStatus, setCabinetStatus] = useState<CabinetStatus | null>(
		null
	);
	const [temperatureData, setTemperatureData] = useState<number | null>(null);
	const [humidityData, setHumidityData] = useState<number | null>(null);
	const [fanStatus, setFanStatus] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// Subscribe to status updates using the mock service
		const unsubscribe = subscribeToData<StatusData>("status", (data) => {
			try {
				if (data) {
					setCabinetStatus(
						data.cabinet || {
							morning: "closed",
							noon: "closed",
							evening: "closed",
						}
					);
					setTemperatureData(data.temperature || 0);
					setHumidityData(data.humidity || 0);
					setFanStatus(data.offlinefan || false);
				}
				setLoading(false);
			} catch (err: any) {
				setError(`Failed to load data: ${err.message}`);
				setLoading(false);
			}
		});

		// Cleanup function
		return () => unsubscribe();
	}, []);

	// Function to open a cabinet
	const openCabinet = async (timeOfDay: TimeOfDay): Promise<boolean> => {
		try {
			// Update cabinet status
			await updateData(`status/cabinet/${timeOfDay}`, "opened");

			// Update local state immediately for responsiveness
			setCabinetStatus((prevState) => {
				if (!prevState)
					return {
						morning: timeOfDay === "morning" ? "opened" : "closed",
						noon: timeOfDay === "noon" ? "opened" : "closed",
						evening: timeOfDay === "evening" ? "opened" : "closed",
					};

				return {
					...prevState,
					[timeOfDay]: "opened",
				};
			});

			// Log the opening event with timestamp as key
			const timestamp = new Date().toISOString();
			await pushData(`logs/${timestamp}`, {
				event: "open",
				cabinet: timeOfDay,
				timestamp: timestamp,
			});

			return true;
		} catch (err: any) {
			console.error("Error opening cabinet:", err);
			return false;
		}
	};

	// Function to close a cabinet
	const closeCabinet = async (timeOfDay: TimeOfDay): Promise<boolean> => {
		try {
			// Update cabinet status
			await updateData(`status/cabinet/${timeOfDay}`, "closed");

			// Update local state immediately for responsiveness
			setCabinetStatus((prevState) => {
				if (!prevState)
					return {
						morning: timeOfDay === "morning" ? "closed" : "opened",
						noon: timeOfDay === "noon" ? "closed" : "opened",
						evening: timeOfDay === "evening" ? "closed" : "opened",
					};

				return {
					...prevState,
					[timeOfDay]: "closed",
				};
			});

			// Log the closing event with timestamp as key
			const timestamp = new Date().toISOString();
			await pushData(`logs/${timestamp}`, {
				event: "close",
				cabinet: timeOfDay,
				timestamp: timestamp,
			});

			return true;
		} catch (err: any) {
			console.error("Error closing cabinet:", err);
			return false;
		}
	};

	// Function to toggle fan status
	const toggleFan = async (status: boolean): Promise<boolean> => {
		try {
			// Update fan status
			await updateData("status/onlinefan", status);
			await updateData("status/offlinefan", status);

			// Update local state immediately for responsiveness
			setFanStatus(status);

			// Log the fan event with timestamp as key
			const timestamp = new Date().toISOString();
			await pushData(`logs/${timestamp}`, {
				event: status ? "fan_on" : "fan_off",
				timestamp: timestamp,
			});

			return true;
		} catch (err: any) {
			console.error("Error controlling fan:", err);
			return false;
		}
	};

	return {
		cabinetStatus,
		temperatureData,
		humidityData,
		fanStatus,
		loading,
		error,
		openCabinet,
		closeCabinet,
		toggleFan,
	};
}
