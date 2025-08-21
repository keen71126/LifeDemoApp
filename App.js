import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
} from 'react-native';
import { useState, useMemo } from 'react';
import { Video } from 'expo-av';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const serverUrl = useMemo(() => {
    const envUrl = process.env.EXPO_PUBLIC_SERVER_URL;
    if (envUrl) return envUrl.replace(/\/$/, '');
    if (Platform.OS === 'android') return 'http://3.128.202.158:5000';
    return 'http://localhost:5000';
  }, []);

  const onGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      console.log('serverUrl', serverUrl);
      const res = await fetch(`${serverUrl}/render`, { method: 'POST' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Failed to render');
      setResult(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openLink = async (url) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {}
  };

  const videoUri = result?.tempUrl || result?.absoluteLocalUrl || null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Life Demo - Video Generator</Text>
      <Text style={styles.subtitle}>
        Generates a 9:16 video with diagonal "Life Demo" overlay
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={onGenerate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Generate 10s Video</Text>
        )}
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {videoUri ? (
        <View style={styles.previewContainer}>
          <Video
            style={styles.video}
            source={{ uri: videoUri }}
            useNativeControls
            resizeMode="contain"
            isLooping
          />
          <Pressable style={styles.linkBtn} onPress={() => openLink(videoUri)}>
            <Text style={styles.linkText}>Open Download Link</Text>
          </Pressable>
          {result?.absoluteLocalUrl ? (
            <Text style={styles.smallText}>
              Local: {result.absoluteLocalUrl}
            </Text>
          ) : null}
          {result?.tempUrl ? (
            <Text style={styles.smallText}>Temp: {result.tempUrl}</Text>
          ) : null}
        </View>
      ) : null}

      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    rowGap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    maxWidth: 360,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#ffd60a',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  error: {
    color: 'red',
  },
  previewContainer: {
    width: '100%',
    alignItems: 'center',
    rowGap: 8,
  },
  video: {
    width: 270,
    height: 480,
    backgroundColor: '#000',
  },
  linkBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  linkText: {
    color: '#0066cc',
    fontWeight: '600',
  },
  smallText: {
    fontSize: 12,
    color: '#333',
  },
});
