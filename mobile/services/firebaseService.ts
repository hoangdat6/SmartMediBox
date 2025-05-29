import { database } from "@/utils/firebaseConfig";
import {
	get,
	onValue,
	push,
	ref,
	remove,
	set,
	update,
} from "firebase/database";

// Subscribe to real-time data updates
export function subscribeToData<T>(
	path: string,
	callback: (data: T) => void
): () => void {
	const dbRef = ref(database, path);

	const unsubscribe = onValue(
		dbRef,
		(snapshot) => {
			const data = snapshot.val() as T;
			callback(data);
		},
		(error) => {
			console.error(`Error subscribing to ${path}:`, error);
		}
	);

	return unsubscribe;
}

// Get data once
export async function getData<T>(path: string): Promise<T> {
	try {
		const dbRef = ref(database, path);
		const snapshot = await get(dbRef);

		if (snapshot.exists()) {
			return snapshot.val() as T;
		} else {
			console.log(`No data available at ${path}`);
			return {} as T;
		}
	} catch (error) {
		console.error(`Error fetching data from ${path}:`, error);
		throw error;
	}
}

// Update data (replace)
export async function updateData(path: string, data: any): Promise<void> {
	try {
		const dbRef = ref(database, path);
		await set(dbRef, data);
		console.log(`Data updated at ${path}`);
	} catch (error) {
		console.error(`Error updating data at ${path}:`, error);
		throw error;
	}
}

// Update data (merge)
export async function updatePartialData(
	path: string,
	data: any
): Promise<void> {
	try {
		const dbRef = ref(database, path);
		await update(dbRef, data);
		console.log(`Data partially updated at ${path}`);
	} catch (error) {
		console.error(`Error updating data at ${path}:`, error);
		throw error;
	}
}

// Push data with auto-generated key
export async function pushData(path: string, data: any): Promise<string> {
	try {
		const dbRef = ref(database, path);
		const newItemRef = push(dbRef);
		await set(newItemRef, data);

		const key = newItemRef.key;
		console.log(`New data pushed to ${path} with key: ${key}`);

		return key || "";
	} catch (error) {
		console.error(`Error pushing data to ${path}:`, error);
		throw error;
	}
}

// Remove data
export async function removeData(path: string): Promise<void> {
	try {
		const dbRef = ref(database, path);
		await remove(dbRef);
		console.log(`Data removed at ${path}`);
	} catch (error) {
		console.error(`Error removing data at ${path}:`, error);
		throw error;
	}
}
