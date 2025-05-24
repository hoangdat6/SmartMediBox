// Statistical utility functions for anomaly detection

/**
 * Calculate the mean of an array of numbers
 */
export function getMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculate the standard deviation of an array of numbers
 */
export function getStandardDeviation(values: number[], mean: number): number {
  if (values.length <= 1) return 0;
  
  const variance = values.reduce((acc, val) => {
    const diff = val - mean;
    return acc + (diff * diff);
  }, 0) / (values.length - 1);
  
  return Math.sqrt(variance);
}

/**
 * Detect if a value is an outlier using z-score method
 */
export function isOutlier(value: number, mean: number, stdDev: number, threshold: number = 2): boolean {
  if (stdDev === 0) return false;
  const zScore = Math.abs((value - mean) / stdDev);
  return zScore > threshold;
}
