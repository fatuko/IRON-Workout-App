import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return <ScrollView contentContainerStyle={styles.page}>
    <Text style={styles.eyebrow}>IRON</Text>
    <Text style={styles.title}>Your next session starts here.</Text>
    <Text style={styles.body}>Build a split, log your sets, and track progress on the exact equipment you use.</Text>
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Next workout</Text>
      <Text style={styles.body}>Upper A · Starter preview</Text>
      <Link href="/workout" style={styles.link}>Open workout →</Link>
    </View>
    <Link href="/splits" style={styles.link}>Set up your split →</Link>
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { padding: 24, gap: 16 },
  eyebrow: { color: '#e6b75c', fontWeight: '800', letterSpacing: 3 },
  title: { color: '#f5f7fa', fontSize: 32, fontWeight: '800' },
  body: { color: '#aeb8c6', fontSize: 16, lineHeight: 23 },
  card: { backgroundColor: '#191e27', padding: 20, borderRadius: 16, gap: 10, marginTop: 12 },
  cardTitle: { color: '#f5f7fa', fontSize: 20, fontWeight: '700' },
  link: { color: '#e6b75c', fontSize: 16, fontWeight: '700' },
});
