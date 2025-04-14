// PrayerContext.tsx
import { PrayerPoint } from '@/types/firebase';
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PrayerContextType {
  title: string;
  content: string;
  prayerPoints: PrayerPoint[];
  tags?: string[];
  setTitle: (newTitle: string) => void;
  setContent: (newContent: string) => void;
  setPrayerPoints: (newPrayerPoints: PrayerPoint[]) => void;
  setTags?: (newTags: string[]) => void;
}

const PrayerContext = createContext<PrayerContextType | undefined>(undefined);

export const PrayerProvider = ({ children }: { children: ReactNode }) => {
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [prayerPoints, setPrayerPoints] = useState<PrayerPoint[]>([]);

  return (
    <PrayerContext.Provider
      value={
        {
          title,
          content,
          tags,
          prayerPoints,
          setTitle,
          setContent,
          setTags,
          setPrayerPoints,
        } as PrayerContextType
      }
    >
      {children}
    </PrayerContext.Provider>
  );
};

export const usePrayerContext = (): PrayerContextType => {
  const context = useContext(PrayerContext);
  if (!context) {
    throw new Error('usePrayerContext must be used within a PrayerProvider');
  }
  return context;
};
