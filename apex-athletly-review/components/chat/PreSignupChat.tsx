/**
 * PreSignupChat - Athletly V2
 *
 * Full-screen pre-signup chat state. Shown when the user has no Supabase
 * session. Renders the same GenUI primitives the post-signup chat uses, but
 * the script is local: a welcome bubble, a single-choice card asking signup
 * vs login, and a text_input card driven by the SUBMIT_HANDLERS registry.
 *
 * No SSE here. supabase.auth.onAuthStateChange in the root layout picks up
 * the session created by signup/login and swaps to the real chat surface
 * automatically.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientHeader } from '@/components/ui/GradientHeader';
import { ChatBubble } from './ChatBubble';
import { renderUIComponent } from './genui';
import type { ChatMessage } from '@/types/chat';
import type { UIComponent } from './genui';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-pre-signup',
  role: 'assistant',
  content: 'Hi! Ich bin Athletly, dein AI-Coach. Willst du loslegen?',
  timestamp: new Date(),
  synced: false,
};

type Mode = 'choice' | 'signup' | 'login';

interface UIItem {
  readonly kind: 'ui';
  readonly id: string;
  readonly component: UIComponent;
  readonly resolved: boolean;
  readonly resolvedText?: string;
}

type Item =
  | { readonly kind: 'message'; readonly message: ChatMessage }
  | UIItem;

const CHOICE_ITEM: UIItem = {
  kind: 'ui',
  id: 'pre-signup-choice',
  resolved: false,
  component: {
    type: 'choice_single',
    id: 'pre-signup-choice',
    props: {
      question: 'Wahle einen Einstieg.',
      options: ['Account erstellen', 'Anmelden'],
    },
  },
};

const SIGNUP_FORM_ITEM: UIItem = {
  kind: 'ui',
  id: 'pre-signup-form-signup',
  resolved: false,
  component: {
    type: 'text_input',
    id: 'pre-signup-form-signup',
    props: {
      question: 'Erstelle deinen Account.',
      fields: [
        {
          name: 'email',
          label: 'E-Mail',
          placeholder: 'du@example.com',
          type: 'email',
        },
        {
          name: 'password',
          label: 'Passwort',
          placeholder: 'Mindestens 8 Zeichen',
          type: 'password',
          isPassword: true,
        },
      ],
      submit_label: 'Account erstellen',
      on_submit: 'signup',
    },
  },
};

const LOGIN_FORM_ITEM: UIItem = {
  kind: 'ui',
  id: 'pre-signup-form-login',
  resolved: false,
  component: {
    type: 'text_input',
    id: 'pre-signup-form-login',
    props: {
      question: 'Melde dich an.',
      fields: [
        {
          name: 'email',
          label: 'E-Mail',
          placeholder: 'du@example.com',
          type: 'email',
        },
        {
          name: 'password',
          label: 'Passwort',
          placeholder: 'Dein Passwort',
          type: 'password',
          isPassword: true,
        },
      ],
      submit_label: 'Anmelden',
      on_submit: 'login',
    },
  },
};

function resolvedTextForChoice(label: string): string {
  return `Gewahlt: ${label}`;
}

export function PreSignupChat() {
  const [mode, setMode] = useState<Mode>('choice');
  const [choiceItem, setChoiceItem] = useState<UIItem>(CHOICE_ITEM);
  const [formItem, setFormItem] = useState<UIItem | null>(null);

  const handleChoiceSubmit = useCallback((response: string) => {
    const isSignup = response.includes('Account erstellen');
    const isLogin = response.includes('Anmelden');
    if (!isSignup && !isLogin) return;
    const nextMode: Mode = isSignup ? 'signup' : 'login';

    setChoiceItem((prev) => ({
      ...prev,
      resolved: true,
      resolvedText: resolvedTextForChoice(isSignup ? 'Account erstellen' : 'Anmelden'),
    }));
    setFormItem(isSignup ? SIGNUP_FORM_ITEM : LOGIN_FORM_ITEM);
    setMode(nextMode);
  }, []);

  /**
   * The signup/login form runs through SUBMIT_HANDLERS, which on success
   * establishes a supabase session. The root layout's auth-state listener
   * then unmounts this whole screen, so we never see a follow-up message
   * from the handler in practice. Even so, we mark the form as resolved
   * defensively in case the handler returns a follow-up some day.
   */
  const handleFormSubmit = useCallback(
    (response: string) => {
      if (!formItem) return;
      setFormItem({
        ...formItem,
        resolved: true,
        resolvedText: response,
      });
    },
    [formItem],
  );

  const items = useMemo<ReadonlyArray<Item>>(() => {
    // FlatList is inverted, so index 0 renders at the BOTTOM of the screen.
    // Visual order top->bottom: welcome bubble, choice card, then (optionally)
    // the form. We pre-pend by reversing here.
    const list: Item[] = [];
    if (formItem) list.push(formItem);
    list.push(choiceItem);
    list.push({ kind: 'message', message: WELCOME_MESSAGE });
    return list;
  }, [choiceItem, formItem]);

  const renderItem = useCallback(
    ({ item }: { item: Item }) => {
      if (item.kind === 'message') {
        return <ChatBubble message={item.message} />;
      }

      const isChoice = item.id === choiceItem.id;
      const onSubmit = isChoice ? handleChoiceSubmit : handleFormSubmit;

      return (
        <View>
          {renderUIComponent(
            item.component,
            onSubmit,
            item.resolved,
            item.resolvedText,
          )}
        </View>
      );
    },
    [choiceItem.id, handleChoiceSubmit, handleFormSubmit],
  );

  const keyExtractor = useCallback((item: Item) => {
    if (item.kind === 'message') return item.message.id;
    return item.id;
  }, []);

  // mode is consumed via the form item; kept in state so future logic
  // (e.g. analytics) can branch on it. Suppress unused-warnings.
  void mode;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <View className="flex-1 bg-background">
        <GradientHeader title="Athletly" />
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <FlatList
            data={items as Item[]}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            inverted
            contentContainerClassName="px-4 py-2"
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

export default PreSignupChat;
