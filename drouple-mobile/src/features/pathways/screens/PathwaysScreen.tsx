/**
 * Pathways Screen
 * Discipleship pathways with progress tracking and enrollment
 */

import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  Searchbar,
  Chip,
  Button,
  ProgressBar,
  IconButton,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

import { colors } from '@/theme/colors';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  getEnrolledPathways,
  getAvailablePathways,
  getPathwaysByCategory,
  searchPathways,
  getDifficultyColor,
  getCategoryIcon,
  formatEstimatedDuration,
  canEnrollInPathway,
  type MockPathway,
} from '@/data/mockPathways';
import {
  initializePathwaysService,
  pathwaysService,
} from '@/services/pathwaysService';
import { queryClient } from '@/lib/api/react-query';

type FilterType = 'enrolled' | 'available' | 'completed' | 'category';
type CategoryType = 'spiritual_growth' | 'ministry' | 'leadership' | 'service';

export const PathwaysScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('enrolled');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [allPathways, setAllPathways] = useState<MockPathway[]>([]);

  // Mock completed pathways (in real app, this would come from user data)
  const completedPathwayIds = ['new-believer-foundation'];

  // Initialize pathways service
  React.useEffect(() => {
    initializePathwaysService(queryClient);
  }, []);

  // Load pathways data
  React.useEffect(() => {
    const loadPathways = async () => {
      try {
        setIsLoading(true);
        const pathwaysData = await pathwaysService.getUserPathways();
        setAllPathways(pathwaysData);
      } catch (error) {
        console.error('Failed to load pathways:', error);
        // Fallback to mock data
        setAllPathways(searchPathways(searchQuery));
      } finally {
        setIsLoading(false);
      }
    };

    loadPathways();
  }, []);

  // Filter pathways based on search
  const searchedPathways = useMemo(() => {
    if (!searchQuery.trim()) return allPathways;
    
    return allPathways.filter(pathway =>
      pathway.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pathway.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pathway.tags.some(tag =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [allPathways, searchQuery]);

  const filteredPathways = useMemo(() => {
    let pathways = searchedPathways;

    switch (activeFilter) {
      case 'enrolled':
        pathways = pathways.filter(pathway => pathway.isEnrolled);
        break;
      case 'available':
        pathways = pathways.filter(pathway => 
          !pathway.isEnrolled && canEnrollInPathway(pathway, completedPathwayIds)
        );
        break;
      case 'completed':
        pathways = pathways.filter(pathway => pathway.completedAt);
        break;
      case 'category':
        if (selectedCategory) {
          pathways = pathways.filter(pathway => pathway.category === selectedCategory);
        }
        break;
    }

    return pathways.sort((a, b) => {
      // Sort enrolled first, then by progress, then alphabetically
      if (a.isEnrolled !== b.isEnrolled) {
        return a.isEnrolled ? -1 : 1;
      }
      if (a.isEnrolled && b.isEnrolled) {
        return b.progress - a.progress;
      }
      return a.title.localeCompare(b.title);
    });
  }, [
    searchedPathways,
    activeFilter,
    selectedCategory,
    completedPathwayIds,
  ]);

  const handlePathwayPress = (pathway: MockPathway) => {
    console.log('Navigate to pathway detail:', pathway.id);
    // In a real app, navigate to pathway detail screen
  };

  const handleEnroll = async (pathway: MockPathway) => {
    try {
      const success = await pathwaysService.enrollInPathway(pathway.id);
      
      if (success) {
        // Reload pathways data to show updated enrollment status
        const updatedPathways = await pathwaysService.getUserPathways();
        setAllPathways(updatedPathways);
      }
    } catch (error) {
      console.error('Failed to enroll in pathway:', error);
    }
  };

  const renderPathwayCard = ({ item: pathway }: { item: MockPathway }) => (
    <Card
      style={styles.pathwayCard}
      onPress={() => handlePathwayPress(pathway)}
    >
      <Card.Content>
        <View style={styles.pathwayHeader}>
          <View style={styles.pathwayInfo}>
            <View style={styles.pathwayTitleRow}>
              <IconButton
                icon={getCategoryIcon(pathway.category)}
                size={20}
                iconColor={getDifficultyColor(pathway.difficulty)}
                style={styles.categoryIcon}
              />
              <Text variant='titleMedium' style={styles.pathwayTitle}>
                {pathway.title}
              </Text>
            </View>

            <View style={styles.pathwayMeta}>
              <Chip
                mode='flat'
                compact
                style={[
                  styles.difficultyChip,
                  {
                    backgroundColor:
                      getDifficultyColor(pathway.difficulty) + '20',
                  },
                ]}
                textStyle={[
                  styles.difficultyText,
                  { color: getDifficultyColor(pathway.difficulty) },
                ]}
              >
                {pathway.difficulty}
              </Chip>

              <Chip mode='outlined' compact style={styles.durationChip}>
                {formatEstimatedDuration(pathway.estimatedDuration)}
              </Chip>
            </View>
          </View>

          {pathway.isEnrolled && (
            <View style={styles.progressContainer}>
              <Text variant='bodySmall' style={styles.progressText}>
                {Math.round(pathway.progress)}%
              </Text>
              <ProgressBar
                progress={pathway.progress / 100}
                color={colors.primary.main}
                style={styles.progressBar}
              />
              <Text variant='bodySmall' style={styles.stepsText}>
                {pathway.completedSteps}/{pathway.totalSteps} steps
              </Text>
            </View>
          )}
        </View>

        <Text
          variant='bodyMedium'
          numberOfLines={2}
          style={styles.pathwayDescription}
        >
          {pathway.description}
        </Text>

        {pathway.prerequisites && pathway.prerequisites.length > 0 && (
          <View style={styles.prerequisites}>
            <Text variant='bodySmall' style={styles.prerequisitesLabel}>
              Prerequisites:
            </Text>
            <Text variant='bodySmall' style={styles.prerequisitesText}>
              {pathway.prerequisites.join(', ')}
            </Text>
          </View>
        )}

        <View style={styles.pathwayTags}>
          {pathway.tags.slice(0, 3).map(tag => (
            <Chip
              key={tag}
              mode='outlined'
              compact
              style={styles.tagChip}
              textStyle={styles.tagText}
            >
              {tag}
            </Chip>
          ))}
          {pathway.tags.length > 3 && (
            <Text variant='bodySmall' style={styles.moreTags}>
              +{pathway.tags.length - 3}
            </Text>
          )}
        </View>

        <View style={styles.pathwayActions}>
          {pathway.isEnrolled ? (
            <Button
              mode='contained'
              onPress={() => handlePathwayPress(pathway)}
              style={styles.actionButton}
            >
              Continue Learning
            </Button>
          ) : canEnrollInPathway(pathway, completedPathwayIds) ? (
            <Button
              mode='outlined'
              onPress={() => handleEnroll(pathway)}
              style={styles.actionButton}
            >
              Enroll Now
            </Button>
          ) : (
            <Button mode='contained' disabled style={styles.actionButton}>
              Prerequisites Required
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const renderFilterChip = (
    filter: FilterType,
    label: string,
    count?: number
  ) => (
    <Chip
      key={filter}
      mode={activeFilter === filter ? 'flat' : 'outlined'}
      selected={activeFilter === filter}
      onPress={() => {
        setActiveFilter(filter);
        if (filter !== 'category') {
          setSelectedCategory(null);
        }
      }}
      style={[
        styles.filterChip,
        activeFilter === filter && styles.activeFilterChip,
      ]}
    >
      {label} {count !== undefined && `(${count})`}
    </Chip>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={colors.primary.main} />
          <Text variant='bodyMedium' style={styles.loadingText}>
            Loading pathways...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant='headlineMedium' style={styles.headerTitle}>
          Discipleship Pathways
        </Text>
        <Text variant='bodyMedium' style={styles.headerSubtitle}>
          Grow in your faith through structured learning paths
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder='Search pathways...'
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor={colors.primary.main}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {renderFilterChip(
          'enrolled',
          'My Pathways',
          allPathways.filter(p => p.isEnrolled).length
        )}
        {renderFilterChip(
          'available',
          'Available',
          allPathways.filter(p => !p.isEnrolled && canEnrollInPathway(p, completedPathwayIds)).length
        )}
        {renderFilterChip(
          'completed', 
          'Completed', 
          allPathways.filter(p => p.completedAt).length
        )}
        {renderFilterChip('category', 'By Category')}
      </ScrollView>

      {activeFilter === 'category' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categorySelector}
          contentContainerStyle={styles.categoryContent}
        >
          <Chip
            mode={selectedCategory === null ? 'flat' : 'outlined'}
            selected={selectedCategory === null}
            onPress={() => setSelectedCategory(null)}
            style={styles.categoryChip}
          >
            All Categories
          </Chip>

          {(
            [
              'spiritual_growth',
              'ministry',
              'leadership',
              'service',
            ] as CategoryType[]
          ).map(category => (
            <Chip
              key={category}
              mode={selectedCategory === category ? 'flat' : 'outlined'}
              selected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
              style={styles.categoryChip}
              icon={getCategoryIcon(category)}
            >
              {category
                .replace('_', ' ')
                .replace(/\b\w/g, l => l.toUpperCase())}
            </Chip>
          ))}
        </ScrollView>
      )}

      <View style={styles.content}>
        {filteredPathways.length === 0 ? (
          <EmptyState
            icon='map-marker-path'
            title='No pathways found'
            message={
              searchQuery
                ? `No pathways match "${searchQuery}"`
                : activeFilter === 'enrolled'
                  ? "You haven't enrolled in any pathways yet"
                  : activeFilter === 'available'
                    ? 'No pathways available for enrollment'
                    : 'No pathways in this category'
            }
            action={
              activeFilter === 'enrolled' ? (
                <Button
                  mode='contained'
                  onPress={() => setActiveFilter('available')}
                >
                  Browse Available Pathways
                </Button>
              ) : undefined
            }
          />
        ) : (
          <FlatList
            data={filteredPathways}
            renderItem={renderPathwayCard}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
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
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    color: colors.primary.main,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: colors.text.secondary,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: colors.surface.variant,
  },
  filtersContainer: {
    paddingBottom: 12,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: colors.primary.main + '20',
  },
  categorySelector: {
    paddingBottom: 12,
  },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    marginRight: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  separator: {
    height: 12,
  },
  pathwayCard: {
    marginBottom: 0,
  },
  pathwayHeader: {
    marginBottom: 12,
  },
  pathwayInfo: {
    marginBottom: 8,
  },
  pathwayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    margin: 0,
    marginRight: 4,
  },
  pathwayTitle: {
    flex: 1,
    fontWeight: '600',
  },
  pathwayMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficultyChip: {
    height: 24,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  durationChip: {
    height: 24,
  },
  progressContainer: {
    alignItems: 'flex-end',
    gap: 2,
  },
  progressText: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  progressBar: {
    width: 80,
    height: 4,
  },
  stepsText: {
    color: colors.text.secondary,
    fontSize: 10,
  },
  pathwayDescription: {
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  prerequisites: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: colors.warning + '10',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  prerequisitesLabel: {
    color: colors.warning,
    fontWeight: '600',
    marginBottom: 2,
  },
  prerequisitesText: {
    color: colors.text.secondary,
  },
  pathwayTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  tagChip: {
    height: 20,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
  },
  moreTags: {
    color: colors.text.secondary,
    fontSize: 10,
    fontStyle: 'italic',
  },
  pathwayActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    minWidth: 140,
  },
});

export default PathwaysScreen;
