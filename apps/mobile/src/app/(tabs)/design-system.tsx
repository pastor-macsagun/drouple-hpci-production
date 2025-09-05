import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { useTheme, useTokens } from '@/theme';
import {
  Button,
  Input,
  Card,
  ListCell,
  Chip,
  Badge,
  Toast,
} from '@/components/ui';
import {
  Skeleton,
  SkeletonCard,
  SkeletonList,
  EmptyState,
  ErrorState,
} from '@/components/patterns';

export default function DesignSystemDemo() {
  const { toggleTheme, isDark, tenantAccent, setTenantAccent } = useTheme();
  const tokens = useTokens();
  
  const [inputValue, setInputValue] = useState('');
  const [selectedChip, setSelectedChip] = useState<string | null>('chip1');
  const [showToast, setShowToast] = useState(false);
  const [toastVariant, setToastVariant] = useState<'info' | 'success' | 'warning' | 'error'>('success');
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [showErrorState, setShowErrorState] = useState(false);

  const handleTenantAccentChange = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];
    const currentIndex = colors.indexOf(tenantAccent || '');
    const nextIndex = (currentIndex + 1) % colors.length;
    setTenantAccent(colors[nextIndex]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.bg.surface }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: tokens.colors.text.primary }]}>
            Design System v1.0
          </Text>
          <Text style={[styles.subtitle, { color: tokens.colors.text.secondary }]}>
            Drouple Mobile Components
          </Text>
        </View>

        {/* Theme Controls */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.text.primary }]}>
            Theme Controls
          </Text>
          
          <View style={styles.row}>
            <Button
              variant="outlined"
              size="sm"
              onPress={toggleTheme}
              leftIcon={isDark ? 'light-mode' : 'dark-mode'}
            >
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </Button>
            
            <Button
              variant="tonal"
              size="sm"
              onPress={handleTenantAccentChange}
              leftIcon="palette"
            >
              Change Accent
            </Button>
          </View>

          <View style={styles.colorPreview}>
            <View style={[styles.colorSwatch, { backgroundColor: tokens.colors.brand.primary }]} />
            <View style={[styles.colorSwatch, { backgroundColor: tokens.colors.accent.primary }]} />
            <View style={[styles.colorSwatch, { backgroundColor: tokens.colors.state.success }]} />
            <View style={[styles.colorSwatch, { backgroundColor: tokens.colors.state.error }]} />
          </View>
        </Card>

        {/* Buttons */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.text.primary }]}>
            Buttons
          </Text>
          
          <View style={styles.buttonGrid}>
            <Button variant="filled" size="lg">Filled Large</Button>
            <Button variant="tonal" size="md">Tonal Medium</Button>
            <Button variant="outline" size="sm">Outline Small</Button>
            <Button variant="text" leftIcon="add">Text with Icon</Button>
            <Button variant="icon" rightIcon="more-vert" />
            <Button variant="filled" loading>Loading</Button>
            <Button variant="outlined" disabled>Disabled</Button>
          </View>
        </Card>

        {/* Inputs */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.text.primary }]}>
            Input Fields
          </Text>
          
          <Input
            label="Name"
            placeholder="Enter your name"
            value={inputValue}
            onChangeText={setInputValue}
            leftIcon="person"
            style={styles.input}
          />
          
          <Input
            label="Email"
            placeholder="Enter your email"
            keyboardType="email-address"
            rightIcon="email"
            helperText="We'll never share your email"
            style={styles.input}
          />
          
          <Input
            label="Password"
            secureTextEntry
            errorText="Password is required"
            rightIcon="visibility"
            style={styles.input}
          />
        </Card>

        {/* List Cells */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.text.primary }]}>
            List Cells
          </Text>
          
          <ListCell
            title="Profile Settings"
            subtitle="Manage your account"
            leftIcon="person"
            showChevron
            onPress={() => Alert.alert('Profile pressed')}
          />
          
          <ListCell
            title="Notifications"
            subtitle="Push notifications enabled"
            description="Receive updates about events and announcements"
            leftIcon="notifications"
            rightElement={
              <Badge variant="dot" color="success" />
            }
          />
          
          <ListCell
            title="Help & Support"
            leftIcon="help"
            showChevron
            onPress={() => Alert.alert('Help pressed')}
          />
        </Card>

        {/* Chips and Badges */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.text.primary }]}>
            Chips & Badges
          </Text>
          
          <View style={styles.chipContainer}>
            <Chip
              label="All"
              selected={selectedChip === 'chip1'}
              onPress={() => setSelectedChip('chip1')}
            />
            <Chip
              label="Active"
              selected={selectedChip === 'chip2'}
              onPress={() => setSelectedChip('chip2')}
              leftIcon="check-circle"
            />
            <Chip
              label="Filter"
              variant="outlined"
              rightIcon="close"
              onRightIconPress={() => Alert.alert('Filter removed')}
            />
          </View>

          <View style={styles.badgeContainer}>
            <View style={styles.badgeItem}>
              <MaterialIcons name="notifications" size={24} color={tokens.colors.text.primary} />
              <Badge label={5} color="error" style={styles.badge} />
            </View>
            <View style={styles.badgeItem}>
              <MaterialIcons name="email" size={24} color={tokens.colors.text.primary} />
              <Badge label={99} max={99} color="primary" style={styles.badge} />
            </View>
            <View style={styles.badgeItem}>
              <Badge variant="dot" color="success" />
              <Text style={[styles.badgeLabel, { color: tokens.colors.text.secondary }]}>Online</Text>
            </View>
          </View>
        </Card>

        {/* States Demo */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.text.primary }]}>
            Component States
          </Text>
          
          <View style={styles.stateButtons}>
            <Button
              variant="tonal"
              size="sm"
              onPress={() => setShowSkeleton(!showSkeleton)}
            >
              {showSkeleton ? 'Hide' : 'Show'} Skeleton
            </Button>
            
            <Button
              variant="tonal"
              size="sm"
              onPress={() => setShowEmptyState(!showEmptyState)}
            >
              {showEmptyState ? 'Hide' : 'Show'} Empty
            </Button>
            
            <Button
              variant="tonal"
              size="sm"
              onPress={() => setShowErrorState(!showErrorState)}
            >
              {showErrorState ? 'Hide' : 'Show'} Error
            </Button>
            
            <Button
              variant="tonal"
              size="sm"
              onPress={() => setShowToast(true)}
            >
              Show Toast
            </Button>
          </View>

          {/* Conditional States */}
          {showSkeleton && (
            <View style={styles.stateDemo}>
              <SkeletonCard />
              <SkeletonList itemCount={3} />
            </View>
          )}

          {showEmptyState && (
            <View style={[styles.stateDemo, { height: 300 }]}>
              <EmptyState
                icon="inbox"
                title="Nothing Here"
                message="This is how empty states look in the design system."
                actionLabel="Got It"
                onAction={() => setShowEmptyState(false)}
              />
            </View>
          )}

          {showErrorState && (
            <View style={[styles.stateDemo, { height: 300 }]}>
              <ErrorState
                type="network"
                onRetry={() => {
                  setShowErrorState(false);
                  Alert.alert('Retrying...');
                }}
              />
            </View>
          )}
        </Card>

        {/* Typography Scale */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.text.primary }]}>
            Typography Scale
          </Text>
          
          <View style={styles.typographyDemo}>
            <Text style={[{ 
              fontSize: tokens.typography.display.lg.fontSize,
              fontWeight: '700',
              color: tokens.colors.text.primary,
              marginBottom: 8,
            }]}>
              Display Large
            </Text>
            
            <Text style={[{ 
              fontSize: tokens.typography.headline.md.fontSize,
              fontWeight: '600',
              color: tokens.colors.text.primary,
              marginBottom: 8,
            }]}>
              Headline Medium
            </Text>
            
            <Text style={[{ 
              fontSize: tokens.typography.title.lg.fontSize,
              fontWeight: '600',
              color: tokens.colors.text.primary,
              marginBottom: 8,
            }]}>
              Title Large
            </Text>
            
            <Text style={[{ 
              fontSize: tokens.typography.body.lg.fontSize,
              color: tokens.colors.text.secondary,
              marginBottom: 8,
            }]}>
              Body Large - The quick brown fox jumps over the lazy dog.
            </Text>
            
            <Text style={[{ 
              fontSize: tokens.typography.label.lg.fontSize,
              fontWeight: '600',
              color: tokens.colors.text.tertiary,
            }]}>
              Label Large - FORM LABELS & BUTTONS
            </Text>
          </View>
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: tokens.colors.text.tertiary }]}>
            Design System v1.0 • Christ-centered clarity • Mobile-first • Accessible by default
          </Text>
        </View>
      </ScrollView>

      {/* Toast */}
      <Toast
        visible={showToast}
        variant={toastVariant}
        title="Design System"
        message="This is a toast notification demonstrating the design system components."
        onDismiss={() => setShowToast(false)}
        action={{
          label: 'Undo',
          onPress: () => {
            setShowToast(false);
            Alert.alert('Action pressed');
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  section: {
    margin: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  buttonGrid: {
    gap: 12,
  },
  input: {
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  badgeItem: {
    position: 'relative',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  badgeLabel: {
    marginTop: 4,
    fontSize: 12,
  },
  stateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  stateDemo: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  typographyDemo: {
    gap: 8,
  },
  colorPreview: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});