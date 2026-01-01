// ============================================
// screens/user/ServiceRequestScreen.tsx - UX TEXT REWRITE
// ============================================

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { authService } from '../../services/authService';
import api from '../../config/api';
import { validators } from '../../utils/validators';
import { logger } from '../../utils/logger';
import { VALIDATION } from '../../utils/constants';

const TAG = 'ServiceRequestScreen';

export default function ServiceRequestScreen({ route, navigation }: any) {
  const { category } = route.params;
  const [description, setDescription] = useState('');
  const [isFixedPrice, setIsFixedPrice] = useState(false);
  const [fixedAmount, setFixedAmount] = useState('');
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      if (images.length >= 5) {
        Alert.alert('Limit Reached', 'You can upload a maximum of 5 photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.6,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setImages([
          ...images,
          {
            uri: file.uri,
            name: `image-${Date.now()}.jpg`,
            size: file.fileSize,
          },
        ]);
        logger.info(TAG, 'Image added to request');
      }
    } catch (error) {
      logger.error(TAG, 'Image picker error', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Missing Details', 'Please describe the work you need done.');
      return;
    }

    if (description.length > VALIDATION.MAX_DESCRIPTION_LENGTH) {
      Alert.alert(
        'Too Long',
        `Your description is too long. Maximum ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters allowed.`
      );
      return;
    }

    if (isFixedPrice) {
      const priceValidation = validators.price(fixedAmount);
      if (!priceValidation.valid) {
        Alert.alert('Invalid Budget', priceValidation.error);
        return;
      }
    }

    setLoading(true);
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        Alert.alert('Not Logged In', 'Please log in to post a request.');
        navigation.navigate('Login');
        return;
      }

      logger.info(TAG, `Creating ${isFixedPrice ? 'fixed' : 'bidding'} request with ${images.length} images`);

      const requestData = {
        userId: user.id,
        userName: user.name,
        categoryId: category._id || category.id,
        categoryName: category.name,
        description: description.trim(),
        requestType: isFixedPrice ? 'fixed' : 'bidding',
        fixedAmount: isFixedPrice ? parseFloat(fixedAmount) : undefined,
        biddingEndDate: !isFixedPrice
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          : undefined,
        images: images.map((img) => img.uri),
      };

      await api.post('/service-requests', requestData);

      logger.info(TAG, 'Request created successfully');
      Alert.alert(
        'Request Posted!',
        isFixedPrice
          ? 'Your service request has been posted with a fixed budget.'
          : 'Your service request is now open for provider offers.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('MyRequests'),
          },
        ]
      );
    } catch (error: any) {
      logger.error(TAG, 'Request creation failed', error);
      const msg = error.response?.data?.message || 'Failed to create request. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create a Service Request</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryIcon}>{category.icon || '🔧'}</Text>
          <Text style={styles.categoryName}>{category.name}</Text>
        </View>

        <Text style={styles.label}>Describe the Job</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Explain what needs to be done. Add details to get better responses."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          placeholderTextColor="#999"
          editable={!loading}
        />

        <Text style={styles.charCount}>
          {description.length}/{VALIDATION.MAX_DESCRIPTION_LENGTH}
        </Text>

        {/* IMAGE UPLOAD */}
        <Text style={styles.label}>Add Photos (Optional)</Text>
        <TouchableOpacity
          style={styles.imagePickerButton}
          onPress={pickImage}
          disabled={loading || images.length >= 5}
        >
          <Text style={styles.imageIcon}>📷</Text>
          <Text style={styles.imagePickerText}>
            {images.length >= 5 ? 'Maximum 5 photos allowed' : `Upload Photos (${images.length}/5)`}
          </Text>
        </TouchableOpacity>

        {images.length > 0 && (
          <View style={styles.imagesList}>
            {images.map((image, idx) => (
              <View key={idx} style={styles.imageItem}>
                <Image source={{ uri: image.uri }} style={styles.thumbnail} />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => removeImage(idx)}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.priceTypeContainer}>
          <TouchableOpacity
            style={[styles.priceTypeButton, !isFixedPrice && styles.priceTypeActive]}
            onPress={() => setIsFixedPrice(false)}
            disabled={loading}
          >
            <Text style={styles.priceTypeIcon}>💰</Text>
            <Text style={[styles.priceTypeText, !isFixedPrice && styles.priceTypeTextActive]}>
              Receive Bids
            </Text>
            <Text style={styles.priceTypeDesc}>Providers compete with offers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.priceTypeButton, isFixedPrice && styles.priceTypeActive]}
            onPress={() => setIsFixedPrice(true)}
            disabled={loading}
          >
            <Text style={styles.priceTypeIcon}>💵</Text>
            <Text style={[styles.priceTypeText, isFixedPrice && styles.priceTypeTextActive]}>
              Set a Fixed Budget
            </Text>
            <Text style={styles.priceTypeDesc}>Post a clear price upfront</Text>
          </TouchableOpacity>
        </View>

        {isFixedPrice && (
          <View style={styles.fixedPriceContainer}>
            <Text style={styles.label}>Your Budget (PKR)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your budget (e.g., 5,000)"
              value={fixedAmount}
              onChangeText={setFixedAmount}
              keyboardType="numeric"
              placeholderTextColor="#999"
              editable={!loading}
            />
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            {isFixedPrice
              ? 'Providers can accept your price or request adjustments.'
              : 'Multiple providers will send offers. Choose the one that fits you best.'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Post Service Request</Text>
              <Text style={styles.submitButtonIcon}>✓</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// styles unchanged
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
  content: { padding: 20 },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryIcon: { fontSize: 28, marginRight: 12 },
  categoryName: { fontSize: 18, fontWeight: '700', color: '#333' },
  label: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 10 },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
    color: '#333',
  },
  charCount: { fontSize: 12, color: '#999', marginBottom: 25, textAlign: 'right' },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    marginBottom: 15,
  },
  imageIcon: { fontSize: 24, marginRight: 12 },
  imagePickerText: { fontSize: 15, color: '#333', fontWeight: '600' },
  imagesList: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, gap: 10 },
  imageItem: { position: 'relative', marginBottom: 10 },
  thumbnail: { width: 100, height: 100, borderRadius: 12 },
  removeImageBtn: { position: 'absolute', top: -8, right: -8, width: 32, height: 32, borderRadius: 16, backgroundColor: '#F44336', justifyContent: 'center', alignItems: 'center' },
  removeImageText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  priceTypeContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  priceTypeButton: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: '#E0E0E0' },
  priceTypeActive: { borderColor: '#4CAF50', backgroundColor: '#F0FDF4' },
  priceTypeIcon: { fontSize: 32, marginBottom: 8 },
  priceTypeText: { fontSize: 15, fontWeight: '700', color: '#666', marginBottom: 4 },
  priceTypeTextActive: { color: '#4CAF50' },
  priceTypeDesc: { fontSize: 12, color: '#999' },
  fixedPriceContainer: { marginBottom: 20 },
  input: { backgroundColor: '#fff', borderRadius: 16, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#E0E0E0', color: '#333' },
  infoBox: { flexDirection: 'row', backgroundColor: '#E3F2FD', borderRadius: 12, padding: 15, marginBottom: 25 },
  infoIcon: { fontSize: 20, marginRight: 10 },
  infoText: { flex: 1, fontSize: 14, color: '#1976D2', lineHeight: 20 },
  submitButton: { backgroundColor: '#4CAF50', borderRadius: 16, padding: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  buttonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: '800', marginRight: 8 },
  submitButtonIcon: { color: '#fff', fontSize: 20, fontWeight: '700' },
});
