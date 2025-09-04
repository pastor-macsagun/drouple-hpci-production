/**
 * Events Stack Navigator
 * Handles navigation between event list and detail screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { EventsScreen } from '../screens/EventsScreen';
import { EventDetailScreen } from '../screens/EventDetailScreen';
import { colors } from '@/theme/colors';

export type EventsStackParamList = {
  EventsList: undefined;
  EventDetail: { eventId: string };
};

const Stack = createNativeStackNavigator<EventsStackParamList>();

export const EventsStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary.main,
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name='EventsList'
        component={EventsScreen}
        options={{
          title: 'Events',
          headerShown: false, // EventsScreen handles its own header
        }}
      />
      <Stack.Screen
        name='EventDetail'
        component={EventDetailScreen}
        options={{
          title: 'Event Details',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default EventsStack;
