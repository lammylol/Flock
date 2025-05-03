// __tests__/app/(tabs)/(prayers)/createPrayerPoint.test.tsx
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { render } from '../../../test-utils';

// Mock expo router
jest.mock('expo-router', () => ({
    router: {
        back: jest.fn(),
        replace: jest.fn(),
        dismissAll: jest.fn()
    },
    useLocalSearchParams: jest.fn().mockReturnValue({}),
    Stack: {
        Screen: (props: any) => null
    }
}));

// Mock components
jest.mock('../../../../components/Prayer/PrayerViews/PrayerContent', () => ({
    __esModule: true,
    default: (props: any) => {
        // Simulate component interaction
        React.useEffect(() => {
            props.onChange({
                title: 'Test Prayer Title',
                content: 'Test Prayer Content',
                type: 'request'
            });
        }, []);
        return null;
    }
}));

jest.mock('../../../../components/Prayer/PrayerViews/PrayerPointLinking', () => ({
    __esModule: true,
    default: () => null
}));

jest.mock('../../../../components/ThemedKeyboardAvoidingView', () => {
    const { View } = require('react-native');
    return {
        ThemedKeyboardAvoidingView: (props: any) => <View {...props} />,
    };
});

jest.mock('../../../../components/ThemedScrollView', () => {
    const { ScrollView } = require('react-native');
    return {
        ThemedScrollView: (props: any) => <ScrollView {...props} />,
    };
});

jest.mock('../../../../components/ThemedText', () => {
    const { Text } = require('react-native');
    return {
        ThemedText: (props: any) => <Text {...props} />,
    };
});

jest.mock('../../../../components/ui/HeaderButton', () => ({
    HeaderButton: () => null,
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock the prayer service
jest.mock('../../../../services/prayer/prayerService', () => ({
    prayerService: {
        createPrayerPoint: jest.fn().mockResolvedValue('new-prayer-point-id'),
        findRelatedPrayers: jest.fn().mockResolvedValue([])
    }
}));

// Import the component and service
import PrayerPointMetadataScreen from '../../../../app/(tabs)/(prayers)/createPrayerPoint';
import { prayerService } from '../../../../services/prayer/prayerService';

describe('PrayerPointMetadataScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders in create mode by default', () => {
        const { getByText } = render(<PrayerPointMetadataScreen />);

        // Check for the Create button text
        expect(getByText(/Create Prayer Point/)).toBeTruthy();
    });

    it('submits a prayer point when form is valid', async () => {
        const { getByText } = render(<PrayerPointMetadataScreen />);

        // Get and press the submit button
        const submitButton = getByText(/Create Prayer Point/);
        fireEvent.press(submitButton);

        // Verify the service was called with correct data
        await waitFor(() => {
            expect(prayerService.createPrayerPoint).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Test Prayer Title',
                    content: 'Test Prayer Content',
                    type: 'request'
                })
            );
        });

        // Verify success alert was shown
        expect(Alert.alert).toHaveBeenCalledWith(
            'Success',
            'Prayer Point created successfully.'
        );
    });
});