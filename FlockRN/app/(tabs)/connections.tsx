import { useState } from 'react';
import { StyleSheet, TextInput, FlatList } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import useAuth from '@/hooks/useAuth';
import Button from '@/components/Button';
import { friendsService } from '@/services/friends/friendsService';
import { Tabs } from '@/components/Tab';
import { FriendRequest, UserProfileResponse } from '@/types/firebase';

export default function ConnectionsScreen() {
  const { user, userProfile } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfileResponse[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [selectedTab, setSelectedTab] = useState<'add' | 'requests'>('add');

  const handleSearchForUser = async () => {
    if (!searchText.trim()) return;
    const results = await friendsService.searchUsers(searchText);
    setSearchResults(results);
  };

  const handleSendFriendRequest = async (receiver: UserProfileResponse) => {
    const res = await friendsService.sendFriendRequest(userProfile!, receiver);
    if (res.success) {
      setSearchResults((prev) => prev.filter((u) => u.id !== receiver.id));
    }
  };

  const handleFetchPendingRequests = async () => {
    const requests = await friendsService.getPendingFriendRequests(
      userProfile!.id,
    );
    setPendingRequests(requests);
  };

  const handleFetchSentRequests = async () => {
    const sent = await friendsService.getSentFriendRequests(userProfile!.id);
    setSentRequests(sent);
  };

  const handleAcceptFriendRequest = async (requesterUserId: string) => {
    const res = await friendsService.acceptFriendRequest(
      user!.uid,
      requesterUserId,
    );
    if (res.success) {
      setPendingRequests((prev) =>
        prev.filter((r) => r.userId !== requesterUserId),
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Connections</ThemedText>
      <Tabs
        tabs={['Add Friend', 'Friend Requests']}
        selectedIndex={selectedTab === 'add' ? 0 : 1}
        onChange={(index) => setSelectedTab(index === 0 ? 'add' : 'requests')}
        indicatorColor="#1976d2"
        textColor="#000"
      />

      {selectedTab === 'add' ? (
        <ThemedView style={styles.container}>
          <TextInput
            style={styles.input}
            placeholder="Search for a user..."
            value={searchText}
            onChangeText={setSearchText}
          />
          <Button label="Search" onPress={handleSearchForUser} />
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ThemedView style={styles.userCard}>
                <ThemedText>{item.displayName}</ThemedText>
                <Button
                  label="Add"
                  size="xs"
                  onPress={() => handleSendFriendRequest(item)}
                />
              </ThemedView>
            )}
          />
          <ThemedView>
            <ThemedText type="title">Sent Requests</ThemedText>
            <Button
              label="Refresh Requests"
              onPress={handleFetchSentRequests}
            />
            <FlatList
              data={sentRequests}
              keyExtractor={(item) => item.userId}
              renderItem={({ item }) => (
                <ThemedView style={styles.userCard}>
                  <ThemedText>
                    {item.displayName} {item.status}
                  </ThemedText>
                </ThemedView>
              )}
            />
          </ThemedView>
        </ThemedView>
      ) : (
        <ThemedView style={styles.container}>
          <Button
            label="Refresh Requests"
            onPress={handleFetchPendingRequests}
          />
          <FlatList
            data={pendingRequests}
            keyExtractor={(item) => item.userId}
            renderItem={({ item }) => (
              <ThemedView style={styles.userCard}>
                <ThemedText>{item.displayName} sent you a request</ThemedText>
                <Button
                  label="Accept"
                  onPress={() => handleAcceptFriendRequest(item.userId)}
                />
                {/* <Button
                  label="Decline"
                  onPress={() =>
                    friendsService.declineFriendRequest(user!.uid, item.id)
                  }
                /> */}
              </ThemedView>
            )}
          />
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  userCard: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
});
