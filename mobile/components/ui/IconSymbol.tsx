// Fallback for using MaterialIcons on Android and web.

import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Map iOS-style icon names to MaterialCommunityIcons names
const iconMap: Record<string, string> = {
  'house.fill': 'home',
  'chart.bar.fill': 'chart-bar',
  'bell.fill': 'bell',
  'gear': 'cog',
  'paperplane.fill': 'send',
  // Add more mappings as needed
};

interface IconSymbolProps {
  name: string;
  size: number;
  color: string;
}

export function IconSymbol({ name, size, color }: IconSymbolProps) {
  // Convert the iOS-style icon name to a MaterialCommunityIcons name
  const materialIconName = iconMap[name] || 'help-circle';

  return (
    <MaterialCommunityIcons 
      name={materialIconName as any} 
      size={size} 
      color={color} 
    />
  );
}
