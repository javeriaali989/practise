import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { providerService } from '../../services/providerService';
import { logger } from '../../utils/logger';
import { formatters } from '../../utils/formatter';
import { Provider } from '../../types';

const TAG = 'ProviderDetailsScreen';

export default function ProviderDetailsScreen({ route, navigation }: any) {
  const { providerId } = route.params;
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProvider();
  }, [providerId]);

  const loadProvider = async () => {
    try {
      logger.info(TAG, `Loading provider: ${providerId}`);
      const data = await providerService.getById(providerId);
      setProvider(data);
    } catch (error) {
      logger.error(TAG, 'Error loading provider', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Provider not found</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Provider Profile</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>👤</Text>
          </View>

          <Text style={styles.name}>{provider.name}</Text>

          <View style={styles.ratingRow}>
            <Text style={styles.ratingStars}>⭐</Text>
            <Text style={styles.ratingText}>
              {formatters.rating(provider.rating)}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <InfoRow label="Category" value={provider.categoryName} />
          <InfoRow label="Area" value={provider.area} />

          {provider.price && (
            <InfoRow
              label="Base Price"
              value={formatters.currency(provider.price)}
              valueStyle={styles.priceValue}
            />
          )}

          {provider.phone && (
            <InfoRow label="Phone" value={provider.phone} />
          )}
        </View>

        {/* About */}
        {provider.description && (
          <View style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{provider.description}</Text>
          </View>
        )}

        {/* Reviews */}
        {provider.reviews && provider.reviews.length > 0 && (
          <View style={styles.reviewsCard}>
            <Text style={styles.sectionTitle}>
              Reviews ({provider.reviews.length})
            </Text>

            {provider.reviews.slice(0, 3).map((review, idx) => (
              <View key={idx} style={styles.review}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewName}>{review.userName}</Text>
                  <Text style={styles.reviewRating}>
                    ⭐ {review.rating}
                  </Text>
                </View>
                <Text
                  style={styles.reviewComment}
                  numberOfLines={2}
                >
                  {review.comment}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.contactButton}
          onPress={() =>
            navigation.navigate('ServiceRequest', {
              category: {
                _id: provider.categoryId,
                id: provider.categoryId,
                name: provider.categoryName,
              },
            })
          }
        >
          <Text style={styles.contactButtonText}>
            Request Service
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

/* ---------- Small UI Helper ---------- */
function InfoRow({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: any;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueStyle]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  errorText: {
    fontSize: 15,
    color: '#999',
    marginBottom: 20,
  },

  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
  },

  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },

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

  backButton: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
  },

  content: { padding: 20 },

  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginBottom: 22,
    elevation: 3,
  },

  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  avatar: { fontSize: 44 },

  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333',
    marginBottom: 8,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ratingStars: { fontSize: 16, marginRight: 6 },

  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },

  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 22,
    elevation: 3,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  infoLabel: {
    fontSize: 14,
    color: '#777',
    fontWeight: '600',
  },

  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '700',
  },

  priceValue: {
    color: '#4CAF50',
    fontSize: 16,
  },

  descriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 22,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    marginBottom: 10,
  },

  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },

  reviewsCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 22,
    elevation: 3,
  },

  review: {
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  reviewName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },

  reviewRating: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF9800',
  },

  reviewComment: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },

  contactButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 30,
    elevation: 4,
  },

  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
