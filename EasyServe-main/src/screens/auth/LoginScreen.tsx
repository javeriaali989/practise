// ============================================
// screens/auth/LoginScreen.tsx - ENHANCED UX
// ============================================

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
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
import { authService } from '../../services/authService';
import { validators } from '../../utils/validators';
import { logger } from '../../utils/logger';

const TAG = 'LoginScreen';
const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'provider'>('user');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    if (!validators.email(email)) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    
    try {
      logger.info(TAG, `Login attempt as ${role}`);

      const result =
        role === 'provider'
          ? await authService.providerLogin(email.toLowerCase(), password)
          : await authService.login(email.toLowerCase(), password);

      if (result.user.role !== role) {
        Alert.alert(
          'Error',
          `This account is registered as a ${result.user.role}, not a ${role}`
        );
        setLoading(false);
        return;
      }

      logger.info(TAG, 'Login successful');

      if (result.user.role === 'provider') {
        navigation.replace('ProviderHome');
      } else {
        navigation.replace('Home');
      }
    } catch (error: any) {
      logger.error(TAG, 'Login failed', error);
      const msg = error.response?.data?.message || 'Invalid email or password';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            {/* Top Section with Gradient Effect */}
            <View style={styles.topSection}>
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Text style={styles.logoIcon}>🛠️</Text>
                </View>
                <Text style={styles.appName}>EasyServe</Text>
                <Text style={styles.tagline}>Your Service Marketplace</Text>
              </View>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <Text style={styles.welcomeText}>Welcome Back!</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>

              {/* Role Toggle */}
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[styles.roleButton, role === 'user' && styles.roleButtonSelected]}
                  onPress={() => setRole('user')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.roleIcon}>👤</Text>
                  <Text style={[styles.roleText, role === 'user' && styles.roleTextSelected]}>
                    User
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleButton, role === 'provider' && styles.roleButtonSelected]}
                  onPress={() => setRole('provider')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.roleIcon}>🔧</Text>
                  <Text style={[styles.roleText, role === 'provider' && styles.roleTextSelected]}>
                    Provider
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                  editable={!loading}
                  returnKeyType="next"
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#999"
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Text style={styles.eyeIconText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Sign In</Text>
                    <Text style={styles.loginButtonIcon}>→</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Signup Button */}
              <TouchableOpacity
                style={styles.signupButton}
                onPress={() => navigation.navigate('Signup')}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.signupButtonText}>Create New Account</Text>
                <Text style={styles.signupButtonIcon}>✨</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff',
  },
  topSection: {
    height: height * 0.32,
    backgroundColor: '#4CAF50',
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  logoContainer: { alignItems: 'center' },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoIcon: { fontSize: 48 },
  appName: { 
    fontSize: 34, 
    fontWeight: '900', 
    color: '#fff', 
    marginBottom: 6, 
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: { 
    fontSize: 14, 
    color: 'rgba(255,255,255,0.95)', 
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  formSection: { 
    flex: 1, 
    padding: 25, 
    paddingTop: 30,
  },
  welcomeText: { 
    fontSize: 26, 
    fontWeight: '800', 
    color: '#1a1a1a', 
    marginBottom: 6,
  },
  subtitle: { 
    fontSize: 15, 
    color: '#666', 
    marginBottom: 25,
    fontWeight: '500',
  },
  roleContainer: { 
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: 25,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: '#FAFAFA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roleButtonSelected: { 
    borderColor: '#4CAF50', 
    backgroundColor: '#F1F8F4',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.2,
    elevation: 4,
  },
  roleIcon: { fontSize: 22, marginRight: 7 },
  roleText: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#666',
    letterSpacing: 0.3,
  },
  roleTextSelected: { color: '#4CAF50' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  inputIcon: { fontSize: 20, marginRight: 12 },
  input: { 
    flex: 1, 
    padding: 15, 
    fontSize: 15, 
    color: '#1a1a1a',
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 8,
  },
  eyeIconText: {
    fontSize: 18,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    padding: 17,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  loginButtonDisabled: { 
    opacity: 0.6,
    shadowOpacity: 0.2,
  },
  loginButtonText: { 
    color: '#fff', 
    fontSize: 17, 
    fontWeight: '800', 
    marginRight: 8,
    letterSpacing: 0.5,
  },
  loginButtonIcon: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: '700',
  },
  divider: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 28,
  },
  dividerLine: { 
    flex: 1, 
    height: 1, 
    backgroundColor: '#E8E8E8',
  },
  dividerText: { 
    marginHorizontal: 16, 
    color: '#999', 
    fontSize: 13, 
    fontWeight: '600',
    letterSpacing: 1,
  },
  signupButton: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 14,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  signupButtonText: { 
    color: '#4CAF50', 
    fontSize: 16, 
    fontWeight: '700',
    letterSpacing: 0.3,
    marginRight: 6,
  },
  signupButtonIcon: {
    fontSize: 16,
  },
});