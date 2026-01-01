import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { paymentService } from '../../services/paymentService';

export default function PaymentScreen({ route, navigation }: any) {
  const { booking, amount } = route.params;
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [loading, setLoading] = useState(false);

  const paymentMethods = [
    { id: 'card', name: 'Credit / Debit Card', icon: '💳' },
    { id: 'jazzcash', name: 'JazzCash', icon: '📱' },
    { id: 'easypaisa', name: 'Easypaisa', icon: '💰' },
    { id: 'bank', name: 'Bank Transfer', icon: '🏦' },
  ];

  const handlePayment = async () => {
    setLoading(true);
    try {
      await paymentService.initiatePayment(
        booking._id || booking.id,
        selectedMethod
      );
      Alert.alert('Success', 'Payment successful!');
      navigation.navigate('MyBookings');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Payment failed';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Complete Payment</Text>

      {/* Amount */}
      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Amount to Pay</Text>
        <Text style={styles.amount}>Rs. {amount}</Text>
      </View>

      {/* Payment Methods */}
      <Text style={styles.label}>Select payment method</Text>

      {paymentMethods.map((method) => {
        const isSelected = selectedMethod === method.id;

        return (
          <TouchableOpacity
            key={method.id}
            activeOpacity={0.85}
            style={[
              styles.methodCard,
              isSelected && styles.methodCardSelected,
            ]}
            onPress={() => setSelectedMethod(method.id)}
          >
            <View style={styles.methodLeft}>
              <Text style={styles.methodIcon}>{method.icon}</Text>
              <Text style={styles.methodName}>{method.name}</Text>
            </View>

            {isSelected && (
              <View style={styles.checkContainer}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {/* Pay Button */}
      <TouchableOpacity
        style={[
          styles.payButton,
          loading && styles.payButtonDisabled,
        ]}
        activeOpacity={0.85}
        onPress={handlePayment}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.payButtonText}>
            Pay Rs. {amount}
          </Text>
        )}
      </TouchableOpacity>

      {/* Security Note */}
      <Text style={styles.secureNote}>
        🔒 Your payment is secure and encrypted
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingTop: 60,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333',
    marginBottom: 24,
  },

  amountContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    alignItems: 'center',
    elevation: 2,
  },

  amountLabel: {
    fontSize: 14,
    color: '#777',
    marginBottom: 6,
    fontWeight: '500',
  },

  amount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#4CAF50',
  },

  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },

  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#EFEFEF',
  },

  methodCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F0FDF4',
  },

  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  methodIcon: {
    fontSize: 26,
    marginRight: 14,
  },

  methodName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },

  checkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkmark: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '800',
  },

  payButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 30,
    elevation: 4,
  },

  payButtonDisabled: {
    opacity: 0.7,
  },

  payButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },

  secureNote: {
    textAlign: 'center',
    color: '#777',
    fontSize: 13,
    marginTop: 18,
  },
});
