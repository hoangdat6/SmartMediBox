export type TimeOfDay = 'sang' | 'trua' | 'toi';

/**
 * Determines the current time of day (morning, noon, evening)
 * @returns 'sang' | 'trua' | 'toi'
 */
export const getCurrentTimeOfDay = (): TimeOfDay => {
  const currentHour = new Date().getHours();
  
  if (currentHour >= 5 && currentHour < 11) {
    return 'sang'; // Morning (5am-11am)
  } else if (currentHour >= 11 && currentHour < 17) {
    return 'trua'; // Noon (11am-5pm)
  } else {
    return 'toi'; // Evening (5pm-5am)
  }
};

/**
 * Formats a time string (HH:MM) to be displayed
 * @param timeString Time in "HH:MM" format
 * @returns Formatted time string (e.g., "7:00 AM")
 */
export const formatTimeForDisplay = (timeString: string): string => {
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  } catch (e) {
    return timeString;
  }
};
