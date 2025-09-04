/**
 * Feedback Sheet Component
 * In-app feedback collection with PII redaction and triage routing
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Modal, Portal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

interface FeedbackSheetProps {
  visible: boolean;
  onDismiss: () => void;
  initialCategory?: FeedbackCategory;
  contextData?: {
    screen?: string;
    feature?: string;
    userAction?: string;
  };
}

type FeedbackCategory =
  | 'bug'
  | 'feature_request'
  | 'usability'
  | 'performance'
  | 'content'
  | 'other';

interface FeedbackSubmission {
  category: FeedbackCategory;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reproductionSteps?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  contextData?: {
    screen?: string;
    feature?: string;
    userAction?: string;
    deviceInfo?: object;
    appVersion?: string;
    timestamp?: string;
  };
}

const categoryOptions = [
  { key: 'bug', label: 'Bug Report', icon: 'bug-outline', color: '#e74c3c' },
  {
    key: 'feature_request',
    label: 'Feature Request',
    icon: 'lightbulb-outline',
    color: '#f39c12',
  },
  {
    key: 'usability',
    label: 'Usability Issue',
    icon: 'person-outline',
    color: '#9b59b6',
  },
  {
    key: 'performance',
    label: 'Performance',
    icon: 'speedometer-outline',
    color: '#e67e22',
  },
  {
    key: 'content',
    label: 'Content/Data Issue',
    icon: 'document-text-outline',
    color: '#3498db',
  },
  {
    key: 'other',
    label: 'Other',
    icon: 'help-circle-outline',
    color: '#95a5a6',
  },
];

const severityOptions = [
  { key: 'low', label: 'Low - Minor issue', color: '#27ae60' },
  { key: 'medium', label: 'Medium - Affects functionality', color: '#f39c12' },
  { key: 'high', label: 'High - Blocks important tasks', color: '#e67e22' },
  { key: 'critical', label: 'Critical - App unusable', color: '#e74c3c' },
];

export const FeedbackSheet: React.FC<FeedbackSheetProps> = ({
  visible,
  onDismiss,
  initialCategory = 'other',
  contextData,
}) => {
  const { user } = useAuthStore();
  const [category, setCategory] = useState<FeedbackCategory>(initialCategory);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<
    'low' | 'medium' | 'high' | 'critical'
  >('medium');
  const [reproductionSteps, setReproductionSteps] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert(
        'Missing Information',
        'Please provide both a title and description for your feedback.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackData: FeedbackSubmission = {
        category,
        title: title.trim(),
        description: description.trim(),
        severity,
        reproductionSteps: reproductionSteps.trim() || undefined,
        expectedBehavior: expectedBehavior.trim() || undefined,
        actualBehavior: actualBehavior.trim() || undefined,
        contextData: {
          ...contextData,
          deviceInfo: await getDeviceInfo(),
          appVersion: await getAppVersion(),
          timestamp: new Date().toISOString(),
        },
      };

      const success = await submitFeedback(feedbackData);

      if (success) {
        Alert.alert(
          'Thank You!',
          'Your feedback has been submitted and will be reviewed by our team. We appreciate your input!',
          [{ text: 'OK', onPress: onDismiss }]
        );
        resetForm();
      } else {
        Alert.alert(
          'Submission Failed',
          'Unable to submit your feedback right now. Please try again later or contact support directly.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[FeedbackSheet] Submission error:', error);
      Alert.alert(
        'Submission Failed',
        'An error occurred while submitting your feedback. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitFeedback = async (
    feedbackData: FeedbackSubmission
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/mobile/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.accessToken}`,
        },
        body: JSON.stringify(feedbackData),
      });

      return response.ok;
    } catch (error) {
      console.error('[FeedbackSheet] API error:', error);
      return false;
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSeverity('medium');
    setReproductionSteps('');
    setExpectedBehavior('');
    setActualBehavior('');
    setCategory('other');
  };

  const getDeviceInfo = async (): Promise<object> => {
    try {
      const Device = await import('expo-device');
      return {
        brand: Device.default.brand,
        modelName: Device.default.modelName,
        osName: Device.default.osName,
        osVersion: Device.default.osVersion,
      };
    } catch (error) {
      return {};
    }
  };

  const getAppVersion = async (): Promise<string> => {
    try {
      const Constants = await import('expo-constants');
      return Constants.default.expoConfig?.version || '1.0.0';
    } catch (error) {
      return '1.0.0';
    }
  };

  const selectedCategoryOption = categoryOptions.find(
    opt => opt.key === category
  );
  const selectedSeverityOption = severityOptions.find(
    opt => opt.key === severity
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={{
          backgroundColor: 'white',
          margin: 20,
          borderRadius: 12,
          maxHeight: '90%',
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '600',
                  color: '#1e7ce8',
                }}
              >
                Send Feedback
              </Text>
              <TouchableOpacity
                onPress={onDismiss}
                style={{
                  padding: 8,
                  borderRadius: 20,
                  backgroundColor: '#f5f5f5',
                }}
              >
                <Ionicons name='close' size={20} color='#666' />
              </TouchableOpacity>
            </View>

            {/* Category Selection */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  marginBottom: 12,
                  color: '#333',
                }}
              >
                Category *
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                {categoryOptions.map(option => (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => setCategory(option.key as FeedbackCategory)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor:
                        category === option.key ? option.color : '#e0e0e0',
                      backgroundColor:
                        category === option.key ? `${option.color}10` : 'white',
                    }}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={16}
                      color={category === option.key ? option.color : '#666'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        color: category === option.key ? option.color : '#666',
                        fontWeight: category === option.key ? '600' : 'normal',
                      }}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Severity (for bugs) */}
            {category === 'bug' && (
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    marginBottom: 12,
                    color: '#333',
                  }}
                >
                  Severity *
                </Text>
                <View style={{ gap: 8 }}>
                  {severityOptions.map(option => (
                    <TouchableOpacity
                      key={option.key}
                      onPress={() => setSeverity(option.key as any)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 12,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor:
                          severity === option.key ? option.color : '#e0e0e0',
                        backgroundColor:
                          severity === option.key
                            ? `${option.color}10`
                            : 'white',
                      }}
                    >
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: option.color,
                          marginRight: 10,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          color:
                            severity === option.key ? option.color : '#666',
                          fontWeight:
                            severity === option.key ? '600' : 'normal',
                        }}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Title */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  marginBottom: 8,
                  color: '#333',
                }}
              >
                Title *
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder='Brief summary of your feedback'
                style={{
                  borderWidth: 1,
                  borderColor: '#e0e0e0',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  backgroundColor: 'white',
                }}
                maxLength={100}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: '#999',
                  textAlign: 'right',
                  marginTop: 4,
                }}
              >
                {title.length}/100
              </Text>
            </View>

            {/* Description */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  marginBottom: 8,
                  color: '#333',
                }}
              >
                Description *
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder='Provide detailed information about your feedback'
                multiline
                numberOfLines={4}
                style={{
                  borderWidth: 1,
                  borderColor: '#e0e0e0',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  backgroundColor: 'white',
                  height: 100,
                  textAlignVertical: 'top',
                }}
                maxLength={1000}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: '#999',
                  textAlign: 'right',
                  marginTop: 4,
                }}
              >
                {description.length}/1000
              </Text>
            </View>

            {/* Bug-specific fields */}
            {category === 'bug' && (
              <>
                {/* Reproduction Steps */}
                <View style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      marginBottom: 8,
                      color: '#333',
                    }}
                  >
                    Steps to Reproduce
                  </Text>
                  <TextInput
                    value={reproductionSteps}
                    onChangeText={setReproductionSteps}
                    placeholder='1. First step&#10;2. Second step&#10;3. Third step'
                    multiline
                    numberOfLines={3}
                    style={{
                      borderWidth: 1,
                      borderColor: '#e0e0e0',
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 16,
                      backgroundColor: 'white',
                      height: 80,
                      textAlignVertical: 'top',
                    }}
                  />
                </View>

                {/* Expected Behavior */}
                <View style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      marginBottom: 8,
                      color: '#333',
                    }}
                  >
                    Expected Behavior
                  </Text>
                  <TextInput
                    value={expectedBehavior}
                    onChangeText={setExpectedBehavior}
                    placeholder='What did you expect to happen?'
                    multiline
                    numberOfLines={2}
                    style={{
                      borderWidth: 1,
                      borderColor: '#e0e0e0',
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 16,
                      backgroundColor: 'white',
                      height: 60,
                      textAlignVertical: 'top',
                    }}
                  />
                </View>

                {/* Actual Behavior */}
                <View style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      marginBottom: 8,
                      color: '#333',
                    }}
                  >
                    Actual Behavior
                  </Text>
                  <TextInput
                    value={actualBehavior}
                    onChangeText={setActualBehavior}
                    placeholder='What actually happened?'
                    multiline
                    numberOfLines={2}
                    style={{
                      borderWidth: 1,
                      borderColor: '#e0e0e0',
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 16,
                      backgroundColor: 'white',
                      height: 60,
                      textAlignVertical: 'top',
                    }}
                  />
                </View>
              </>
            )}

            {/* Privacy Notice */}
            <View
              style={{
                backgroundColor: '#f8f9fa',
                padding: 16,
                borderRadius: 8,
                marginBottom: 24,
                borderLeftWidth: 4,
                borderLeftColor: '#1e7ce8',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: '#555',
                  lineHeight: 20,
                }}
              >
                <Text style={{ fontWeight: '600' }}>Privacy Notice:</Text> Your
                feedback will be reviewed by our team. Personal information will
                be automatically redacted for privacy protection. Technical
                details like device information and app version are included to
                help us resolve issues.
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting || !title.trim() || !description.trim()}
              style={{
                backgroundColor:
                  isSubmitting || !title.trim() || !description.trim()
                    ? '#ccc'
                    : '#1e7ce8',
                paddingVertical: 16,
                borderRadius: 8,
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '600',
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Send Feedback'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
};
