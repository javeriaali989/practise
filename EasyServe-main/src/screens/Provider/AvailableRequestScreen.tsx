// ============================================
// screens/Provider/AvailableRequestScreen.tsx - Enhanced UX
// ============================================

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { authService } from '../../services/authService';
import api from '../../config/api';
import { Provider } from '../../types';
import { logger } from '../../utils/logger';
import { requestService } from '../../services/requestService';

const TAG = 'AvailableRequestScreen';

interface Request {
  _id: string;
  userId: string;
  userName: string;
  categoryId: string;
  categoryName: string;
  description: string;
  requestType: 'fixed' | 'bidding';
  fixedAmount?: number;
  status: 'open' | 'bidding' | 'assigned' | 'in-progress' | 'completed';
  createdAt: string;
}

export default function AvailableRequestScreen({ navigation }: any) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bidModalVisible, setBidModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidNote, setBidNote] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRequests();
    return () => {
      setRequests([]);
      setAttachments([]);
    };
  }, []);

  const loadRequests = async () => {
    try {
      const currentProvider = await authService.getCurrentUser();
      if (!currentProvider || currentProvider.role !== 'provider') {
        Alert.alert('Error', 'Provider information not found');
        return;
      }
      setProvider(currentProvider as Provider);

      const res = await api.get('/service-requests');

      const filteredRequests = (res.data || []).filter(
        (req: Request) =>
          req.categoryId === (currentProvider as Provider).categoryId &&
          (req.requestType === 'bidding' || req.requestType === 'fixed') &&
          (req.status === 'open' || req.status === 'bidding')
      );

      logger.info(TAG, `Loaded ${filteredRequests.length} matching requests`);
      setRequests(filteredRequests);
    } catch (error) {
      logger.error(TAG, 'Error loading requests', error);
      Alert.alert('Error', 'Failed to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.6,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setAttachments([
          ...attachments,
          {
            uri: file.uri,
            type: 'image',
            name: `bid-image-${Date.now()}.jpg`,
            size: file.fileSize,
          },
        ]);
      }
    } catch (error) {
      logger.error(TAG, 'Image picker error', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleOpenBidModal = (request: Request) => {
    setSelectedRequest(request);
    setBidAmount('');
    setBidNote('');
    setAttachments([]);
    setBidModalVisible(true);
  };

  const handleSubmitBid = async () => {
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid bid amount greater than 0');
      return;
    }

    if (!provider) {
      Alert.alert('Error', 'Provider not found');
      return;
    }

    setSubmitting(true);
    try {
      const existingBids = await api.get(
        `/service-requests/${selectedRequest?._id}/bids`
      );

      const alreadyBid = existingBids.data.some(
        (bid: any) => bid.providerId === provider.id
      );

      if (alreadyBid) {
        Alert.alert('Already Submitted', 'You have already placed a bid on this request');
        return;
      }

      await api.post('/service-requests/bid', {
        serviceRequestId: selectedRequest?._id,
        providerId: provider.id,
        providerName: provider.name,
        proposedAmount: parseFloat(bidAmount),
        note: bidNote.trim() || '',
        attachments: attachments,
      });

      logger.info(TAG, 'Bid submitted successfully');
      Alert.alert('Success! 🎉', 'Your bid has been submitted successfully');
      closeBidModal();
      loadRequests();
    } catch (error: any) {
      logger.error(TAG, 'Bid submission error', error);
      const msg = error.response?.data?.message || 'Failed to submit bid';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptFixedRequest = async (requestId: string) => {
    if (!provider) {
      Alert.alert('Error', 'Provider information not found');
      return;
    }

    Alert.alert(
      'Accept Request',
      'Do you want to accept this fixed price request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            setSubmitting(true);
            try {
              await requestService.acceptFixedRequest({
                requestId,
                providerId: provider.id,
                providerName: provider.name,
              });

              Alert.alert('Success! 🎉', 'You have accepted the fixed price request!');
              closeBidModal();
              loadRequests();
            } catch (error: any) {
              const msg = error.response?.data?.message || 'Failed to accept request';
              Alert.alert('Error', msg);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const closeBidModal = () => {
    setBidModalVisible(false);
    setSelectedRequest(null);
    setBidAmount('');
    setBidNote('');
    setAttachments([]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const getTimeDifference = (createdAt: string) => {
    const now = new Date().getTime();
    const created = new Date(createdAt).getTime();
    const diffInHours = Math.floor((now - created) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    return `${diffInDays} days ago`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Available Requests</Text>
        <View style={{ width: 50 }} />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Finding requests for you...</Text>
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>No requests available</Text>
          <Text style={styles.emptySubtext}>
            New service requests matching your category will appear here
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              setLoading(true);
              loadRequests();
            }}
          >
            <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2196F3']}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.requestCard}>
              <View style={styles.cardHeader}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.categoryName}</Text>
                </View>
                <View
                  style={[
                    styles.typeBadge,
                    item.requestType === 'fixed' && styles.fixedBadge,
                  ]}
                >
                  <Text style={styles.typeIcon}>
                    {item.requestType === 'bidding' ? '🎯' : '💰'}
                  </Text>
                  <Text style={styles.typeText}>
                    {item.requestType === 'bidding' ? 'Bidding' : 'Fixed'}
                  </Text>
                </View>
              </View>

              <View style={styles.clientSection}>
                <View style={styles.clientAvatar}>
                  <Text style={styles.clientAvatarText}>
                    {item.userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>{item.userName}</Text>
                  <Text style={styles.timeAgo}>{getTimeDifference(item.createdAt)}</Text>
                </View>
              </View>

              <Text style={styles.description} numberOfLines={3}>
                {item.description}
              </Text>

              {item.fixedAmount && (
                <View style={styles.budgetContainer}>
                  <View style={styles.budgetCard}>
                    <Text style={styles.budgetLabel}>Client Budget</Text>
                    <Text style={styles.budgetAmount}>Rs. {item.fixedAmount.toLocaleString()}</Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleOpenBidModal(item)}
              >
                <Text style={styles.actionButtonText}>
                  {item.requestType === 'bidding' ? '📝 Place Your Bid' : '✓ Accept Request'}
                </Text>
                <Text style={styles.actionArrow}>→</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Enhanced Bid Modal */}
      <Modal
        visible={bidModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeBidModal}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedRequest?.requestType === 'bidding' ? '📝 Place Bid' : '💰 Fixed Request'}
                </Text>
                <TouchableOpacity onPress={closeBidModal} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedRequest && (
                  <>
                    <View style={styles.requestPreview}>
                      <View style={styles.previewHeader}>
                        <View style={styles.previewBadge}>
                          <Text style={styles.previewBadgeText}>
                            {selectedRequest.categoryName}
                          </Text>
                        </View>
                        <Text style={styles.previewTime}>
                          {getTimeDifference(selectedRequest.createdAt)}
                        </Text>
                      </View>
                      
                      <View style={styles.previewClient}>
                        <View style={styles.previewAvatar}>
                          <Text style={styles.previewAvatarText}>
                            {selectedRequest.userName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.previewClientName}>{selectedRequest.userName}</Text>
                      </View>

                      <Text style={styles.previewDescription}>
                        {selectedRequest.description}
                      </Text>

                      {selectedRequest.fixedAmount && (
                        <View style={styles.previewBudget}>
                          <Text style={styles.previewBudgetLabel}>Client Budget</Text>
                          <Text style={styles.previewBudgetAmount}>
                            Rs. {selectedRequest.fixedAmount.toLocaleString()}
                          </Text>
                        </View>
                      )}
                    </View>

                    {selectedRequest.requestType === 'bidding' ? (
                      <>
                        <View style={styles.inputSection}>
                          <Text style={styles.inputLabel}>Your Bid Amount</Text>
                          <View style={styles.inputContainer}>
                            <Text style={styles.currencySymbol}>Rs.</Text>
                            <TextInput
                              style={styles.input}
                              placeholder="Enter your bid"
                              value={bidAmount}
                              onChangeText={setBidAmount}
                              keyboardType="numeric"
                              placeholderTextColor="#999"
                              editable={!submitting}
                            />
                          </View>
                          <Text style={styles.inputHint}>
                            💡 Competitive bids increase your chances
                          </Text>
                        </View>

                        <View style={styles.inputSection}>
                          <Text style={styles.inputLabel}>Cover Note (Optional)</Text>
                          <TextInput
                            style={styles.textArea}
                            placeholder="Tell the client why you're the best choice..."
                            value={bidNote}
                            onChangeText={setBidNote}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            placeholderTextColor="#999"
                            editable={!submitting}
                          />
                        </View>

                        <View style={styles.inputSection}>
                          <Text style={styles.inputLabel}>Attachments (Optional)</Text>
                          <TouchableOpacity
                            style={[
                              styles.imageButton,
                              attachments.length >= 5 && styles.imageButtonDisabled,
                            ]}
                            onPress={pickImage}
                            disabled={attachments.length >= 5 || submitting}
                          >
                            <Text style={styles.imageIcon}>📎</Text>
                            <Text style={styles.imageText}>
                              Add Photos ({attachments.length}/5)
                            </Text>
                          </TouchableOpacity>

                          {attachments.length > 0 && (
                            <View style={styles.attachmentsList}>
                              {attachments.map((att, idx) => (
                                <View key={idx} style={styles.attachment}>
                                  <Text style={styles.attachmentIcon}>📷</Text>
                                  <Text style={styles.attachmentName} numberOfLines={1}>
                                    {att.name}
                                  </Text>
                                  <TouchableOpacity
                                    onPress={() => removeAttachment(idx)}
                                    disabled={submitting}
                                  >
                                    <Text style={styles.removeIcon}>✕</Text>
                                  </TouchableOpacity>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      </>
                    ) : (
                      <View style={styles.fixedInfoCard}>
                        <Text style={styles.fixedInfoIcon}>💰</Text>
                        <Text style={styles.fixedInfoText}>
                          This is a fixed price request. By accepting, you agree to complete
                          the service for Rs. {selectedRequest.fixedAmount?.toLocaleString()}
                        </Text>
                      </View>
                    )}

                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={styles.cancelActionButton}
                        onPress={closeBidModal}
                        disabled={submitting}
                      >
                        <Text style={styles.cancelActionText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.submitActionButton,
                          submitting && styles.submitActionButtonDisabled,
                        ]}
                        onPress={async () => {
                          if (selectedRequest.requestType === 'fixed') {
                            await handleAcceptFixedRequest(selectedRequest._id);
                          } else {
                            await handleSubmitBid();
                          }
                        }}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.submitActionText}>
                            {selectedRequest.requestType === 'fixed'
                              ? '✓ Accept Request'
                              : '📤 Submit Bid'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 80, marginBottom: 20 },
  emptyText: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 8 },
  emptySubtext: { fontSize: 15, color: '#999', textAlign: 'center', marginBottom: 30 },
  refreshButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  refreshButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  list: { padding: 20 },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
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
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  categoryText: { fontSize: 12, fontWeight: '700', color: '#1976D2' },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  fixedBadge: { backgroundColor: '#F0FDF4' },
  typeIcon: { fontSize: 12 },
  typeText: { fontSize: 11, fontWeight: '700', color: '#7B1FA2' },
  clientSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientAvatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 2 },
  timeAgo: { fontSize: 12, color: '#999' },
  description: { fontSize: 15, color: '#333', lineHeight: 22, marginBottom: 15 },
  budgetContainer: { marginBottom: 15 },
  budgetCard: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  budgetLabel: { fontSize: 12, color: '#666', fontWeight: '600', marginBottom: 4 },
  budgetAmount: { fontSize: 20, fontWeight: '800', color: '#4CAF50' },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  actionButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  actionArrow: { fontSize: 18, color: '#fff', fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    maxHeight: '95%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#333' },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: { fontSize: 20, color: '#666', fontWeight: '700' },
  requestPreview: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  previewBadgeText: { fontSize: 11, fontWeight: '700', color: '#1976D2' },
  previewTime: { fontSize: 11, color: '#999', fontWeight: '600' },
  previewClient: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  previewAvatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  previewClientName: { fontSize: 15, fontWeight: '700', color: '#333' },
  previewDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  previewBudget: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewBudgetLabel: { fontSize: 12, color: '#666', fontWeight: '600' },
  previewBudgetAmount: { fontSize: 16, fontWeight: '800', color: '#4CAF50' },
  inputSection: { marginBottom: 20 },
  inputLabel: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 10 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 15,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
    marginRight: 8,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  inputHint: { fontSize: 12, color: '#666', marginTop: 8, fontStyle: 'italic' },
  textArea: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  imageButtonDisabled: { opacity: 0.5 },
  imageIcon: { fontSize: 20, marginRight: 10 },
  imageText: { fontSize: 15, color: '#333', fontWeight: '600' },
  attachmentsList: { marginTop: 12, gap: 8 },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  attachmentIcon: { fontSize: 18, marginRight: 10 },
  attachmentName: { fontSize: 14, color: '#333', flex: 1 },
  removeIcon: { fontSize: 18, color: '#F44336', fontWeight: '700' },
  fixedInfoCard: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  fixedInfoIcon: { fontSize: 24, marginRight: 12 },
  fixedInfoText: { fontSize: 14, color: '#666', lineHeight: 20, flex: 1 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  cancelActionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelActionText: { fontSize: 16, fontWeight: '700', color: '#666' },
  submitActionButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitActionButtonDisabled: { opacity: 0.6 },
  submitActionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});