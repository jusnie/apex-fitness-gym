/**
 * ProductBar — Horizontal scrollable product recommendations
 *
 * Fetches product recommendations from Supabase for a given
 * plan_id or session_id, then renders them as a horizontal strip.
 * Renders nothing when there are no recommendations.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { supabase } from '@/lib/supabase';
import { ProductCard } from './ProductCard';
import type { ProductRecommendation } from '@/types/product';

interface ProductBarProps {
  readonly planId?: string;
  readonly sessionId?: string;
}

async function fetchRecommendations(
  planId?: string,
  sessionId?: string,
): Promise<readonly ProductRecommendation[]> {
  let query = supabase
    .from('product_recommendations')
    .select('id, product_name, product_description, image_url, price, currency, product_url, affiliate_url, reason, category, sport, clicked, created_at')
    .order('created_at', { ascending: false });

  if (sessionId) {
    query = query.eq('session_id', sessionId);
  } else if (planId) {
    query = query.eq('plan_id', planId);
  } else {
    return [];
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch product recommendations:', error.message);
    return [];
  }

  return data ?? [];
}

export function ProductBar({ planId, sessionId }: ProductBarProps) {
  const [products, setProducts] = useState<readonly ProductRecommendation[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await fetchRecommendations(planId, sessionId);
      if (!cancelled) {
        setProducts(result);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [planId, sessionId]);

  // Render nothing when there are no recommendations
  if (products.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Sparkles size={16} color={Colors.primary} strokeWidth={1.5} />
        <Text style={styles.title}>Empfehlungen vom Coach</Text>
      </View>

      {/* Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {products.map((product) => (
          <View key={product.id} style={styles.cardWrapper}>
            <ProductCard product={product} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingRight: 16,
  },
  cardWrapper: {
    marginRight: 12,
  },
});

export default ProductBar;
