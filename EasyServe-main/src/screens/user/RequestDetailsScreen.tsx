import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import api from '../../config/api';
import { logger } from '../../utils/logger';
import { formatters } from '../../utils/formatter';
import { STATUS_COLORS } from '../../utils/constants';
import { ServiceRequest, Bid } from '../../types';

const TAG = 'RequestDetailsScreen';

export default function RequestDetailsScreen({ route, navigation }: any) {
  const { requestId } = route.params;
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    return () => {
      setRequest(null);
      setBids([]);
    };
  }, []);

  const loadData = async () => {
    try {
      logger.info(TAG, `Loading request: ${requestId}`);

      const [requestRes, bidsRes] = await Promise.all([
        api.get(`/service-requests/${requestId}`),
        api.get(`/service-requests/${requestId}/bids`),
      ]);

      setRequest(requestRes.data);
      setBids(
        (bidsRes.data || []).sort((a: Bid, b: Bid) =>
          a.status === 'accepted'
            ? -1
            : b.status === 'accepted'
            ? 1
            : a.proposedAmount - b.proposedAmount
        )
      );
    } catch (error) {
      logger.error(TAG, 'Error loading data', error);
      Alert.alert('Error', 'Failed to load request details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAcceptBid = async (bidId: string) => {
    Alert.alert(
      'Accept Bid',
      'Are you sure? Other bids will be automatically rejected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              setLoading(true);
              await api.post('/service-requests/accept-bid', { bidId });
              Alert.alert('Success', 'Bid accepted! Provider notified.');
              loadData();
            } catch (error: any) {
              const msg =
                error.response?.data?.message || 'Failed to accept bid';
              Alert.alert('Error', msg);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Request not found</Text>
        <TouchableOpacity
          style={styles.backAction}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backActionText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getStatusColor = (status: string) =>
    STATUS_COLORS[status] || '#999';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Request Details</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Request Summary */}
        <View style={styles.requestCard}>
          <View style={styles.cardHeader}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {request.categoryName}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(request.status) },
              ]}
            >
              <Text style={styles.statusText}>{request.status}</Text>
            </View>
          </View>

          <Text style={styles.descriptionLabel}>Description</Text>
          <Text style={styles.description}>{request.description}</Text>

          {request.requestType === 'fixed' && (
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Fixed Budget</Text>
              <Text style={styles.budgetValue}>
                {formatters.currency(request.fixedAmount || 0)}
              </Text>
            </View>
          )}

          <Text style={styles.metaText}>
            Posted{' '}
            {request.createdAt
              ? formatters.date(request.createdAt)
              : 'N/A'}
          </Text>
        </View>

        {/* Assigned Provider */}
        {request.status === 'assigned' &&
          request.assignedProviderName && (
            <View style={styles.assignedCard}>
              <Text style={styles.assignedIcon}>✅</Text>
              <View>
                <Text style={styles.assignedLabel}>Assigned to</Text>
                <Text style={styles.assignedName}>
                  {request.assignedProviderName}
                </Text>
              </View>
            </View>
          )}

        {/* Bids */}
        <View style={styles.bidsSection}>
          <Text style={styles.sectionTitle}>
            Bids Received ({bids.length})
          </Text>

          {bids.length === 0 ? (
            <View style={styles.noBids}>
              <Text style={styles.noBidsIcon}>💰</Text>
              <Text style={styles.noBidsText}>No bids yet</Text>
              <Text style={styles.noBidsSubtext}>
                Providers will respond soon
              </Text>
            </View>
          ) : (
            <FlatList
              data={bids}
              keyExtractor={(item, index) =>
                item._id ?? index.toString()
              }
              scrollEnabled={false}
              renderItem={({ item }) => {
                const accepted = item.status === 'accepted';

                return (
                  <View
                    style={[
                      styles.bidCard,
                      accepted && styles.bidAccepted,
                    ]}
                  >
                    <View style={styles.bidHeader}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>👤</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.providerName}>
                          {item.providerName}
                        </Text>
                        <Text
                          style={[
                            styles.bidAmount,
                            accepted && styles.bidAmountAccepted,
                          ]}
                        >
                          {formatters.currency(
                            item.proposedAmount
                          )}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.bidStatus,
                          {
                            backgroundColor:
                              item.status === 'accepted'
                                ? '#4CAF50'
                                : item.status === 'rejected'
                                ? '#F44336'
                                : '#FF9800',
                          },
                        ]}
                      >
                        <Text style={styles.bidStatusText}>
                          {item.status}
                        </Text>
                      </View>
                    </View>

                    {item.note && (
                      <Text style={styles.bidNote} numberOfLines={2}>
                        {item.note}
                      </Text>
                    )}

                    <Text style={styles.metaText}>
                      Posted{' '}
                      {formatters.date(
                        request.createdAt || ''
                      )}
                    </Text>

                    {item.status === 'pending' &&
                      request.status !== 'assigned' && (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          style={styles.acceptButton}
                          onPress={() =>
                            item._id && handleAcceptBid(item._id)
                          }
                        >
                          <Text style={styles.acceptButtonText}>
                            Accept Bid ✓
                          </Text>
                        </TouchableOpacity>
                      )}
                  </View>
                );
              }}
            />
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 18,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  backButton: { fontSize: 16, color: '#4CAF50', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '800', color: '#333' },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  content: { padding: 20 },

  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  categoryBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },

  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1976D2',
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },

  descriptionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    marginBottom: 6,
  },

  description: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 14,
  },

  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },

  budgetLabel: { fontSize: 14, color: '#666', fontWeight: '600' },
  budgetValue: { fontSize: 20, fontWeight: '800', color: '#4CAF50' },

  metaText: { fontSize: 12, color: '#999', marginTop: 6 },

  assignedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },

  assignedIcon: { fontSize: 30, marginRight: 14 },
  assignedLabel: { fontSize: 13, color: '#666' },
  assignedName: { fontSize: 18, fontWeight: '800', color: '#333' },

  bidsSection: { marginBottom: 30 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
    marginBottom: 12,
  },

  noBids: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 40,
    alignItems: 'center',
  },

  noBidsIcon: { fontSize: 60, marginBottom: 12 },
  noBidsText: { fontSize: 16, fontWeight: '700', color: '#333' },
  noBidsSubtext: { fontSize: 14, color: '#999' },

  bidCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },

  bidAccepted: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },

  bidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  avatarText: { fontSize: 24 },

  providerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },

  bidAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2196F3',
  },

  bidAmountAccepted: { color: '#4CAF50' },

  bidStatus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },

  bidStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },

  bidNote: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },

  acceptButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },

  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  errorText: { color: '#999', fontSize: 16, marginBottom: 20 },

  backAction: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 14,
  },

  backActionText: { color: '#fff', fontWeight: '700' },
});
