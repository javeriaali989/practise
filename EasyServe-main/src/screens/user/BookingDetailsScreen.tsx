import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

    try {
      await api.post(`/bookings/${bookingId}/messages`, { message });
      setMessage('');
      loadBooking();
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
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
              // await api.post(`/bookings/${bookingId}/user-confirm`, {
              //   rating,
              //   review,
              // });
              await api.post(`/bookings/${bookingId}/confirm-release`, {
                rating,
                review,
              });
              await api.post(`/bookings/${bookingId}/confirm-release`);
              Alert.alert('Success', 'Service completed and payment released!');
              loadBooking();
              navigation.goBack(); // Go back to bookings list
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
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>Booking not found</Text>
      </View>
    );
  }

  const getStatusInfo = () => {
    const statusConfig: any = {
      'pending-payment': {
        color: '#FF9800',
        icon: '💳',
        message: 'Please complete payment to confirm booking',
        actions: ['pay', 'cancel'],
      },
      'confirmed': {
        color: '#4CAF50',
        icon: '✅',
        message: 'Waiting for provider to start service',
        actions: ['message', 'cancel'],
      },
      'in-progress': {
        color: '#2196F3',
        icon: '🔨',
        message: booking.completedByProvider
          ? 'Provider completed. Please confirm to release payment'
          : 'Service in progress',
        actions: booking.completedByProvider
          ? ['complete', 'dispute', 'message']
          : ['message', 'dispute'],
      },
      'completed': {
        color: '#4CAF50',
        icon: '🎉',
        message: 'Service completed successfully!',
        actions: ['message'],
      },
      'cancelled': {
        color: '#F44336',
        icon: '❌',
        message: `Cancelled by ${booking.cancelledBy}`,
        actions: [],
      },
      'disputed': {
        color: '#FF5722',
        icon: '⚠️',
        message: 'Dispute under review',
        actions: ['message'],
      },
    };
    return statusConfig[booking.status] || statusConfig['confirmed'];
  };

  const statusInfo = getStatusInfo();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Booking #{bookingId.slice(-6)}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.scroll}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusInfo.color }]}>
          <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>{booking.status.toUpperCase()}</Text>
            <Text style={styles.statusMessage}>{statusInfo.message}</Text>
          </View>
        </View>

        {/* Provider Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Provider Details</Text>
          <View style={styles.providerRow}>
            <Text style={styles.avatar}>👤</Text>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{booking.providerName}</Text>
              <Text style={styles.providerContact}>{booking.providerPhone || 'No phone'}</Text>
            </View>
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Amount:</Text>
            <Text style={styles.value}>Rs. {booking.agreedPrice}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Created:</Text>
            <Text style={styles.value}>{new Date(booking.createdAt).toLocaleDateString()}</Text>
          </View>
          {booking.isPaid && (
            <View style={styles.row}>
              <Text style={styles.label}>Payment:</Text>
              <Text style={[styles.value, { color: '#4CAF50' }]}>✓ Paid (In Escrow)</Text>
            </View>
          )}
        </View>

        {/* Messages */}
        {(booking.status === 'confirmed' || booking.status === 'in-progress' || booking.status === 'completed') && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Messages</Text>
            {messages.length === 0 ? (
              <Text style={styles.noMessages}>No messages yet</Text>
            ) : (
              messages.map((msg, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.messageBox,
                    msg.senderRole === 'user' && styles.myMessage,
                  ]}
                >
                  <Text style={styles.messageText}>{msg.text}</Text>
                  <Text style={styles.messageTime}>
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </Text>
                </View>
              ))
            )}

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Type message..."
                value={message}
                onChangeText={setMessage}
                multiline
              />
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
                <Text style={styles.sendIcon}>➤</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Rating & Review (for completion) */}
        {booking.status === 'in-progress' && booking.completedByProvider && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rate & Review</Text>

            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Text style={styles.star}>{star <= rating ? '⭐' : '☆'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="Write your review (optional)"
              value={review}
              onChangeText={setReview}
              multiline
              numberOfLines={4}
            />
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {statusInfo.actions.includes('pay') && (
            <TouchableOpacity style={styles.primaryBtn} onPress={handlePayNow}>
              <Text style={styles.primaryBtnText}>Pay Now Rs. {booking.agreedPrice}</Text>
            </TouchableOpacity>
          )}

          {statusInfo.actions.includes('complete') && (
            <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirmCompletion}>
              <Text style={styles.primaryBtnText}>Confirm Completion & Release Payment</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: { color: '#4CAF50', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: '#333' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#999' },
  scroll: { flex: 1 },
  statusBanner: {
    flexDirection: 'row',
    padding: 20,
    margin: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusIcon: { fontSize: 30, marginRight: 15 },
  statusInfo: { flex: 1 },
  statusTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  statusMessage: { color: '#fff', fontSize: 14 },
  card: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 15 },
  providerRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { fontSize: 40, marginRight: 15 },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 4 },
  providerContact: { fontSize: 14, color: '#666' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: { fontSize: 14, color: '#666', fontWeight: '600' },
  value: { fontSize: 14, color: '#333', fontWeight: '600' },
  noMessages: { textAlign: 'center', color: '#999', paddingVertical: 20 },
  messageBox: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    maxWidth: '80%',
  },
  myMessage: { backgroundColor: '#4CAF50', alignSelf: 'flex-end' },
  messageText: { fontSize: 14, color: '#333', marginBottom: 4 },
  messageTime: { fontSize: 11, color: '#999' },
  inputRow: { flexDirection: 'row', marginTop: 15, gap: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#4CAF50',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: { color: '#fff', fontSize: 18 },
  starRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: 15 },
  star: { fontSize: 36, marginHorizontal: 5 },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actions: { padding: 15, gap: 10 },
  primaryBtn: { backgroundColor: '#4CAF50', padding: 16, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dangerBtn: { backgroundColor: '#F44336', padding: 16, borderRadius: 12, alignItems: 'center' },
  dangerBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  outlineBtn: {
    borderWidth: 2,
    borderColor: '#666',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  outlineBtnText: { color: '#666', fontSize: 16, fontWeight: '600' },
});