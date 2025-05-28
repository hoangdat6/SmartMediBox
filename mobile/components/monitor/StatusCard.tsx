import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StatusCardProps {
  title: string;
  value: number | null;
  unit: string;
  isAnomaly: boolean;
  iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  primaryColor: string;
  colors: {
    card: string;
    text: string;
    border: string;
  };
}

export const StatusCard = ({
  title,
  value,
  unit,
  isAnomaly,
  iconName,
  primaryColor,
  colors,
}: StatusCardProps) => {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isAnomaly ? primaryColor : colors.border,
          borderWidth: isAnomaly ? 2 : 1,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={iconName}
        size={28}
        color={isAnomaly ? primaryColor : primaryColor}
      />
      <Text style={[styles.value, { color: isAnomaly ? primaryColor : colors.text }]}>
        {value ? `${value.toFixed(1)}${unit}` : `--${unit}`}
      </Text>
      <Text style={[styles.label, { color: colors.text }]}>{title}</Text>
      {isAnomaly && (
        <View style={[styles.anomalyBadge, { backgroundColor: primaryColor }]}>
          <MaterialCommunityIcons name="alert" size={16} color="#FFF" />
          <Text style={styles.anomalyText}>Bất thường</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  label: {
    fontSize: 14,
    marginTop: 5,
  },
  anomalyBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  anomalyText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 3,
  },
});
