import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { Mail, Lock, User, CreditCard, ToggleLeft as Google, Fingerprint } from 'lucide-react-native';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// Keys for secure storage
const BIOMETRIC_ENABLED_KEY = 'biometricEnabled';
const USER_EMAIL_KEY = 'userEmail';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  const demoCredentials = {
    email: 'sumitkumar042006@gmail.com',
    password: 'sumit@10042006'
  };

  // Check if device supports biometric authentication and if user has enabled it
  useEffect(() => {
    (async () => {
      // Check device compatibility
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);

      if (compatible) {
        // Check if user has enabled biometric authentication
        try {
          const storedValue = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
          setIsBiometricEnabled(storedValue === 'true');
          
          // If biometric is enabled and this is the login screen, try auto-authentication
          if (storedValue === 'true' && isLogin) {
            const savedEmail = await SecureStore.getItemAsync(USER_EMAIL_KEY);
            if (savedEmail) {
              setEmail(savedEmail);
              handleBiometricAuth(true);
            }
          }
        } catch (error) {
          console.error('Error checking biometric settings:', error);
        }
      }
    })();
  }, [isLogin]);

  const handleLogin = async () => {
    if ((email === demoCredentials.email && password === demoCredentials.password) || 
        (email === 'demo' && password === 'demo')) {
      // If login successful, ask user if they want to enable biometric for next login
      if (isBiometricSupported && !isBiometricEnabled) {
        Alert.alert(
          'Enable Biometric Login',
          'Would you like to use fingerprint for future logins?',
          [
            {
              text: 'No Thanks',
              onPress: () => router.push('/dashboard'),
              style: 'cancel',
            },
            {
              text: 'Enable',
              onPress: async () => {
                try {
                  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
                  await SecureStore.setItemAsync(USER_EMAIL_KEY, email);
                  setIsBiometricEnabled(true);
                  Alert.alert(
                    'Biometric Login Enabled',
                    'You can now use your fingerprint for future logins.',
                    [{ text: 'OK', onPress: () => router.push('/dashboard') }]
                  );
                } catch (error) {
                  console.error('Error saving biometric settings:', error);
                  router.push('/dashboard');
                }
              },
            },
          ]
        );
      } else {
        router.push('/dashboard');
      }
    } else {
      Alert.alert('Login Failed', 'Invalid email or password');
    }
  };

  const handleDemoLogin = () => {
    setEmail(demoCredentials.email);
    setPassword(demoCredentials.password);
    router.push('/dashboard');
  };

  const handleBiometricAuth = async (isAutomatic = false) => {
    try {
      // Check if biometric records exist
      const biometricRecords = await LocalAuthentication.isEnrolledAsync();
      if (!biometricRecords) {
        Alert.alert(
          'Biometric Record Not Found', 
          'Please set up your biometric authentication in device settings.'
        );
        return;
      }

      // Authenticate with biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: isLogin ? 'Login with Biometrics' : 'Register with Biometrics',
        fallbackLabel: 'Use Password',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        if (isLogin) {
          // For login, retrieve stored email if it exists
          if (isBiometricEnabled) {
            const savedEmail = await SecureStore.getItemAsync(USER_EMAIL_KEY);
            if (savedEmail && savedEmail !== email) {
              setEmail(savedEmail);
            }
          }
          router.push('/dashboard');
        } else {
          // For registration, save biometric authentication preference
          try {
            await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
            await SecureStore.setItemAsync(USER_EMAIL_KEY, email);
            setIsBiometricEnabled(true);
            Alert.alert(
              'Registration Successful', 
              'Biometric registration complete! You can now use your fingerprint for future logins.', 
              [{ text: 'OK', onPress: () => router.push('/dashboard') }]
            );
          } catch (error) {
            console.error('Error saving biometric settings:', error);
            Alert.alert(
              'Registration Successful',
              'But we could not enable biometric authentication. You can try again later in Settings.',
              [{ text: 'OK', onPress: () => router.push('/dashboard') }]
            );
          }
        }
      } else {
        // Authentication failed
        if (result.error === 'user_cancel') {
          // User canceled
          if (isAutomatic) {
            // If this was an automatic attempt, just silently fail
            console.log('Automatic biometric authentication canceled');
          }
        } else {
          Alert.alert('Authentication Failed', 'Please try again or use password');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during biometric authentication');
      console.error(error);
    }
  };

  return (
    <LinearGradient
      colors={['#1a237e', '#283593', '#3949ab']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            entering={FadeInDown.delay(200).duration(1000)}
            style={styles.logoContainer}
          >
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>HealthSync</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(400).duration(1000)}
            style={styles.formContainer}
          >
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, isLogin && styles.activeTab]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[styles.tabText, isLogin && styles.activeTabText]}>
                  Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, !isLogin && styles.activeTab]}
                onPress={() => setIsLogin(false)}
              >
                <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <User size={20} color="#6b7280" />
                <TextInput
                  placeholder="Full Name"
                  style={styles.input}
                  placeholderTextColor="#6b7280"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Mail size={20} color="#6b7280" />
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                placeholderTextColor="#6b7280"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <CreditCard size={20} color="#6b7280" />
                <TextInput
                  placeholder="Aadhaar Number"
                  style={styles.input}
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                  maxLength={12}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Lock size={20} color="#6b7280" />
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                placeholderTextColor="#6b7280"
                secureTextEntry
              />
            </View>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Lock size={20} color="#6b7280" />
                <TextInput
                  placeholder="Confirm Password"
                  style={styles.input}
                  placeholderTextColor="#6b7280"
                  secureTextEntry
                />
              </View>
            )}

            {!isLogin && (
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => setAgreed(!agreed)}
              >
                <View style={[styles.checkbox, agreed && styles.checked]} />
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.linkText}>Terms and Conditions</Text>
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.button, !isLogin && !agreed && styles.buttonDisabled]}
              disabled={!isLogin && !agreed}
              onPress={handleLogin}
            >
              <Text style={styles.buttonText}>
                {isLogin ? 'Login' : 'Register'} with Password
              </Text>
            </TouchableOpacity>

            {isBiometricSupported && (
              <TouchableOpacity 
                style={[styles.biometricButton, !isLogin && !agreed && styles.buttonDisabled]}
                onPress={() => handleBiometricAuth(false)}
                disabled={!isLogin && !agreed}
              >
                <Fingerprint size={20} color="#ffffff" />
                <Text style={styles.biometricButtonText}>
                  {isLogin ? 'Login' : 'Register'} with Biometrics
                </Text>
              </TouchableOpacity>
            )}

            {isBiometricSupported && (
              <Text style={styles.biometricInfoText}>
                {isLogin 
                  ? 'Use your fingerprint for quick and secure login' 
                  : 'Set up biometric authentication for faster login in the future'}
              </Text>
            )}

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity style={styles.socialButton}>
              <Google size={20} color="#1a237e" />
              <Text style={styles.socialButtonText}>
                Sign in with Google
              </Text>
            </TouchableOpacity>

            {isLogin ? (
              <View style={styles.bottomTextContainer}>
                <Text style={styles.bottomText}>
                  New to HealthSync?{' '}
                  <Text 
                    style={styles.linkText}
                    onPress={() => setIsLogin(false)}
                  >
                    Create an account
                  </Text>
                </Text>
                <TouchableOpacity 
                  style={styles.demoButton}
                  onPress={handleDemoLogin}
                >
                  <Text style={styles.demoButtonText}>
                    Try Demo Account
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.bottomText}>
                Already have an account?{' '}
                <Text 
                  style={styles.linkText}
                  onPress={() => setIsLogin(true)}
                >
                  Login
                </Text>
              </Text>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#1a237e',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#1f2937',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#1a237e',
    marginRight: 8,
  },
  checked: {
    backgroundColor: '#1a237e',
  },
  termsText: {
    fontSize: 14,
    color: '#4b5563',
  },
  button: {
    backgroundColor: '#1a237e',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9fa8da',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#6b7280',
    fontSize: 14,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  socialButtonText: {
    marginLeft: 8,
    color: '#1a237e',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomTextContainer: {
    alignItems: 'center',
  },
  bottomText: {
    color: '#4b5563',
    fontSize: 14,
    textAlign: 'center',
  },
  linkText: {
    color: '#1a237e',
    fontWeight: '600',
  },
  demoButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  demoButtonText: {
    color: '#1a237e',
    fontSize: 14,
    fontWeight: '600',
  },
  biometricButton: {
    flexDirection: 'row',
    backgroundColor: '#3949ab',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  biometricButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  biometricInfoText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
  },
});