import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import api from '../../config/api';

export default function UserBookingDetailsScreen({ route, navigation }: any) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    loadBooking();
    const interval = setInterval(loadBooking, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadBooking = async () => {
    try {
      const res = await api.get(`/bookings/${bookingId}`);
      setBooking(res.data);

      const msgRes = await api.get(`/bookings/${bookingId}/messages`);
      setMessages(msgRes.data || []);
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setSendingMessage(true);
    try {
      await api.post(`/bookings/${bookingId}/messages`, { message });
      setMessage('');
      loadBooking();
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handlePayNow = () => {
    navigation.navigate('Payment', {
      bookingId: booking._id,
      amount: booking.agreedPrice,
    });
  };

  const handleConfirmCompletion = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please rate the service (1-5 stars)');
      return;
    }

    Alert.alert(
      'Confirm Completion',
      'This will release payment to the provider. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await api.post(`/bookings/${bookingId}/confirm-release`, {
                rating,
                review,
              });
              Alert.alert('Success! 🎉', 'Service completed and payment released!');
              loadBooking();
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to confirm');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Booking Details</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Booking Details</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.error}>
          <Text style={styles.errorIcon}>😕</Text>
          <Text style={styles.errorText}>Booking not found</Text>
        </View>
      </View>
    );
  }

  const getStatusInfo = () => {
    const statusConfig: any = {
      'pending-payment': {
        color: '#FF9800',
        bgColor: '#FFF3E0',
        icon: '💳',
        message: 'Complete payment to confirm your booking',
        actions: ['pay', 'cancel'],
      },
      'confirmed': {
        color: '#4CAF50',
        bgColor: '#F0FDF4',
        icon: '✅',
        message: 'Booking confirmed! Waiting for provider to start',
        actions: ['message', 'cancel'],
      },
      'in-progress': {
        color: '#2196F3',
        bgColor: '#E3F2FD',
        icon: '🔨',
        message: booking.completedByProvider
          ? 'Provider completed service. Please review and confirm'
          : 'Service is currently in progress',
        actions: booking.completedByProvider
          ? ['complete', 'dispute', 'message']
          : ['message', 'dispute'],
      },
      'completed': {
        color: '#4CAF50',
        bgColor: '#F0FDF4',
        icon: '🎉',
        message: 'Service completed successfully!',
        actions: ['message'],
      },
      'cancelled': {
        color: '#F44336',
        bgColor: '#FFEBEE',
        icon: '❌',
        message: `Cancelled by ${booking.cancelledBy}`,
        actions: [],
      },
      'disputed': {
        color: '#FF5722',
        bgColor: '#FBE9E7',
        icon: '⚠️',
        message: 'Dispute under review by support team',
        actions: ['message'],
      },
    };
    return statusConfig[booking.status] || statusConfig['confirmed'];
  };

  const statusInfo = getStatusInfo();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Booking #{bookingId.slice(-6)}</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Status Banner */}
          <View style={[styles.statusBanner, { backgroundColor: statusInfo.bgColor }]}>
            <View style={styles.statusIconContainer}>
              <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
            </View>
            <View style={styles.statusInfo}>
              <Text style={[styles.statusTitle, { color: statusInfo.color }]}>
                {booking.status.toUpperCase().replace('-', ' ')}
              </Text>
              <Text style={styles.statusMessage}>{statusInfo.message}</Text>
            </View>
          </View>

          {/* Provider Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>👤 Provider Details</Text>
            <View style={styles.providerRow}>
              <View style={styles.providerAvatar}>
                <Text style={styles.avatarText}>
                  {booking.providerName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{booking.providerName}</Text>
                {booking.providerPhone && (
                  <View style={styles.contactRow}>
                    <Text style={styles.contactIcon}>📞</Text>
                    <Text style={styles.providerContact}>{booking.providerPhone}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Booking Details */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📋 Booking Information</Text>
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <View style={styles.detailLabelContainer}>
                  <Text style={styles.detailIcon}>💰</Text>
                  <Text style={styles.label}>Service Amount</Text>
                </View>
                <Text style={styles.amountValue}>Rs. {booking.agreedPrice}</Text>
              </View>
              <View style={styles.detailRow}>
                <View style={styles.detailLabelContainer}>
                  <Text style={styles.detailIcon}>📅</Text>
                  <Text style={styles.label}>Booking Date</Text>
                </View>
                <Text style={styles.value}>
                  {new Date(booking.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              {booking.isPaid && (
                <View style={styles.paymentBadge}>
                  <Text style={styles.paymentIcon}>✓</Text>
                  <Text style={styles.paymentText}>Payment Secured in Escrow</Text>
                </View>
              )}
            </View>
          </View>

          {/* Messages */}
          {(booking.status === 'confirmed' || booking.status === 'in-progress' || booking.status === 'completed') && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>💬 Messages</Text>
              <View style={styles.messagesContainer}>
                {messages.length === 0 ? (
                  <View style={styles.noMessagesContainer}>
                    <Text style={styles.noMessagesIcon}>💭</Text>
                    <Text style={styles.noMessages}>No messages yet</Text>
                    <Text style={styles.noMessagesSubtext}>
                      Start a conversation with your provider
                    </Text>
                  </View>
                ) : (
                  messages.map((msg, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.messageBox,
                        msg.senderRole === 'user' && styles.myMessage,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          msg.senderRole === 'user' && styles.myMessageText,
                        ]}
                      >
                        {msg.text}
                      </Text>
                      <Text
                        style={[
                          styles.messageTime,
                          msg.senderRole === 'user' && styles.myMessageTime,
                        ]}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  ))
                )}
              </View>

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Type your message..."
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  placeholderTextColor="#999"
                  editable={!sendingMessage}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, sendingMessage && styles.sendBtnDisabled]}
                  onPress={handleSendMessage}
                  disabled={sendingMessage}
                >
                  {sendingMessage ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.sendIcon}>➤</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Rating & Review (for completion) */}
          {booking.status === 'in-progress' && booking.completedByProvider && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>⭐ Rate & Review</Text>
              <Text style={styles.ratingSubtitle}>
                How was your experience with {booking.providerName}?
              </Text>

              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}
                  >
                    <Text style={styles.star}>{star <= rating ? '⭐' : '☆'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {rating > 0 && (
                <Text style={styles.ratingText}>
                  {rating === 5 && '🌟 Excellent!'}
                  {rating === 4 && '👍 Very Good!'}
                  {rating === 3 && '👌 Good'}
                  {rating === 2 && '😐 Fair'}
                  {rating === 1 && '😕 Poor'}
                </Text>
              )}

              <TextInput
                style={styles.reviewInput}
                placeholder="Share your experience (optional)"
                value={review}
                onChangeText={setReview}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            {statusInfo.actions.includes('pay') && (
              <TouchableOpacity style={styles.primaryBtn} onPress={handlePayNow}>
                <Text style={styles.btnIcon}>💳</Text>
                <Text style={styles.primaryBtnText}>
                  Pay Now - Rs. {booking.agreedPrice}
                </Text>
              </TouchableOpacity>
            )}

            {statusInfo.actions.includes('complete') && (
              <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirmCompletion}>
                <Text style={styles.btnIcon}>✓</Text>
                <Text style={styles.primaryBtnText}>
                  Confirm & Release Payment
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: { color: '#4CAF50', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '800', color: '#333' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 14, color: '#666' },
  error: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorIcon: { fontSize: 80, marginBottom: 20 },
  errorText: { fontSize: 18, color: '#666', fontWeight: '600' },
  scroll: { flex: 1 },
  statusBanner: {
    flexDirection: 'row',
    padding: 20,
    margin: 15,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statusIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  statusIcon: { fontSize: 28 },
  statusInfo: { flex: 1 },
  statusTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statusMessage: { color: '#666', fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#333',
    marginBottom: 15,
  },
  providerRow: { flexDirection: 'row', alignItems: 'center' },
  providerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#fff' },
  providerInfo: { flex: 1 },
  providerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center' },
  contactIcon: { fontSize: 14, marginRight: 6 },
  providerContact: { fontSize: 14, color: '#666', fontWeight: '500' },
  detailsContainer: { gap: 15 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailIcon: { fontSize: 18 },
  label: { fontSize: 14, color: '#666', fontWeight: '600' },
  value: { fontSize: 14, color: '#333', fontWeight: '700' },
  amountValue: { fontSize: 20, color: '#4CAF50', fontWeight: '800' },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 5,
  },
  paymentIcon: { fontSize: 16, color: '#4CAF50' },
  paymentText: { fontSize: 14, color: '#4CAF50', fontWeight: '700' },
  messagesContainer: { marginBottom: 15 },
  noMessagesContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noMessagesIcon: { fontSize: 50, marginBottom: 10 },
  noMessages: { fontSize: 16, color: '#666', fontWeight: '600', marginBottom: 4 },
  noMessagesSubtext: { fontSize: 13, color: '#999' },
  messageBox: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    maxWidth: '80%',
  },
  myMessage: {
    backgroundColor: '#4CAF50',
    alignSelf: 'flex-end',
  },
  messageText: { fontSize: 14, color: '#333', marginBottom: 4, lineHeight: 20 },
  myMessageText: { color: '#fff' },
  messageTime: { fontSize: 11, color: '#999' },
  myMessageTime: { color: 'rgba(255,255,255,0.8)', textAlign: 'right' },
  inputRow: { flexDirection: 'row', marginTop: 15, gap: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#F8F9FA',
    maxHeight: 80,
  },
  sendBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#4CAF50',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendIcon: { color: '#fff', fontSize: 18 },
  ratingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 15,
    gap: 8,
  },
  starButton: { padding: 5 },
  star: { fontSize: 40 },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    fontSize: 14,
    minHeight: 100,
    backgroundColor: '#F8F9FA',
  },
  actions: { padding: 15, gap: 10 },
  primaryBtn: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  btnIcon: { fontSize: 20 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});