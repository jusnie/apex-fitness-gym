/**
 * ErrorBoundary — Athletly V2
 *
 * Class component that catches JavaScript errors in child components,
 * logs them, and shows a fallback UI with a retry button.
 * German user-facing strings.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { Colors } from '@/lib/colors';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View
          className="flex-1 items-center justify-center px-8"
          style={{ backgroundColor: Colors.background }}
        >
          <AlertTriangle size={48} color={Colors.error} />
          <Text className="text-text-primary text-lg font-semibold mt-4">
            Etwas ist schiefgelaufen
          </Text>
          <Text className="text-text-secondary text-sm text-center mt-2">
            {this.state.error?.message}
          </Text>
          <Pressable
            onPress={this.handleReset}
            className="mt-6 rounded-xl px-6 py-3"
            style={{ backgroundColor: Colors.primary }}
          >
            <Text className="text-white font-semibold">Erneut versuchen</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
