
// Import mock data from a static file
const mockData = {
  status: {
    temperature: 29.5,
    humidity: 61.2,
    fan: false,
    cabinet: {
      sang: "closed",
      trua: "opened",
      toi: "closed"
    },
    lastUpdated: "2025-05-21T10:34:00"
  },

  settings: {
    reminderTimes: {
      sang: "07:00",
      trua: "12:00",
      toi: "19:00"
    },
    alertThresholds: {
      temperature: 35,
      humidity: 65
    },
    autoControl: {
      enabled: true
    }
  },

  history: {
    "2025-05-21": {
      "10:00": {
        temperature: 28.7,
        humidity: 60.5
      },
      "12:00": {
        temperature: 29.3,
        humidity: 61.0,
        cabinetOpened: "trua"
      }
    },
    "2025-05-20": {
      "07:00": {
        temperature: 27.5,
        humidity: 58.0,
        cabinetOpened: "sang"
      },
      "12:00": {
        temperature: 29.0,
        humidity: 59.5,
        cabinetOpened: "trua"
      },
      "19:00": {
        temperature: 28.0,
        humidity: 62.0,
        cabinetOpened: "toi"
      }
    },
    "2025-05-19": {
      "07:00": {
        temperature: 26.5,
        humidity: 57.0,
        cabinetOpened: "sang"
      },
      "19:00": {
        temperature: 27.0,
        humidity: 58.5
      }
    }
  },

  notifications: {
    "-Nxyz123": {
      title: "Cảnh báo nhiệt độ cao",
      type: "alert",
      message: "Nhiệt độ vượt ngưỡng: 36°C",
      timestamp: "2025-05-21T11:45:12"
    },
    "-Nabc456": {
      title: "Mở thuốc buổi trưa",
      type: "reminder",
      message: "Ngăn trưa đã được mở lúc 12:00",
      timestamp: "2025-05-21T12:01:00"
    },
    "-Ndef789": {
      title: "Cảnh báo độ ẩm cao",
      type: "alert",
      message: "Độ ẩm vượt ngưỡng: 67%",
      timestamp: "2025-05-20T15:30:22"
    },
    "-Nghi101": {
      title: "Quên uống thuốc buổi sáng",
      type: "reminder",
      message: "Bạn chưa mở ngăn thuốc buổi sáng",
      timestamp: "2025-05-19T08:15:00"
    }
  },

  logs: {
    "-Log001": {
      event: "manual_open",
      cabinet: "sang",
      timestamp: "2025-05-21T07:01:05"
    },
    "-Log002": {
      event: "auto_open",
      cabinet: "trua",
      timestamp: "2025-05-21T12:00:01"
    }
  }
};

// Mock Firebase-like listeners and callbacks
type Callback<T> = (data: T) => void;
type Unsubscribe = () => void;

// Mock Firebase real-time subscription
export function subscribeToData<T>(path: string, callback: Callback<T>): Unsubscribe {
  const pathSegments = path.split('/').filter(segment => segment);
  let data: any = mockData;

  // Navigate through the object path
  for (const segment of pathSegments) {
    if (data && data[segment] !== undefined) {
      data = data[segment];
    } else {
      data = null;
      break;
    }
  }

  // Call the callback with the data
  setTimeout(() => {
    callback(data);
  }, 500); // Simulate network delay

  return () => {
    // Mock unsubscribe function
    console.log(`Unsubscribed from ${path}`);
  };
}

// Mock Firebase get data
export async function getData<T>(path: string): Promise<T> {
  return new Promise((resolve) => {
    subscribeToData(path, (data) => {
      console.log(`[MockData] Fetched data for ${path}:`, data);
      resolve(data as T);
    });
  });
}

// Mock Firebase update data
export async function updateData(path: string, data: any): Promise<void> {
  const pathSegments = path.split('/').filter(segment => segment);
  let target: any = mockData;

  // Navigate to the correct location in the object
  for (let i = 0; i < pathSegments.length - 1; i++) {
    const segment = pathSegments[i];
    if (!target[segment]) {
      target[segment] = {};
    }
    target = target[segment];
  }

  // Update the data
  const lastSegment = pathSegments[pathSegments.length - 1];
  target[lastSegment] = { ...target[lastSegment], ...data };

  // Return after a delay to simulate network
  return new Promise((resolve) => {
    setTimeout(resolve, 500);
  });
}

// Mock Firebase push data (for logs, notifications)
export async function pushData(path: string, data: any): Promise<string> {
  const pathSegments = path.split('/').filter(segment => segment);
  let target: any = mockData;

  // Navigate to the correct location in the object
  for (const segment of pathSegments) {
    if (!target[segment]) {
      target[segment] = {};
    }
    target = target[segment];
  }

  // Generate a mock key
  const key = `-Mock${Math.random().toString(36).substr(2, 9)}`;
  target[key] = data;

  // Return the key after a delay
  return new Promise((resolve) => {
    setTimeout(() => resolve(key), 500);
  });
}

// Mock Firebase remove data
export async function removeData(path: string): Promise<void> {
  const pathSegments = path.split('/').filter(segment => segment);
  let target: any = mockData;

  // Navigate to the parent of the item to remove
  for (let i = 0; i < pathSegments.length - 1; i++) {
    const segment = pathSegments[i];
    if (!target[segment]) {
      return; // Path doesn't exist
    }
    target = target[segment];
  }

  // Remove the item
  const lastSegment = pathSegments[pathSegments.length - 1];
  if (target[lastSegment] !== undefined) {
    delete target[lastSegment];
  }

  // Return after a delay
  return new Promise((resolve) => {
    setTimeout(resolve, 500);
  });
}
