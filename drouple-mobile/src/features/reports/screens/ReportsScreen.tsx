/**
 * Reports Screen
 * Role-gated dashboard with lightweight analytics and church metrics
 */

import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  Chip,
  IconButton,
  Surface,
  ActivityIndicator,
  Button,
  Divider,
  List,
} from 'react-native-paper';

import { colors } from '@/theme/colors';
import { useAuthStore } from '@/lib/store/authStore';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  getReportByChurch,
  getLatestReport,
  formatMetricChange,
  getHighlightColor,
  getHighlightIcon,
  getTrendIcon,
  formatPeriodText,
  calculateGrowthRate,
  type ReportSummary,
} from '@/data/mockReports';

export const ReportsScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Role-based access control
  const hasReportsAccess =
    user?.role && ['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(user.role);

  const reportData = useMemo(() => {
    if (!user?.churchId || !hasReportsAccess) return null;
    return getLatestReport(user.churchId);
  }, [user?.churchId, hasReportsAccess]);

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      // In a real app, this would fetch fresh data from the API
      console.log('Refreshing reports data...');

      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to refresh reports:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderMetricCard = (
    title: string,
    value: string | number,
    subtitle?: string,
    trend?: {
      value: number;
      isPercentage?: boolean;
      icon?: string;
    },
    icon?: string
  ) => (
    <Surface style={styles.metricCard} elevation={1}>
      <View style={styles.metricHeader}>
        {icon && (
          <IconButton
            icon={icon}
            size={20}
            iconColor={colors.primary.main}
            style={styles.metricIcon}
          />
        )}
        <View style={styles.metricInfo}>
          <Text variant='bodySmall' style={styles.metricTitle}>
            {title}
          </Text>
          <Text variant='headlineSmall' style={styles.metricValue}>
            {value}
          </Text>
          {subtitle && (
            <Text variant='bodySmall' style={styles.metricSubtitle}>
              {subtitle}
            </Text>
          )}
        </View>
        {trend && (
          <View style={styles.trendContainer}>
            <IconButton
              icon={
                trend.icon ||
                (trend.value > 0
                  ? 'trending-up'
                  : trend.value < 0
                    ? 'trending-down'
                    : 'minus')
              }
              size={16}
              iconColor={
                trend.value > 0
                  ? colors.success
                  : trend.value < 0
                    ? colors.error
                    : colors.text.secondary
              }
              style={styles.trendIcon}
            />
            <Text
              variant='bodySmall'
              style={[
                styles.trendText,
                {
                  color:
                    trend.value > 0
                      ? colors.success
                      : trend.value < 0
                        ? colors.error
                        : colors.text.secondary,
                },
              ]}
            >
              {trend.value > 0 ? '+' : ''}
              {trend.value.toFixed(trend.isPercentage ? 1 : 0)}
              {trend.isPercentage ? '%' : ''}
            </Text>
          </View>
        )}
      </View>
    </Surface>
  );

  const renderHighlightCard = (
    highlight: ReportSummary['highlights'][0],
    index: number
  ) => (
    <Card
      key={index}
      style={[
        styles.highlightCard,
        { borderLeftColor: getHighlightColor(highlight.type) },
      ]}
    >
      <Card.Content style={styles.highlightContent}>
        <View style={styles.highlightHeader}>
          <IconButton
            icon={getHighlightIcon(highlight.type)}
            size={18}
            iconColor={getHighlightColor(highlight.type)}
            style={styles.highlightIcon}
          />
          <View style={styles.highlightInfo}>
            <Text variant='titleSmall' style={styles.highlightTitle}>
              {highlight.title}
            </Text>
            <Text variant='bodyMedium' style={styles.highlightDescription}>
              {highlight.description}
            </Text>
          </View>
          {highlight.trend && (
            <IconButton
              icon={getTrendIcon(highlight.trend)}
              size={16}
              iconColor={colors.text.secondary}
              style={styles.highlightTrend}
            />
          )}
        </View>
      </Card.Content>
    </Card>
  );

  if (!hasReportsAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon='chart-line'
          title='Access Restricted'
          message='Reports are only available to Admins and Pastors.'
        />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={colors.primary.main} />
          <Text variant='bodyMedium' style={styles.loadingText}>
            Loading reports...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!reportData) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon='chart-line'
          title='No Reports Available'
          message='No report data found for your church.'
          action={
            <Button mode='contained' onPress={handleRefresh}>
              Refresh Data
            </Button>
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary.main]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant='headlineMedium' style={styles.headerTitle}>
            Church Reports
          </Text>
          <Text variant='bodyMedium' style={styles.headerSubtitle}>
            {formatPeriodText(reportData.period)}
          </Text>
          <Chip
            mode='outlined'
            style={styles.periodChip}
            textStyle={styles.periodText}
          >
            {reportData.period.type.toUpperCase()}
          </Chip>
        </View>

        {/* Quick Metrics Grid */}
        <View style={styles.metricsGrid}>
          {renderMetricCard(
            'Weekly Attendance',
            reportData.attendance.thisWeek,
            'This Week',
            {
              value: reportData.attendance.weeklyChangePercent,
              isPercentage: true,
            },
            'account-group'
          )}

          {renderMetricCard(
            'Total Events',
            reportData.events.totalEvents,
            'This Period',
            undefined,
            'calendar-multiple'
          )}

          {renderMetricCard(
            'Life Groups',
            reportData.lifeGroups.totalGroups,
            `${reportData.lifeGroups.totalMembers} members`,
            undefined,
            'account-group-outline'
          )}

          {renderMetricCard(
            'Active Pathways',
            reportData.pathways.totalPathways,
            `${reportData.pathways.totalEnrollments} enrollments`,
            undefined,
            'map-marker-path'
          )}
        </View>

        {/* Highlights Section */}
        <View style={styles.highlightsSection}>
          <Text variant='titleLarge' style={styles.sectionTitle}>
            Key Insights
          </Text>

          {reportData.highlights.map((highlight, index) =>
            renderHighlightCard(highlight, index)
          )}
        </View>

        {/* Detailed Breakdown */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text variant='titleMedium' style={styles.cardTitle}>
              Attendance Breakdown
            </Text>

            {reportData.attendance.breakdown.map((attendance, index) => (
              <List.Item
                key={index}
                title={attendance.service || 'Service'}
                description={new Date(attendance.date).toLocaleDateString()}
                right={() => (
                  <Text variant='bodyLarge' style={styles.attendanceCount}>
                    {attendance.count}
                  </Text>
                )}
                left={() => <List.Icon icon='calendar-clock' />}
                style={styles.attendanceItem}
              />
            ))}
          </Card.Content>
        </Card>

        {/* Events Summary */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text variant='titleMedium' style={styles.cardTitle}>
              Recent Events
            </Text>

            {reportData.events.breakdown.slice(0, 5).map((event, index) => (
              <List.Item
                key={index}
                title={event.eventName}
                description={`${event.confirmed} confirmed, ${event.waitlisted} waitlisted`}
                right={() => (
                  <Text variant='bodyMedium' style={styles.rsvpCount}>
                    {event.totalRSVPs} RSVPs
                  </Text>
                )}
                left={() => <List.Icon icon='calendar-star' />}
                style={styles.eventItem}
              />
            ))}
          </Card.Content>
        </Card>

        {/* Member Growth */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text variant='titleMedium' style={styles.cardTitle}>
              Member Growth
            </Text>

            <View style={styles.memberStats}>
              <View style={styles.memberStat}>
                <Text variant='headlineMedium' style={styles.memberStatValue}>
                  {reportData.members.totalMembers}
                </Text>
                <Text variant='bodyMedium' style={styles.memberStatLabel}>
                  Total Members
                </Text>
              </View>

              <Divider style={styles.memberStatDivider} />

              <View style={styles.memberStat}>
                <Text
                  variant='headlineMedium'
                  style={[styles.memberStatValue, { color: colors.success }]}
                >
                  +{reportData.members.newThisMonth}
                </Text>
                <Text variant='bodyMedium' style={styles.memberStatLabel}>
                  New This Month
                </Text>
              </View>

              <Divider style={styles.memberStatDivider} />

              <View style={styles.memberStat}>
                <Text
                  variant='headlineMedium'
                  style={[
                    styles.memberStatValue,
                    { color: colors.primary.main },
                  ]}
                >
                  {reportData.members.activeMembers}
                </Text>
                <Text variant='bodyMedium' style={styles.memberStatLabel}>
                  Active Members
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Footer Actions */}
        <View style={styles.footerActions}>
          <Button
            mode='outlined'
            onPress={handleRefresh}
            style={styles.actionButton}
            loading={isRefreshing}
          >
            Refresh Data
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.primary.main,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: colors.text.secondary,
    marginBottom: 8,
  },
  periodChip: {
    height: 24,
  },
  periodText: {
    fontSize: 10,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface.main,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  metricIcon: {
    margin: 0,
    marginRight: 8,
  },
  metricInfo: {
    flex: 1,
  },
  metricTitle: {
    color: colors.text.secondary,
    marginBottom: 4,
  },
  metricValue: {
    color: colors.primary.main,
    fontWeight: '600',
    marginBottom: 2,
  },
  metricSubtitle: {
    color: colors.text.secondary,
    fontSize: 11,
  },
  trendContainer: {
    alignItems: 'center',
  },
  trendIcon: {
    margin: 0,
    marginBottom: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  highlightsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
    color: colors.primary.main,
  },
  highlightCard: {
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  highlightContent: {
    paddingVertical: 12,
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  highlightIcon: {
    margin: 0,
    marginRight: 8,
  },
  highlightInfo: {
    flex: 1,
  },
  highlightTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  highlightDescription: {
    color: colors.text.secondary,
    lineHeight: 18,
  },
  highlightTrend: {
    margin: 0,
  },
  detailsCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 8,
    color: colors.primary.main,
  },
  attendanceItem: {
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  attendanceCount: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  eventItem: {
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  rsvpCount: {
    color: colors.text.secondary,
    fontWeight: '500',
  },
  memberStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  memberStat: {
    alignItems: 'center',
    flex: 1,
  },
  memberStatValue: {
    fontWeight: '600',
    marginBottom: 4,
  },
  memberStatLabel: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  memberStatDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },
  footerActions: {
    marginTop: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  actionButton: {
    minWidth: 140,
  },
});

export default ReportsScreen;
