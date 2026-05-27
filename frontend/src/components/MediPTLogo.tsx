import React from 'react';
import { Image, Platform, useColorScheme } from 'react-native';

const SVG_LIGHT = `<svg width="200" height="56" viewBox="0 0 200 56" xmlns="http://www.w3.org/2000/svg"><rect width="56" height="56" rx="14" fill="#0891B2"/><g transform="translate(28,28) rotate(-40)"><circle cx="-8" cy="0" r="7" fill="white"/><rect x="-8" y="-7" width="8" height="14" fill="white"/><circle cx="8" cy="0" r="7" fill="white" opacity="0.5"/><rect x="0" y="-7" width="8" height="14" fill="white" opacity="0.5"/><line x1="0" y1="-7" x2="0" y2="7" stroke="white" stroke-width="1.5"/></g><text x="68" y="37" font-family="-apple-system,'Helvetica Neue',sans-serif" font-weight="700" font-size="34" fill="#0F172A">Medi</text><text x="150" y="37" font-family="-apple-system,'Helvetica Neue',sans-serif" font-weight="500" font-size="34" fill="#0891B2">PT</text></svg>`;

const SVG_DARK = `<svg width="200" height="56" viewBox="0 0 200 56" xmlns="http://www.w3.org/2000/svg"><rect width="56" height="56" rx="14" fill="#0891B2"/><g transform="translate(28,28) rotate(-40)"><circle cx="-9" cy="0" r="8" fill="white"/><rect x="-9" y="-8" width="9" height="16" fill="white"/><circle cx="9" cy="0" r="8" fill="white" opacity="0.28"/><rect x="0" y="-8" width="9" height="16" fill="white" opacity="0.28"/><line x1="0" y1="-8" x2="0" y2="8" stroke="white" stroke-width="1.2" opacity="0.5"/></g><text x="70" y="37" font-family="-apple-system,'Helvetica Neue',sans-serif" font-weight="700" font-size="34" fill="white">Medi</text><text x="152" y="37" font-family="-apple-system,'Helvetica Neue',sans-serif" font-weight="500" font-size="34" fill="#38BDF8">PT</text></svg>`;

const ASPECT = 200 / 56;

interface Props {
  width?: number;
}

export default function MediPTLogo({ width = 140 }: Props) {
  const rawScheme = useColorScheme();
  const colorScheme = Platform.OS === 'web' ? 'light' : rawScheme;
  const isDark = colorScheme === 'dark';

  if (Platform.OS === 'web') {
    const height = Math.round(width / ASPECT);
    return (
      <Image
        source={{ uri: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(isDark ? SVG_DARK : SVG_LIGHT)}` }}
        style={{ width, height }}
        resizeMode="contain"
      />
    );
  }

  const logoSource = colorScheme === 'dark'
    ? require('../../assets/logo-dark.png')
    : require('../../assets/logo-light.png');

  return (
    <Image source={logoSource} style={{ width: 120, height: 34 }} resizeMode="contain" />
  );
}
