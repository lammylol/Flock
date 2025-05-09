// __tests__/createPrayerPoint.test.tsx
import React from 'react';
import { Alert, TextInput, TouchableOpacity } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import PrayerPointMetadataScreen from '@/app/(tabs)/(prayers)/(createPrayerPoint)/createPrayerPoint';
import { EditMode } from '@/types/ComponentProps';
import { EntityType, PrayerType } from '@/types/PrayerSubtypes';

// Create the mock function before we do the mock
const mockUseLocalSearchParams = jest.fn().mockReturnValue({});
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockDismissAll = jest.fn();

// Mock expo-router with more accurate implementation
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  router: {
    back: mockBack,
    replace: mockReplace,
    dismissAll: mockDismissAll,
  },
  Stack: {
    Screen: ({ children, options }) => (
      <div data-testid="stack-screen">
        {options?.headerLeft && options.headerLeft()}
        {children}
      </div>
    ),
  },
}));

// Create a mock for firebase auth that matches the actual implementation
jest.mock('@/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    },
  },
}));

// Mock useSimilarPrayers with implementation matching actual hook
jest.mock('@/hooks/prayerScreens/useSimilarPrayers', () => ({
  useSimilarPrayers: jest.fn((prayerPoint, editMode) => {
    // This matches the actual implementation's return structure
    return {
      similarPrayers: [],
      embedding: [0.1, 0.2, 0.3, 0.4, 0.5], // More realistic embedding
    };
  }),
}));

// Mock usePrayerLinking with more details
jest.mock('@/hooks/prayerScreens/usePrayerLinking', () => ({
  usePrayerLinking: jest.fn(() => ({
    handlePrayerLinkingOnChange: jest.fn((data) => data),
    linkAndSyncPrayerPoint: jest.fn(({ isNewPrayerPoint }) => 
      Promise.resolve({
        finalPrayerPoint: {
          id: isNewPrayerPoint ? 'new-prayer-point-id' : 'test-prayer-point-id',
          title: 'Test Prayer Point',
          content: 'Test content',
          privacy: 'private',
          prayerType: 'request',
          entityType: EntityType.PrayerPoint,
          tags: ['request'],
        },
        fullOriginPrayer: null,
        topicId: null,
      })
    ),
  })),
}));

// Mock usePrayerPointHandler with more complete implementation
jest.mock('@/hooks/prayerScreens/usePrayerPointHandler', () => ({
  usePrayerPointHandler: jest.fn(({ id, privacy }) => {
    const prayerPoint = {
      id: id || '',
      title: 'Test Prayer Point',
      content: 'Test Content', 
      prayerType: PrayerType.Request,
      entityType: EntityType.PrayerPoint,
      authorId: 'test-user-id',
      authorName: 'Test User',
      privacy: privacy || 'private',
      status: 'open',
      createdAt: new Date('2025-04-01'),
      updatedAt: new Date('2025-04-01'),
      tags: [PrayerType.Request],
    };
    
    return {
      updatedPrayerPoint: prayerPoint,
      handlePrayerPointUpdate: jest.fn((updates) => ({ ...prayerPoint, ...updates })),
      createPrayerPoint: jest.fn(() => Promise.resolve('new-prayer-point-id')),
      updatePrayerPoint: jest.fn(() => Promise.resolve({})),
      loadPrayerPoint: jest.fn(() => Promise.resolve(prayerPoint)),
    };
  }),
}));

// Mock useFormState with more accurate implementation
jest.mock('@/hooks/useFormState', () => {
  const mockSetPrivacy = jest.fn();
  const mockSetIsDataLoading = jest.fn();
  const mockSetIsSubmissionLoading = jest.fn();
  
  return {
    __esModule: true,
    default: jest.fn(({ editMode }) => {
      const isEditMode = editMode === EditMode.EDIT;
      
      return {
        formState: {
          privacy: 'private',
          isEditMode: isEditMode,
        },
        isSubmissionLoading: false,
        setIsDataLoading: mockSetIsDataLoading,
        setIsSubmissionLoading: mockSetIsSubmissionLoading,
        setPrivacy: mockSetPrivacy,
      };
    }),
    mockSetPrivacy,
    mockSetIsDataLoading,
    mockSetIsSubmissionLoading,
  };
});

// Mock useThemeColor to match actual implementation
jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColor: jest.fn((props, colorName) => {
    const colorMap = {
      text: '#000000',
      background: '#FFFFFF',
      backgroundSecondary: '#F0F0F0',
      tint: '#2f95dc',
    };
    return colorMap[colorName] || '#f2f2f2';
  }),
}));

// Mock PrayerCollectionContext with realistic data
jest.mock('@/context/PrayerCollectionContext', () => {
  const mockUpdateCollection = jest.fn();
  
  return {
    usePrayerCollection: () => ({
      userPrayers: [],
      userPrayerPoints: [
        {
          id: 'existing-prayer-point-id',
          title: 'Existing Prayer Point',
          content: 'Existing content',
          prayerType: PrayerType.Request,
          entityType: EntityType.PrayerPoint,
          authorId: 'test-user-id',
          authorName: 'Test User',
          createdAt: new Date('2025-01-15'),
          updatedAt: new Date('2025-01-15'),
          privacy: 'private',
          status: 'open',
          tags: [PrayerType.Request],
        },
      ],
      updateCollection: mockUpdateCollection,
    }),
    mockUpdateCollection,
  };
});

