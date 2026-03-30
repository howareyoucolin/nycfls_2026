import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Admin App</Text>
      <Text style={styles.title}>Hello World</Text>
      <Text style={styles.subtitle}>Your React Native app is ready in adminApp.</Text>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f1e8',
    paddingHorizontal: 24,
  },
  eyebrow: {
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#7f6a55',
  },
  title: {
    marginBottom: 12,
    fontSize: 40,
    fontWeight: '800',
    color: '#2e241b',
  },
  subtitle: {
    maxWidth: 280,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 26,
    color: '#5c4e42',
  },
});
