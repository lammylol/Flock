import { ReactElement } from 'react';

export enum EditMode {
  VIEW = 'view',
  EDIT = 'edit',
  CREATE = 'create',
}

export interface PrayerCardButtonProps {
  label: string;
  fontWeight?: '400' | '500' | '600' | '700';
  fontSize?: number;
  backgroundColor?: string;
  textColor?: string;
  icon?: ReactElement;
  onPress: () => void;
}
