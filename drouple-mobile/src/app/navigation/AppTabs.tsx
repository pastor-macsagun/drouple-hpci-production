/**
 * Main App Tab Navigator
 * Bottom tabs: Home(Dashboard), CheckIn, Events, More
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomNavigation } from 'react-native-paper';
import { CommonActions } from '@react-navigation/native';

import { DashboardScreen } from '@/features/dashboard/screens/DashboardScreen';
import { CheckInScreen } from '@/features/checkin/screens/CheckInScreen';
import { EventsStack } from '@/features/events/navigation/EventsStack';
import { MembersScreen } from '@/features/members/screens/MembersScreen';
import { MoreScreen } from '@/features/dashboard/screens/MoreScreen';

const Tab = createBottomTabNavigator();

export const AppTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={({ navigation, state, descriptors, insets }) => (
        <BottomNavigation.Bar
          navigationState={state}
          safeAreaInsets={insets}
          onTabPress={({ route, preventDefault }) => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (event.defaultPrevented) {
              preventDefault();
            } else {
              navigation.dispatch({
                ...CommonActions.navigate(route.name, route.params),
                target: state.key,
              });
            }
          }}
          renderIcon={({ route, focused, color }) => {
            const { options } = descriptors[route.key];
            if (options.tabBarIcon) {
              return options.tabBarIcon({ focused, color, size: 24 });
            }
            return null;
          }}
          getLabelText={({ route }) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                  ? options.title
                  : route.name;
            return label as string;
          }}
        />
      )}
    >
      <Tab.Screen
        name='Home'
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <BottomNavigation.Icon source='home' color={color} />
          ),
          tabBarAccessibilityLabel: 'Dashboard - View your church overview',
        }}
      />
      <Tab.Screen
        name='CheckIn'
        component={CheckInScreen}
        options={{
          tabBarLabel: 'Check-In',
          tabBarIcon: ({ color, size }) => (
            <BottomNavigation.Icon source='qrcode-scan' color={color} />
          ),
          tabBarAccessibilityLabel:
            'Check-In - Scan QR codes or check-in members',
        }}
      />
      <Tab.Screen
        name='Events'
        component={EventsStack}
        options={{
          tabBarLabel: 'Events',
          tabBarIcon: ({ color, size }) => (
            <BottomNavigation.Icon source='calendar-heart' color={color} />
          ),
          tabBarAccessibilityLabel: 'Events - Browse and RSVP to church events',
        }}
      />
      <Tab.Screen
        name='Members'
        component={MembersScreen}
        options={{
          tabBarLabel: 'Members',
          tabBarIcon: ({ color, size }) => (
            <BottomNavigation.Icon source='account-group' color={color} />
          ),
          tabBarAccessibilityLabel: 'Members - Search and view church members',
        }}
      />
      <Tab.Screen
        name='More'
        component={MoreScreen}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ color, size }) => (
            <BottomNavigation.Icon source='dots-horizontal' color={color} />
          ),
          tabBarAccessibilityLabel:
            'More - Access additional features and settings',
        }}
      />
    </Tab.Navigator>
  );
};

export default AppTabs;
