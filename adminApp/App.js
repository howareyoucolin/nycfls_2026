import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { authClient } from './lib/auth-client';

const ALLOWED_EMAILS = ['howareyoucolin@gmail.com'];

export default function App() {
  const { data: session, isPending, error, refetch } = authClient.useSession();
  const user = session?.user ?? null;

  if (isPending) {
    return (
      <AppShell>
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#5d88b6" />
          <Text style={styles.stateText}>Loading Better Auth session...</Text>
        </View>
      </AppShell>
    );
  }

  if (user) {
    return (
      <AppShell>
        <DashboardCard user={user} onSignedOut={refetch} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AuthCard apiError={error?.message || ''} onAuthenticated={refetch} />
    </AppShell>
  );
}

function DashboardCard({ user, onSignedOut }) {
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const email = String(user.email || '').trim().toLowerCase();
  const isAllowed = ALLOWED_EMAILS.includes(email);

  const handleSignOut = React.useCallback(async () => {
    setIsSigningOut(true);

    try {
      await authClient.signOut();
      await onSignedOut?.();
    } finally {
      setIsSigningOut(false);
    }
  }, [onSignedOut]);

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{isAllowed ? 'VIP Admin' : 'Access Restricted'}</Text>
      <Text style={styles.title}>{isAllowed ? 'Signed in' : 'Email not allowed'}</Text>
      <Text style={styles.subtitle}>
        {isAllowed
          ? 'Better Auth email/password login is working in the native app.'
          : 'This account authenticated successfully, but it is not in the hardcoded admin list.'}
      </Text>

      <View style={styles.metaBlock}>
        <Text style={styles.metaLabel}>Name</Text>
        <Text style={styles.metaValue}>{user.name || 'No name set'}</Text>
        <Text style={styles.metaLabel}>Email</Text>
        <Text style={styles.metaValue}>{user.email || 'No email set'}</Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          isSigningOut && styles.buttonDisabled,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleSignOut}
        disabled={isSigningOut}
      >
        {isSigningOut ? (
          <ActivityIndicator color="#f7f1e8" />
        ) : (
          <Text style={styles.buttonText}>Sign out</Text>
        )}
      </Pressable>
    </View>
  );
}

function AuthCard({ apiError, onAuthenticated }) {
  const [mode, setMode] = React.useState('sign-in');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('howareyoucolin@gmail.com');
  const [password, setPassword] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isSignUp = mode === 'sign-up';

  const handleSubmit = React.useCallback(async () => {
    setIsSubmitting(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { error } = await authClient.signUp.email({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim() || 'VIP Admin',
        });

        if (error) {
          setMessage(error.message || 'Unable to sign up.');
          return;
        }
      } else {
        const { error } = await authClient.signIn.email({
          email: email.trim().toLowerCase(),
          password,
          rememberMe: true,
        });

        if (error) {
          setMessage(error.message || 'Unable to sign in.');
          return;
        }
      }

      await onAuthenticated?.();
    } finally {
      setIsSubmitting(false);
    }
  }, [email, isSignUp, name, onAuthenticated, password]);

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>VIP Admin</Text>
      <Text style={styles.title}>Better Auth</Text>
      <Text style={styles.subtitle}>
        Native email/password auth backed by a local Better Auth server.
      </Text>

      <View style={styles.segmentRow}>
        <Pressable
          style={[styles.segmentButton, !isSignUp && styles.segmentButtonActive]}
          onPress={() => setMode('sign-in')}
        >
          <Text style={[styles.segmentText, !isSignUp && styles.segmentTextActive]}>Sign in</Text>
        </Pressable>
        <Pressable
          style={[styles.segmentButton, isSignUp && styles.segmentButtonActive]}
          onPress={() => setMode('sign-up')}
        >
          <Text style={[styles.segmentText, isSignUp && styles.segmentTextActive]}>Sign up</Text>
        </Pressable>
      </View>

      {isSignUp ? (
        <Field
          label="Name"
          placeholder="Colin Admin"
          value={name}
          onChangeText={setName}
        />
      ) : null}

      <Field
        label="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="howareyoucolin@gmail.com"
        value={email}
        onChangeText={setEmail}
      />

      <Field
        label="Password"
        autoCapitalize="none"
        autoComplete="password"
        placeholder="Minimum 8 characters"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {message || apiError ? (
        <Text style={styles.errorText}>{message || apiError}</Text>
      ) : (
        <Text style={styles.helper}>
          Only `howareyoucolin@gmail.com` is allowed to register on the Better Auth server.
        </Text>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.button,
          (isSubmitting || !email.trim() || !password || (isSignUp && !name.trim())) &&
            styles.buttonDisabled,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleSubmit}
        disabled={isSubmitting || !email.trim() || !password || (isSignUp && !name.trim())}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#f7f1e8" />
        ) : (
          <Text style={styles.buttonText}>{isSignUp ? 'Create account' : 'Sign in'}</Text>
        )}
      </Pressable>
    </View>
  );
}

function Field(props) {
  const { label, ...inputProps } = props;

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#9a8f84"
        style={styles.input}
        {...inputProps}
      />
    </View>
  );
}

function AppShell({ children }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#efe6da',
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  centeredState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  card: {
    borderRadius: 28,
    backgroundColor: '#fff9f1',
    padding: 24,
    shadowColor: '#2a211a',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  eyebrow: {
    marginBottom: 12,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#7f6a55',
  },
  title: {
    marginBottom: 12,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '900',
    color: '#2d241c',
  },
  subtitle: {
    marginBottom: 20,
    fontSize: 17,
    lineHeight: 25,
    color: '#5f5246',
  },
  segmentRow: {
    marginBottom: 20,
    flexDirection: 'row',
    borderRadius: 16,
    backgroundColor: '#ece0d2',
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  segmentButtonActive: {
    backgroundColor: '#3d78b4',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5f5246',
  },
  segmentTextActive: {
    color: '#f7f1e8',
  },
  fieldBlock: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#4e4034',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d9cabb',
    borderRadius: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2d241c',
  },
  button: {
    minHeight: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3d78b4',
    paddingHorizontal: 20,
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f7f1e8',
  },
  errorText: {
    marginBottom: 16,
    color: '#b4332e',
    fontSize: 14,
    lineHeight: 20,
  },
  helper: {
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
    color: '#6a5a4d',
  },
  stateText: {
    fontSize: 16,
    color: '#5f5246',
  },
  metaBlock: {
    marginBottom: 20,
    borderRadius: 18,
    backgroundColor: '#f1e7db',
    padding: 16,
  },
  metaLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#7f6a55',
  },
  metaValue: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 21,
    color: '#2d241c',
  },
});