// Mock all UI components required by the test
jest.mock('@/components/ThemedText', () => ({
  ThemedText: ({ children, style, ...props }) => (
    <div data-testid="themed-text" style={style} {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ThemedScrollView', () => ({
  ThemedScrollView: ({ children, contentContainerStyle, ...props }) => (
    <div data-testid="themed-scroll-view" style={contentContainerStyle} {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ThemedKeyboardAvoidingView', () => ({
  ThemedKeyboardAvoidingView: ({ children, style, ...props }) => (
    <div data-testid="themed-keyboard-avoiding-view" style={style} {...props}>
      {children}
    </div>
  ),
}));

// Mock HeaderButton component
jest.mock('@/components/ui/HeaderButton', () => ({
  HeaderButton: ({ onPress, label }) => (
    <button data-testid="header-button" onClick={onPress}>
      {label}
    </button>
  ),
}));

// Mock PrayerContent with implementation that handles onChange events
jest.mock('@/components/Prayer/PrayerViews/PrayerContent', () => {
  return {
    __esModule: true,
    default: ({ onChange, prayer, editMode, prayerOrPrayerPoint }) => {
      const handleTitleChange = (text) => {
        if (onChange) {
          onChange({ 
            ...prayer, 
            title: text,
          });
        }
      };
      
      const handleContentChange = (text) => {
        if (onChange) {
          onChange({ 
            ...prayer, 
            content: text,
          });
        }
      };
      
      return (
        <div data-testid="prayer-content">
          <TextInput
            testID="title-input"
            value={prayer?.title}
            onChangeText={handleTitleChange}
            placeholder="Enter a title"
          />
          <TextInput
            testID="content-input"
            value={prayer?.content}
            onChangeText={handleContentChange}
            placeholder="Enter your prayer point here"
          />
        </div>
      );
    },
  };
});

// Mock PrayerPointLinking with implementation that handles onChange events
jest.mock('@/components/Prayer/PrayerViews/PrayerPointLinking', () => {
  return {
    __esModule: true,
    default: ({ onChange, similarPrayers, prayerPoint }) => (
      <div data-testid="prayer-point-linking">
        <button
          data-testid="link-prayer-button"
          onClick={() => onChange && onChange({ linkedPrayer: similarPrayers[0] })}
        >
          Link Prayer
        </button>
      </div>
    ),
  };
});

// Mock prayerLinkingService
jest.mock('@/services/prayer/prayerLinkingService', () => {
  const mockUpdatePrayerTopicWithJourneyAndGetEmbeddings = jest.fn().mockResolvedValue({});
  const mockRemoveEmbeddingFromFirebase = jest.fn().mockResolvedValue({});
  
  return {
    prayerLinkingService: {
      updatePrayerTopicWithJourneyAndGetEmbeddings: mockUpdatePrayerTopicWithJourneyAndGetEmbeddings,
      removeEmbeddingFromFirebase: mockRemoveEmbeddingFromFirebase,
    },
    mockUpdatePrayerTopicWithJourneyAndGetEmbeddings,
    mockRemoveEmbeddingFromFirebase,
  };
});

// Mock Alert
jest.spyOn(Alert, 'alert');

// Helper function to render the component with proper mocks
const renderComponent = () => {
  return render(<PrayerPointMetadataScreen />);
};

// Tests
describe('PrayerPointMetadataScreen Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({});
  });

  test('renders correctly in create mode', async () => {
    const { getByText, getByTestId } = renderComponent();
    
    // Verify screen title and buttons
    expect(getByText('Add Prayer Point')).toBeTruthy();
    expect(getByText('Create Prayer Point')).toBeTruthy();
    expect(getByText('Private')).toBeTruthy();
    
    // Verify components rendered
    expect(getByTestId('themed-keyboard-avoiding-view')).toBeTruthy();
    expect(getByTestId('themed-scroll-view')).toBeTruthy();
    expect(getByTestId('prayer-content')).toBeTruthy();
  });

  test('navigates back when cancel button is pressed', () => {
    const { getByText } = renderComponent();
    
    // Find and press the cancel button
    fireEvent.press(getByText('Cancel'));
    
    // Check that router.back was called
    expect(mockBack).toHaveBeenCalled();
  });

  test('handles form submission correctly', async () => {
    const { getByText, getByTestId } = renderComponent();
    
    // Submit the form
    await act(async () => {
      fireEvent.press(getByText('Create Prayer Point'));
    });
    
    // Verify navigation occurred
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)/(prayers)');
      expect(mockDismissAll).toHaveBeenCalled();
    });
  });

  test('loads prayer point when in edit mode', async () => {
    // Set up edit mode params
    mockUseLocalSearchParams.mockReturnValue({
      id: 'test-prayer-point-id',
      editMode: EditMode.EDIT,
    });
    
    const { getByText } = renderComponent();
    
    // Verify edit mode UI elements
    expect(getByText('Edit Prayer Point')).toBeTruthy();
    expect(getByText('Update Prayer Point')).toBeTruthy();
  });

  test('handles prayer point input correctly', async () => {
    const { getByTestId } = renderComponent();
    
    // Simulate title input
    const titleInput = getByTestId('title-input');
    fireEvent.changeText(titleInput, 'New Prayer Title');
    
    // Simulate content input
    const contentInput = getByTestId('content-input');
    fireEvent.changeText(contentInput, 'New prayer content text');
    
    // You can add assertions here for state updates if needed
    // For example, checking that handlePrayerPointUpdate was called with the right values
  });
});