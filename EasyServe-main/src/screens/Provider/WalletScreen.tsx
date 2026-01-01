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
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { paymentService } from '../../services/paymentService';
import { validators } from '../../utils/validators';
import { logger } from '../../utils/logger';
import { formatters } from '../../utils/formatter';
import { Wallet, Transaction } from '../../types';

const TAG = 'WalletScreen';

export default function WalletScreen({ navigation }: any) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    loadWallet();
    return () => setWallet(null);
  }, []);

  const loadWallet = async () => {
    setLoading(true);
    try {
      const walletData = await paymentService.getWallet();
      setWallet(walletData);

      const sortedTx = (walletData.transactions || []).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setTransactions(sortedTx);

      logger.info(TAG, 'Wallet loaded successfully');
    } catch (error) {
      logger.error(TAG, 'Failed to load wallet', error);
      Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const validation = validators.price(withdrawAmount);
    if (!validation.valid) {
      Alert.alert('Validation Error', validation.error);
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (!wallet || amount > wallet.balance) {
      Alert.alert('Insufficient Funds', 'You don\'t have enough balance to withdraw this amount');
      return;
    }

    Alert.alert(
      'Confirm Withdrawal',
      `Withdraw ${formatters.currency(amount)} from your wallet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            setWithdrawing(true);
            try {
              await paymentService.withdraw(amount);

              const updatedWallet = { ...wallet };
              updatedWallet.balance -= amount;
              updatedWallet.transactions = [
                {
                  type: 'debit',
                  amount,
                  reference: 'withdrawal',
                  status: 'withdrawn',
                  createdAt: new Date().toISOString(),
                },
                ...(updatedWallet.transactions || []),
              ];

              setWallet(updatedWallet);
              setTransactions(updatedWallet.transactions);
              setWithdrawAmount('');
              Alert.alert('Success! 💸', `Successfully withdrawn ${formatters.currency(amount)}`);
            } catch (err: any) {
              logger.error(TAG, 'Withdrawal failed', err);
              Alert.alert('Withdrawal Failed', err.message || 'Could not process withdrawal. Please try again.');
            } finally {
              setWithdrawing(false);
            }
          },
        },
      ]
    );
  };

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
          <Text style={styles.title}>My Wallet</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>My Wallet</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Scrollable Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              {/* Wallet Card */}
              <View style={styles.walletCard}>
                <View style={styles.walletIconContainer}>
                  <Text style={styles.walletIcon}>💳</Text>
                </View>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceAmount}>
                  {formatters.currency(wallet?.balance || 0)}
                </Text>

                <View style={styles.divider} />

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <View style={styles.statIconBadge}>
                      <Text style={styles.statIconText}>🔒</Text>
                    </View>
                    <Text style={styles.statLabel}>Held</Text>
                    <Text style={styles.statValue}>
                      {formatters.currency(wallet?.heldBalance || 0)}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <View style={styles.statIconBadge}>
                      <Text style={styles.statIconText}>💰</Text>
                    </View>
                    <Text style={styles.statLabel}>Total Earned</Text>
                    <Text style={styles.statValue}>
                      {formatters.currency(wallet?.totalEarned || 0)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Withdraw Section */}
              <View style={styles.withdrawSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionIcon}>💸</Text>
                  <Text style={styles.sectionTitle}>Withdraw Funds</Text>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencySymbol}>Rs.</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter amount to withdraw"
                    value={withdrawAmount}
                    onChangeText={setWithdrawAmount}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                    editable={!withdrawing}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </View>
                {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                  <Text style={styles.withdrawHint}>
                    💡 This amount will be transferred to your bank account
                  </Text>
                )}
                <TouchableOpacity
                  style={[styles.withdrawButton, withdrawing && styles.buttonDisabled]}
                  onPress={handleWithdraw}
                  disabled={withdrawing}
                >
                  {withdrawing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.withdrawButtonText}>🏦 Withdraw to Bank</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Transactions Section */}
              <View style={styles.transactionsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionIcon}>📊</Text>
                  <Text style={styles.sectionTitle}>Transaction History</Text>
                </View>
                
                {transactions.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyText}>No transactions yet</Text>
                    <Text style={styles.emptySubtext}>
                      Your transaction history will appear here
                    </Text>
                  </View>
                ) : (
                  transactions.map((item, index) => (
                    <View key={item._id || `tx-${index}`} style={styles.transactionCard}>
                      <View style={styles.transactionLeft}>
                        <View
                          style={[
                            styles.transactionIconContainer,
                            item.type === 'credit'
                              ? styles.creditIconContainer
                              : styles.debitIconContainer,
                          ]}
                        >
                          <Text style={styles.transactionIcon}>
                            {item.type === 'credit' ? '💰' : '🏦'}
                          </Text>
                        </View>
                        <View style={styles.transactionInfo}>
                          <Text style={styles.transactionReference}>
                            {item.reference || 'Transaction'}
                          </Text>
                          <Text
                            style={[
                              styles.transactionAmount,
                              item.type === 'debit' && styles.debitAmount,
                            ]}
                          >
                            {item.type === 'debit' ? '-' : '+'}{' '}
                            {formatters.currency(item.amount)}
                          </Text>
                          <View style={styles.transactionMeta}>
                            <View
                              style={[
                                styles.statusBadge,
                                item.status === 'completed' && styles.statusCompleted,
                                item.status === 'pending' && styles.statusPending,
                                item.status === 'withdrawn' && styles.statusWithdrawn,
                              ]}
                            >
                              <Text style={styles.statusText}>
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                              </Text>
                            </View>
                            <Text style={styles.transactionDate}>
                              {getTimeDifference(item.createdAt || '')}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* Bottom Padding */}
              <View style={{ height: 20 }} />
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 14, color: '#666' },
  scrollContent: { flexGrow: 1 },
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
  backButton: { fontSize: 16, color: '#4CAF50', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '800', color: '#333' },
  walletCard: {
    backgroundColor: '#4CAF50',
    margin: 20,
    padding: 30,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  walletIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  walletIcon: { fontSize: 28 },
  balanceLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 20,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconText: { fontSize: 20 },
  statLabel: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 6,
    fontWeight: '600',
  },
  statValue: { fontSize: 16, fontWeight: '700', color: '#fff' },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 10,
  },
  withdrawSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionIcon: { fontSize: 20, marginRight: 8 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: '#F8F9FA',
    marginBottom: 10,
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
  withdrawHint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  withdrawButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  withdrawButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  transactionsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 60, marginBottom: 15 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#999', textAlign: 'center' },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  creditIconContainer: { backgroundColor: '#F0FDF4' },
  debitIconContainer: { backgroundColor: '#FFF3E0' },
  transactionIcon: { fontSize: 24 },
  transactionInfo: { flex: 1 },
  transactionReference: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4CAF50',
    marginBottom: 6,
  },
  debitAmount: { color: '#F44336' },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
  },
  statusCompleted: { backgroundColor: '#F0FDF4' },
  statusPending: { backgroundColor: '#FFF3E0' },
  statusWithdrawn: { backgroundColor: '#E3F2FD' },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
});