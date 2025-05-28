import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface InfoSectionProps {
  theme: 'dark' | 'light';
  colors: {
    text: string;
  };
}

export const InfoSection = ({ theme, colors }: InfoSectionProps) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        Về phát hiện bất thường
      </Text>
      <Text style={[styles.text, { color: theme === 'dark' ? '#AAA' : '#666' }]}>
        Hệ thống tự động phát hiện các đột biến hoặc giảm bất thường trong các chỉ số cảm biến
        bằng cách phân tích thống kê. Các chỉ số khác biệt đáng kể so với
        mẫu gần đây được đánh dấu là bất thường.
      </Text>
      <Text style={[styles.note, { color: theme === 'dark' ? '#AAA' : '#666' }]}>
        Dữ liệu cảm biến được thu thập mỗi 5 giây và phân tích theo thời gian thực.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  note: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
