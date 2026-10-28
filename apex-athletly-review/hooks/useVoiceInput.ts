/**
 * Voice Input Hook — Athletly V2
 *
 * Wraps expo-speech-recognition for speech-to-text input.
 * - German (de-DE) by default
 * - Interim results for live transcript preview
 * - Permission handling on first use
 * - Auto-cleanup on unmount
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

export interface UseVoiceInputResult {
  isListening: boolean;
  isAvailable: boolean;
  transcript: string;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  error: string | null;
}

export function useVoiceInput(): UseVoiceInputResult {
  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isListeningRef = useRef(false);

  // Check availability on mount
  useEffect(() => {
    setIsAvailable(ExpoSpeechRecognitionModule.isRecognitionAvailable());
  }, []);

  // Listen for recognition results
  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    setTranscript(text);
  });

  // Listen for errors
  useSpeechRecognitionEvent('error', (event) => {
    setError(event.error);
    setIsListening(false);
    isListeningRef.current = false;
  });

  // Listen for end
  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    isListeningRef.current = false;
  });

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript('');

    // Request permissions
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      setError('Mikrofon-Berechtigung verweigert');
      return;
    }

    ExpoSpeechRecognitionModule.start({
      lang: 'de-DE',
      interimResults: true,
      continuous: false,
    });

    setIsListening(true);
    isListeningRef.current = true;
  }, []);

  const stopListening = useCallback(async () => {
    if (isListeningRef.current) {
      ExpoSpeechRecognitionModule.stop();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isListeningRef.current) {
        ExpoSpeechRecognitionModule.abort();
      }
    };
  }, []);

  return { isListening, isAvailable, transcript, startListening, stopListening, error };
}
