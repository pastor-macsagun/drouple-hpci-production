/**
 * Directory Screen - Member search with privacy respect
 * Search with debounce, profile sheets, call/text intents
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, FlatList, Pressable, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDebounce } from '../../hooks/useDebounce';
import { membersRepo } from '../../data/repos/members';
import { type DbMember } from '../../data/db';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingCard } from '../../components/ui/LoadingCard';

export default function DirectoryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<DbMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<DbMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    handleSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery, members]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const allMembers = await membersRepo.getAll({ limit: 100 });
      setMembers(allMembers);
      setFilteredMembers(allMembers);
    } catch (error) {
      console.error('Failed to load members:', error);
      Alert.alert('Error', 'Failed to load directory');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setFilteredMembers(members);
      setSearching(false);
      return;
    }

    setSearching(true);
    
    try {
      // Use repository search for optimized results
      const results = await membersRepo.search(query.trim(), 50);
      setFilteredMembers(results);
    } catch (error) {
      console.error('Search failed:', error);
      // Fallback to local filtering
      const filtered = members.filter(member =>
        member.name.toLowerCase().includes(query.toLowerCase()) ||
        member.email.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredMembers(filtered);
    } finally {
      setSearching(false);
    }
  };

  const handleCall = (member: DbMember) => {
    if (!member.phone) {
      Alert.alert('No Phone Number', 'Phone number not available for this member');
      return;
    }

    Alert.alert(
      'Call Member',
      `Call ${member.name} at ${member.phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            const phoneUrl = `tel:${member.phone}`;
            Linking.openURL(phoneUrl).catch(() => {
              Alert.alert('Error', 'Unable to open phone app');
            });
          },
        },
      ]
    );
  };

  const handleText = (member: DbMember) => {
    if (!member.phone) {
      Alert.alert('No Phone Number', 'Phone number not available for this member');
      return;
    }

    const smsUrl = `sms:${member.phone}`;
    Linking.openURL(smsUrl).catch(() => {
      Alert.alert('Error', 'Unable to open messaging app');
    });
  };

  const handleEmail = (member: DbMember) => {
    const emailUrl = `mailto:${member.email}?subject=Hello from church`;
    Linking.openURL(emailUrl).catch(() => {
      Alert.alert('Error', 'Unable to open email app');
    });
  };

  const renderMember = ({ item: member }: { item: DbMember }) => (
    <View className="mx-4 mb-3 p-4 bg-white rounded-lg shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">
            {member.name}
          </Text>
          <Text className="text-gray-600 mt-1">
            {member.role} • {member.church}
          </Text>
          {member.email && (
            <Text className="text-gray-500 text-sm mt-1">
              {member.email}
            </Text>
          )}
        </View>
        
        <View className="flex-row space-x-2">
          {member.phone && (
            <>
              <Pressable
                onPress={() => handleCall(member)}
                className="w-10 h-10 bg-green-100 rounded-full items-center justify-center active:bg-green-200"
                accessibilityLabel={`Call ${member.name}`}
                accessibilityHint="Double tap to call this member"
              >
                <Text className="text-lg">📞</Text>
              </Pressable>
              
              <Pressable
                onPress={() => handleText(member)}
                className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center active:bg-blue-200"
                accessibilityLabel={`Text ${member.name}`}
                accessibilityHint="Double tap to send a text message"
              >
                <Text className="text-lg">💬</Text>
              </Pressable>
            </>
          )}
          
          <Pressable
            onPress={() => handleEmail(member)}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center active:bg-gray-200"
            accessibilityLabel={`Email ${member.name}`}
            accessibilityHint="Double tap to send an email"
          >
            <Text className="text-lg">✉️</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="p-4">
          <LoadingCard height={60} className="mb-4" />
          <LoadingCard height={80} className="mb-3" />
          <LoadingCard height={80} className="mb-3" />
          <LoadingCard height={80} className="mb-3" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 py-6 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">
          Church Directory
        </Text>
        <Text className="text-gray-600 mt-1">
          Connect with your church family
        </Text>
      </View>

      {/* Search Bar */}
      <View className="px-4 py-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-3">
          <Text className="text-gray-500 mr-2">🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search members by name or email..."
            className="flex-1 text-gray-900"
            placeholderTextColor="#9CA3AF"
            accessibilityLabel="Search members"
            accessibilityHint="Type to search for church members"
          />
          {searching && (
            <Text className="text-gray-500 ml-2">...</Text>
          )}
        </View>
      </View>

      {/* Results */}
      {filteredMembers.length === 0 ? (
        <EmptyState
          icon={searchQuery ? "🔍" : "👥"}
          title={searchQuery ? "No Members Found" : "No Members"}
          message={
            searchQuery 
              ? `No members found matching "${searchQuery}". Try a different search term.`
              : "The directory appears to be empty. Try refreshing or contact your administrator."
          }
          actionText={searchQuery ? "Clear Search" : "Refresh"}
          onAction={searchQuery ? () => setSearchQuery('') : loadMembers}
        />
      ) : (
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id}
          renderItem={renderMember}
          className="flex-1"
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Results Count */}
      {filteredMembers.length > 0 && (
        <View className="px-4 py-2 bg-gray-100 border-t border-gray-200">
          <Text className="text-gray-600 text-center text-sm">
            {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}