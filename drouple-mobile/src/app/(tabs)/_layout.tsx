/**
 * Tabs Layout - Bottom tab navigation with icons
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { useTokens } from '../../theme/provider';

export default function TabsLayout() {
  const tokens = useTokens();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.colors.primary[500],
        tabBarInactiveTintColor: tokens.colors.gray[500],
        tabBarStyle: {
          backgroundColor: tokens.colors.white,
          borderTopColor: tokens.colors.gray[200],
          height: 84,
          paddingBottom: 34, // Safe area for iOS home indicator
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={focused ? '🏠' : '🏡'} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="checkin"
        options={{
          title: 'Check In',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={focused ? '📱' : '📲'} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={focused ? '📅' : '🗓️'} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="directory"
        options={{
          title: 'Directory',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={focused ? '👥' : '👤'} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="announcements"
        options={{
          title: 'News',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={focused ? '📢' : '📰'} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={focused ? '⚙️' : '🔧'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return (
    <span style={{ fontSize: 22, color }}>{icon}</span>
  );
}