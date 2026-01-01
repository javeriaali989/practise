import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { authService } from '../../services/authService';
import { bookingService } from '../../services/bookingService';
import { logger } from '../../utils/logger';

const TAG = 'ProviderBookingsScreen';

// Status configurations for better UX
const STATUS_CONFIG = {
  confirmed: {
    color: '#2196F3',
    bgColor: '#E3F2FD',
    icon: '📋',
    label: 'Confirmed',
  },
  'in-progress': {
    color: '#FF9800',
    bgColor: '#FFF3E0',
    icon: '⚙️',
    label: 'In Progress',
  },
  'completed': {
    color: '#4CAF50',
    bgColor: '#F0FDF4',
    icon: '✓',
    label: 'Completed',
  },
  'pending-completion': {
    color: '#9C27B0',
    bgColor: '#F3E5F5',
    icon: '⏳',
    label: 'Pending Completion',
  },
};

export default function ProviderBookingsScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const provider = await authService.getCurrentUser();
      if (!provider) return;

      const data = await bookingService.getByProviderId(provider.id);
      setBookings(data || []);
      logger.info(TAG, `Loaded ${data.length} bookings`);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const handleStartService = async (bookingId: string) => {
    Alert.alert(
      'Start Service',
      'Are you ready to start this service?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          style: 'default',
          onPress: async () => {
            try {
              await bookingService.startService(bookingId);
              Alert.alert('Success', 'Service started successfully! ✅');
              loadBookings();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to start');
            }
          },
        },
      ]
    );
  };

  const handleCompleteService = async (bookingId: string) => {
    Alert.alert(
      'Complete Service',
      'Mark this service as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'default',
          onPress: async () => {
            try {
              await bookingService.providerCompleteService(bookingId);
              Alert.alert('Success', 'Service marked as completed! ✅');
              loadBookings();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to complete');
            }
          },
        },
      ]
    );
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
      color: '#999',
      bgColor: '#F5F5F5',
      icon: '•',
      label: status,
    };
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>My Bookings</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Bookings</Text>
        <View style={{ width: 50 }} />
      </View>

      {bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📂</Text>
          <Text style={styles.emptyText}>No bookings yet</Text>
          <Text style={styles.emptySubtext}>
            Your accepted jobs will appear here
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('AvailableRequests')}
          >
            <Text style={styles.browseButtonText}>Browse Requests</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4CAF50']}
            />
          }
          renderItem={({ item }) => {
            const statusConfig = getStatusConfig(item.status);
            return (
              <View style={styles.bookingCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.clientInfo}>
                    <View style={styles.clientAvatar}>
                      <Text style={styles.clientAvatarText}>
                        {item.userName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.clientDetails}>
                      <Text style={styles.clientName}>{item.userName}</Text>
                      {item.categoryName && (
                        <Text style={styles.serviceType}>{item.categoryName}</Text>
                      )}
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusConfig.bgColor },
                    ]}
                  >
                    <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
                    <Text
                      style={[
                        styles.statusText,
                        { color: statusConfig.color },
                      ]}
                    >
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.priceContainer}>
                  <Text style={styles.priceLabel}>Service Amount</Text>
                  <Text style={styles.priceValue}>Rs. {item.agreedPrice}</Text>
                </View>

                {item.description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionLabel}>Details:</Text>
                    <Text style={styles.descriptionText} numberOfLines={2}>
                      {item.description}
                    </Text>
                  </View>
                )}

                {item.scheduledDate && (
                  <View style={styles.dateContainer}>
                    <Text style={styles.dateIcon}>📅</Text>
                    <Text style={styles.dateText}>
                      {new Date(item.scheduledDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                )}

                <View style={styles.actionContainer}>
                  {item.status === 'confirmed' && (
                    <TouchableOpacity
                      style={styles.startButton}
                      onPress={() => handleStartService(item._id)}
                    >
                      <Text style={styles.startButtonText}>
                        ▶️ Start Service
                      </Text>
                    </TouchableOpacity>
                  )}

                  {item.status === 'in-progress' && !item.completedByProvider && (
                    <TouchableOpacity
                      style={styles.completeButton}
                      onPress={() => handleCompleteService(item._id)}
                    >
                      <Text style={styles.completeButtonText}>
                        ✓ Mark as Completed
                      </Text>
                    </TouchableOpacity>
                  )}

                  {item.status === 'in-progress' && item.completedByProvider && (
                    <View style={styles.waitingBadge}>
                      <Text style={styles.waitingText}>
                        ⏳ Waiting for client confirmation
                      </Text>
                    </View>
                  )}

                  {item.status === 'completed' && (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedText}>
                        ✓ Service completed successfully
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: { fontSize: 16, color: '#4CAF50', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '800', color: '#333' },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 10, fontSize: 14, color: '#666' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: { fontSize: 80, marginBottom: 20 },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },
  browseButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  browseButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  list: { padding: 20 },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientAvatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  clientDetails: { flex: 1 },
  clientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  serviceType: { fontSize: 13, color: '#666', fontWeight: '500' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusIcon: { fontSize: 12 },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  priceLabel: { fontSize: 13, color: '#666', fontWeight: '600' },
  priceValue: { fontSize: 20, fontWeight: '800', color: '#4CAF50' },
  descriptionContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  descriptionLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '700',
    marginBottom: 6,
  },
  descriptionText: { fontSize: 13, color: '#333', lineHeight: 18 },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateIcon: { fontSize: 16, marginRight: 8 },
  dateText: { fontSize: 13, color: '#666', fontWeight: '600' },
  actionContainer: { marginTop: 5 },
  startButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  completeButton: {
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  waitingBadge: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  waitingText: { color: '#FF9800', fontSize: 13, fontWeight: '600' },
  completedBadge: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  completedText: { color: '#4CAF50', fontSize: 13, fontWeight: '600' },
});