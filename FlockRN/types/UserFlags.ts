export type userFlagTypes = {
  type: string;
  displayName: string;
};

export enum UserFlags {
  optInAI = 'optInAI',
}

export const userFlags: userFlagTypes[] = [
  { type: UserFlags.optInAI, displayName: 'AI integration' },
];
