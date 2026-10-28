import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Animated, Text, View, Pressable } from 'react-native';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
  action?: { label: string; onPress: () => void };
}

interface ToastContextValue {
  show: (type: ToastType, message: string, action?: ToastMessage['action']) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const ICON_MAP: Record<ToastType, LucideIcon> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLOR_MAP: Record<ToastType, string> = {
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#2563EB',
};

const AUTO_DISMISS_MS = 3000;

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const Icon = ICON_MAP[toast.type];
  const color = COLOR_MAP[toast.type];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 100, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(onDismiss);
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [translateY, opacity, onDismiss]);

  return (
    <Animated.View
      className="rounded-xl px-4 py-3.5 mx-4 mb-2 flex-row items-center"
      style={[
        {
          backgroundColor: '#0F172A',
          transform: [{ translateY }],
          opacity,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 6,
        },
      ]}
    >
      <Icon size={20} color={color} strokeWidth={2} />
      <Text className="text-sm flex-1 ml-3" style={{ color: '#FFFFFF' }}>{toast.message}</Text>
      {toast.action && (
        <Pressable onPress={toast.action.onPress} className="ml-2">
          <Text className="text-sm font-medium" style={{ color: '#2563EB' }}>{toast.action.label}</Text>
        </Pressable>
      )}
      <Pressable onPress={onDismiss} className="ml-2 p-1">
        <X size={16} color="#94A3B8" strokeWidth={2} />
      </Pressable>
    </Animated.View>
  );
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = useCallback<ToastContextValue['show']>((type, message, action) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, type, message, action }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View className="absolute bottom-16 left-0 right-0" pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
