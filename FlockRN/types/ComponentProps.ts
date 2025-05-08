import { ReactElement } from 'react';
import { PrayerPoint } from './firebase';

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

export type LinkedPrayerPointPair = {
  prayerPoint: PrayerPoint;
  prayerPointEmbedding?: number[] | null;
  originPrayer?: PrayerPoint | null;
  topicTitle?: string | null;
};
