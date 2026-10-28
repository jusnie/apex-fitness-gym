/**
 * ProductCard — Compact product recommendation card
 *
 * Displays a coach-recommended product with image (or category icon fallback),
 * name, price, reason, and a CTA button that opens the product URL.
 * Tracks clicks via Supabase update.
 */

import React, { useCallback, useState } from 'react';
import { View, Text, Image, Pressable, Linking, StyleSheet } from 'react-native';
import {
  ShoppingBag,
  Footprints,
  Dumbbell,
  Watch,
  Shirt,
  Apple,
  ExternalLink,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { supabase } from '@/lib/supabase';
import type { ProductRecommendation } from '@/types/product';

interface ProductCardProps {
  readonly product: ProductRecommendation;
}

const CATEGORY_ICONS: Readonly<Record<string, LucideIcon>> = {
  shoes: Footprints,
  equipment: Dumbbell,
  watch: Watch,
  wearable: Watch,
  clothing: Shirt,
  apparel: Shirt,
  nutrition: Apple,
};

function getCategoryIcon(category?: string): LucideIcon {
  if (!category) return ShoppingBag;
  const normalized = category.toLowerCase();
  return CATEGORY_ICONS[normalized] ?? ShoppingBag;
}

function formatPrice(price: number, currency: string): string {
  const symbol = currency === 'EUR' ? '\u20AC' : currency === 'USD' ? '$' : currency;
  return `${price.toFixed(2)} ${symbol}`;
}

async function trackClick(productId: string): Promise<void> {
  const { error } = await supabase
    .from('product_recommendations')
    .update({ clicked: true })
    .eq('id', productId);

  if (error) {
    console.error('Failed to track product click:', error.message);
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const productUrl = product.affiliate_url ?? product.product_url;
  const hasUrl = Boolean(productUrl);
  const CategoryIcon = getCategoryIcon(product.category);

  const handlePress = useCallback(async () => {
    if (!productUrl) return;

    trackClick(product.id);

    try {
      const supported = await Linking.canOpenURL(productUrl);
      if (supported) {
        await Linking.openURL(productUrl);
      }
    } catch (err) {
      console.error('Failed to open product URL:', err);
    }
  }, [productUrl, product.id]);

  const showImage = Boolean(product.image_url) && !imageError;

  return (
    <Pressable
      onPress={hasUrl ? handlePress : undefined}
      style={({ pressed }) => [
        styles.card,
        pressed && hasUrl ? styles.cardPressed : undefined,
      ]}
    >
      {/* Product Image or Category Icon */}
      <View style={styles.imageContainer}>
        {showImage ? (
          <Image
            source={{ uri: product.image_url }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.iconFallback}>
            <CategoryIcon size={24} color={Colors.primary} strokeWidth={1.5} />
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.product_name}
        </Text>

        {product.price !== undefined && product.price > 0 && (
          <Text style={styles.price}>
            {formatPrice(product.price, product.currency)}
          </Text>
        )}

        <Text style={styles.reason} numberOfLines={2}>
          {product.reason}
        </Text>
      </View>

      {/* CTA */}
      {hasUrl && (
        <View style={styles.cta}>
          <View style={styles.ctaButton}>
            <Text style={styles.ctaText}>Ansehen</Text>
            <ExternalLink size={12} color={Colors.surface} strokeWidth={2} />
          </View>
        </View>
      )}
    </Pressable>
  );
}

const CARD_WIDTH = 200;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.92,
  },
  imageContainer: {
    width: CARD_WIDTH,
    height: 120,
    backgroundColor: Colors.surfaceNested,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  iconFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryUltraLight,
  },
  info: {
    padding: 12,
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
  reason: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  cta: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.ctaBg,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.surface,
  },
});

export default ProductCard;
