export const userOptInFlagAsyncStorageKey = 'userControlledFlags';
export enum UserOptInFlags {
  optInAI = 'optInAI',
}
export type UserOptInFlagsType = {
  [key in UserOptInFlags]: boolean;
};

export const defaultUserOptInFlagState = {
  [UserOptInFlags.optInAI]: false,
};

export const flagTranslations = {
  optInFlags: {
    optInAI: 'Opt-In to AI',
  },
};

export const userIntroFlowAsyncStorageKey = 'userIntroFlow';
export enum UserIntroFlow {
  hasIntroDisclosures = 'hasIntroDisclosures',
}
export type UserIntroFlowType = {
  [key in UserIntroFlow]: boolean;
};
export const defaultUserIntroFlowState = {
  [UserIntroFlow.hasIntroDisclosures]: false,
};
