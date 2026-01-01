// ============================================
// screens/Provider/MyBidsScreen.tsx - Enhanced UX Only
// ============================================

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { authService } from '../../services/authService';
import api from '../../config/api';
import { logger } from '../../utils/logger';
import { formatters } from '../../utils/formatter';
import { Bid } from '../../types';

const TAG = 'MyBidsScreen';

// ✅ LOCAL BID STATUS COLORS - ONLY FOR BIDS
const BID_STATUS_COLORS = {
  pending: '#FF9800',
  accepted: '#4CAF50',
  rejected: '#F44336',
};

const BID_STATUS_ICONS = {
  pending: '⏳',
  accepted: '✓',
  rejected: '✕',
};

export default function MyBidsScreen({ navigation }: any) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBids();
    return () => setBids([]);
  }, []);

  const loadBids = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return;

      logger.info(TAG, `Loading bids for provider: ${user.id}`);

      const res = await api.get(`/service-requests/provider-bids/${user.id}`);
      const sortedBids = (res.data || []).sort(
        (a: Bid, b: Bid) =>
          new Date(b.createdAt || '').getTime() -
          new Date(a.createdAt || '').getTime()
      );

      setBids(sortedBids);
      logger.info(TAG, `Loaded ${sortedBids.length} bids`);
    } catch (error) {
      logger.error(TAG, 'Error loading bids', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBids();
  };

  // ✅ SAFE COLOR GETTER FOR BID STATUS
  const getBidStatusColor = (status: Bid['status']): string => {
    return BID_STATUS_COLORS[status] || '#999';
  };

  // ✅ SAFE ICON GETTER FOR BID STATUS
  const getBidStatusIcon = (status: Bid['status']): string => {
    return BID_STATUS_ICONS[status] || '•';
  };

  // Helper function for better time display
  const getTimeDifference = (createdAt: string) => {
    const now = new Date().getTime();
    const created = new Date(createdAt).getTime();
    const diffInHours = Math.floor((now - created) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    return formatters.date(createdAt);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>My Bids</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading your bids...</Text>
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
        <Text style={styles.title}>My Bids</Text>
        <View style={{ width: 50 }} />
      </View>

      {bids.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyText}>No bids yet</Text>
          <Text style={styles.emptySubtext}>
            Start bidding on available requests to grow your business
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.replace('AvailableRequests')}
          >
            <Text style={styles.browseButtonText}>🔍 Browse Requests</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bids}
          keyExtractor={(item) => item._id || `bid-${Math.random()}`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2196F3']}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.bidCard}>
              {/* Card Header with Amount and Status */}
              <View style={styles.bidHeader}>
                <View style={styles.bidAmountSection}>
                  <Text style={styles.bidLabel}>Your Bid</Text>
                  <Text style={styles.bidAmount}>
                    {formatters.currency(item.proposedAmount)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getBidStatusColor(item.status) },
                  ]}
                >
                  <Text style={styles.statusIcon}>
                    {getBidStatusIcon(item.status)}
                  </Text>
                  <Text style={styles.statusText}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              </View>

              {/* Bid Note */}
              {item.note && (
                <View style={styles.noteSection}>
                  <Text style={styles.noteLabel}>Your Note:</Text>
                  <Text style={styles.bidNote} numberOfLines={2}>
                    {item.note}
                  </Text>
                </View>
              )}

              {/* Attachments Info */}
              {item.attachments && item.attachments.length > 0 && (
                <View style={styles.attachmentsSection}>
                  <Text style={styles.attachmentIcon}>📎</Text>
                  <Text style={styles.attachmentText}>
                    {item.attachments.length} attachment{item.attachments.length > 1 ? 's' : ''}
                  </Text>
                </View>
              )}

              {/* Card Footer with Time */}
              <View style={styles.cardFooter}>
                <Text style={styles.timeText}>
                  {getTimeDifference(item.createdAt?.toString() || '')}
                </Text>
                {item.status === 'pending' && (
                  <View style={styles.pendingIndicator}>
                    <View style={styles.pulseCircle} />
                    <Text style={styles.pendingText}>Waiting for response</Text>
                  </View>
                )}
                {item.status === 'accepted' && (
                  <View style={styles.acceptedIndicator}>
                    <Text style={styles.acceptedIcon}>🎉</Text>
                    <Text style={styles.acceptedText}>Bid accepted!</Text>
                  </View>
                )}
              </View>
            </View>
          )}
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
  backButton: { fontSize: 16, color: '#2196F3', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '800', color: '#333' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    lineHeight: 22,
  },
  browseButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  browseButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  list: { padding: 20 },
  bidCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  bidAmountSection: { flex: 1 },
  bidLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  bidAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2196F3',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  statusIcon: { fontSize: 14, color: '#fff' },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  noteSection: {
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  noteLabel: {
    fontSize: 11,
    color: '#F57C00',
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  bidNote: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  attachmentsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  attachmentIcon: { fontSize: 16, marginRight: 8 },
  attachmentText: { fontSize: 12, color: '#666', fontWeight: '600' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: { fontSize: 12, color: '#999', fontWeight: '500' },
  pendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9800',
  },
  pendingText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
  acceptedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  acceptedIcon: { fontSize: 14 },
  acceptedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
});