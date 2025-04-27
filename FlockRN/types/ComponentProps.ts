export enum EditMode {
  VIEW = 'view',
  EDIT = 'edit',
  CREATE = 'create',
}

export interface PrayerCardButtonProps {
  label: string;
  icon?: string;
  iconSize?: number;
  onPress: () => void;
}
