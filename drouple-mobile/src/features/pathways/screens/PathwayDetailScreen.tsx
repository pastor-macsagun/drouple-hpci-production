/**
 * Pathway Detail Screen
 * Shows pathway steps with progress tracking and completion
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  Button,
  ProgressBar,
  List,
  Chip,
  IconButton,
  Divider,
  TextInput,
  ActivityIndicator,
  Surface,
} from 'react-native-paper';
import {
  useRoute,
  type RouteProp,
  useNavigation,
} from '@react-navigation/native';

import { colors } from '@/theme/colors';
import {
  getPathwayById,
  getNextStep,
  getDifficultyColor,
  getCategoryIcon,
  type MockPathway,
  type PathwayStep,
} from '@/data/mockPathways';
import {
  initializePathwaysService,
  pathwaysService,
} from '@/services/pathwaysService';
import { queryClient } from '@/lib/api/react-query';

type PathwayDetailRouteProp = RouteProp<
  { PathwayDetail: { pathwayId: string } },
  'PathwayDetail'
>;

export const PathwayDetailScreen: React.FC = () => {
  const route = useRoute<PathwayDetailRouteProp>();
  const navigation = useNavigation();
  const { pathwayId } = route.params;

  const [isLoading, setIsLoading] = useState(false);
  const [completingStepId, setCompletingStepId] = useState<string | null>(null);
  const [stepNotes, setStepNotes] = useState<{ [stepId: string]: string }>({});
  const [pathway, setPathway] = useState<MockPathway | null>(null);

  // Initialize pathways service
  React.useEffect(() => {
    initializePathwaysService(queryClient);
  }, []);

  // Load pathway data
  React.useEffect(() => {
    const loadPathway = async () => {
      try {
        const pathwayData = await pathwaysService.getPathway(pathwayId);
        setPathway(pathwayData);
      } catch (error) {
        console.error('Failed to load pathway:', error);
        // Fallback to mock data
        setPathway(getPathwayById(pathwayId));
      }
    };

    loadPathway();
  }, [pathwayId]);

  if (!pathway) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text variant='headlineSmall'>Pathway not found</Text>
          <Button mode='contained' onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const nextStep = getNextStep(pathway);

  const handleCompleteStep = (step: PathwayStep) => {
    if (step.isCompleted) return;

    Alert.alert('Complete Step', `Mark "${step.title}" as completed?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: () => completeStep(step),
      },
    ]);
  };

  const completeStep = async (step: PathwayStep) => {
    if (!pathway) return;

    setCompletingStepId(step.id);

    try {
      const success = await pathwaysService.completeStep(
        pathway.id, 
        step.id, 
        stepNotes[step.id] || ''
      );

      if (success) {
        // Reload pathway data to show updated progress
        const updatedPathway = await pathwaysService.getPathway(pathway.id);
        if (updatedPathway) {
          setPathway(updatedPathway);
        }
        
        // Clear the notes input
        setStepNotes(prev => ({ ...prev, [step.id]: '' }));
      }
    } catch (error) {
      console.error('Failed to complete step:', error);
      Alert.alert('Error', 'Failed to complete step. Please try again.');
    } finally {
      setCompletingStepId(null);
    }
  };

  const handleEnrollNow = async () => {
    if (!pathway) return;

    setIsLoading(true);

    try {
      const success = await pathwaysService.enrollInPathway(pathway.id);
      
      if (success) {
        // Reload pathway data to show enrollment status
        const updatedPathway = await pathwaysService.getPathway(pathway.id);
        if (updatedPathway) {
          setPathway(updatedPathway);
        }
      }
    } catch (error) {
      console.error('Failed to enroll:', error);
      Alert.alert('Error', 'Failed to enroll in pathway. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepCard = (step: PathwayStep, index: number) => (
    <Card
      key={step.id}
      style={[styles.stepCard, step.isCompleted && styles.completedStepCard]}
    >
      <Card.Content>
        <View style={styles.stepHeader}>
          <View style={styles.stepNumber}>
            {step.isCompleted ? (
              <IconButton
                icon='check-circle'
                iconColor={colors.success}
                size={24}
                style={styles.stepIcon}
              />
            ) : (
              <Surface style={styles.stepNumberSurface} elevation={1}>
                <Text variant='bodySmall' style={styles.stepNumberText}>
                  {step.order}
                </Text>
              </Surface>
            )}
          </View>

          <View style={styles.stepInfo}>
            <Text
              variant='titleMedium'
              style={[
                styles.stepTitle,
                step.isCompleted && styles.completedText,
              ]}
            >
              {step.title}
            </Text>

            {step.estimatedDuration && (
              <Chip
                mode='outlined'
                compact
                style={styles.durationChip}
                textStyle={styles.durationText}
              >
                {step.estimatedDuration}
              </Chip>
            )}
          </View>
        </View>

        <Text
          variant='bodyMedium'
          style={[
            styles.stepDescription,
            step.isCompleted && styles.completedText,
          ]}
        >
          {step.description}
        </Text>

        {step.resources && step.resources.length > 0 && (
          <View style={styles.resourcesSection}>
            <Text variant='titleSmall' style={styles.resourcesTitle}>
              Resources:
            </Text>
            {step.resources.map((resource, resourceIndex) => (
              <List.Item
                key={resourceIndex}
                title={resource.title}
                description={resource.description}
                left={() => (
                  <List.Icon
                    icon={
                      resource.type === 'video'
                        ? 'play-circle'
                        : resource.type === 'document'
                          ? 'file-document'
                          : resource.type === 'book'
                            ? 'book'
                            : 'web'
                    }
                    color={colors.primary.main}
                  />
                )}
                style={styles.resourceItem}
                titleNumberOfLines={1}
                descriptionNumberOfLines={2}
              />
            ))}
          </View>
        )}

        {step.completedAt && (
          <View style={styles.completionInfo}>
            <Text variant='bodySmall' style={styles.completionDate}>
              Completed on {new Date(step.completedAt).toLocaleDateString()}
            </Text>
            {step.notes && (
              <View style={styles.notesSection}>
                <Text variant='bodySmall' style={styles.notesLabel}>
                  Notes:
                </Text>
                <Text variant='bodySmall' style={styles.notesText}>
                  {step.notes}
                </Text>
              </View>
            )}
          </View>
        )}

        {!step.isCompleted && pathway.isEnrolled && (
          <View style={styles.stepActions}>
            <TextInput
              placeholder='Add notes (optional)...'
              value={stepNotes[step.id] || ''}
              onChangeText={text =>
                setStepNotes(prev => ({ ...prev, [step.id]: text }))
              }
              multiline
              numberOfLines={2}
              style={styles.notesInput}
              mode='outlined'
              dense
            />

            <Button
              mode='contained'
              onPress={() => handleCompleteStep(step)}
              loading={completingStepId === step.id}
              disabled={completingStepId === step.id}
              style={styles.completeButton}
            >
              Mark Complete
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={colors.primary.main} />
          <Text variant='bodyMedium' style={styles.loadingText}>
            {pathway.isEnrolled
              ? 'Loading pathway...'
              : 'Enrolling in pathway...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Pathway Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.pathwayHeader}>
              <View style={styles.pathwayTitleRow}>
                <IconButton
                  icon={getCategoryIcon(pathway.category)}
                  size={24}
                  iconColor={getDifficultyColor(pathway.difficulty)}
                  style={styles.categoryIcon}
                />
                <Text variant='headlineSmall' style={styles.pathwayTitle}>
                  {pathway.title}
                </Text>
              </View>

              <View style={styles.pathwayMeta}>
                <Chip
                  mode='flat'
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

                <Chip mode='outlined' style={styles.durationChip}>
                  {pathway.estimatedDuration}
                </Chip>
              </View>
            </View>

            <Text variant='bodyMedium' style={styles.pathwayDescription}>
              {pathway.description}
            </Text>

            {pathway.isEnrolled ? (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text variant='titleMedium' style={styles.progressTitle}>
                    Your Progress
                  </Text>
                  <Text variant='bodyLarge' style={styles.progressPercentage}>
                    {Math.round(pathway.progress)}%
                  </Text>
                </View>

                <ProgressBar
                  progress={pathway.progress / 100}
                  color={colors.primary.main}
                  style={styles.progressBar}
                />

                <Text variant='bodySmall' style={styles.progressText}>
                  {pathway.completedSteps} of {pathway.totalSteps} steps
                  completed
                </Text>

                {nextStep && (
                  <View style={styles.nextStepInfo}>
                    <Text variant='bodySmall' style={styles.nextStepLabel}>
                      Next step:
                    </Text>
                    <Text variant='bodyMedium' style={styles.nextStepTitle}>
                      {nextStep.title}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.enrollSection}>
                <Text variant='bodyMedium' style={styles.enrollText}>
                  Ready to begin your discipleship journey?
                </Text>
                <Button
                  mode='contained'
                  onPress={handleEnrollNow}
                  style={styles.enrollButton}
                >
                  Enroll Now
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Prerequisites */}
        {pathway.prerequisites && pathway.prerequisites.length > 0 && (
          <Card style={styles.prerequisitesCard}>
            <Card.Content>
              <Text variant='titleMedium' style={styles.sectionTitle}>
                Prerequisites
              </Text>
              {pathway.prerequisites.map((prerequisite, index) => (
                <List.Item
                  key={index}
                  title={prerequisite}
                  left={() => (
                    <List.Icon icon='school' color={colors.primary.main} />
                  )}
                  style={styles.prerequisiteItem}
                />
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Pathway Steps */}
        <View style={styles.stepsSection}>
          <Text variant='headlineSmall' style={styles.sectionTitle}>
            Pathway Steps
          </Text>

          {pathway.steps
            .sort((a, b) => a.order - b.order)
            .map((step, index) => renderStepCard(step, index))}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 32,
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
  headerCard: {
    marginBottom: 16,
  },
  pathwayHeader: {
    marginBottom: 12,
  },
  pathwayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    margin: 0,
    marginRight: 8,
  },
  pathwayTitle: {
    flex: 1,
    fontWeight: '600',
    color: colors.primary.main,
  },
  pathwayMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
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
  pathwayDescription: {
    lineHeight: 22,
    marginBottom: 16,
    color: colors.text.secondary,
  },
  progressSection: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontWeight: '600',
  },
  progressPercentage: {
    color: colors.primary.main,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    color: colors.text.secondary,
  },
  nextStepInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.primary.main + '10',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.main,
  },
  nextStepLabel: {
    color: colors.primary.main,
    fontWeight: '600',
    marginBottom: 2,
  },
  nextStepTitle: {
    color: colors.text.primary,
    fontWeight: '500',
  },
  enrollSection: {
    alignItems: 'center',
    gap: 12,
  },
  enrollText: {
    textAlign: 'center',
    color: colors.text.secondary,
  },
  enrollButton: {
    minWidth: 140,
  },
  prerequisitesCard: {
    marginBottom: 16,
  },
  prerequisiteItem: {
    paddingLeft: 0,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
    color: colors.primary.main,
  },
  stepsSection: {
    gap: 12,
  },
  stepCard: {
    marginBottom: 0,
  },
  completedStepCard: {
    opacity: 0.7,
    backgroundColor: colors.surface.variant,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    marginRight: 12,
  },
  stepIcon: {
    margin: 0,
  },
  stepNumberSurface: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: 'white',
    fontWeight: 'bold',
  },
  stepInfo: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  completedText: {
    color: colors.text.secondary,
  },
  stepDescription: {
    lineHeight: 20,
    marginBottom: 12,
    color: colors.text.secondary,
  },
  resourcesSection: {
    marginBottom: 12,
  },
  resourcesTitle: {
    fontWeight: '600',
    marginBottom: 8,
    color: colors.primary.main,
  },
  resourceItem: {
    paddingLeft: 0,
    paddingVertical: 4,
  },
  completionInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.success + '10',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  completionDate: {
    color: colors.success,
    fontWeight: '600',
    marginBottom: 4,
  },
  notesSection: {
    marginTop: 4,
  },
  notesLabel: {
    fontWeight: '600',
    marginBottom: 2,
    color: colors.text.primary,
  },
  notesText: {
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  stepActions: {
    gap: 12,
    marginTop: 8,
  },
  notesInput: {
    backgroundColor: colors.background,
  },
  completeButton: {
    alignSelf: 'flex-end',
    minWidth: 120,
  },
  durationText: {
    fontSize: 10,
  },
});

export default PathwayDetailScreen;
