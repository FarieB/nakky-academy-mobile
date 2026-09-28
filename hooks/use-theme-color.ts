import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light
) {
  const colorScheme = useColorScheme();
  const theme: 'light' | 'dark' =
    colorScheme === 'dark' ? 'dark' : 'light';

  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }

  return Colors[theme][colorName];
}
