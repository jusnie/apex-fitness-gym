/**
 * Product Types — Athletly V2
 *
 * Types for agent-driven product recommendations stored in
 * the `product_recommendations` Supabase table.
 */

export interface ProductRecommendation {
  readonly id: string;
  readonly product_name: string;
  readonly product_description?: string;
  readonly image_url?: string;
  readonly price?: number;
  readonly currency: string;
  readonly product_url?: string;
  readonly affiliate_url?: string;
  readonly reason: string;
  readonly category?: string;
  readonly sport?: string;
  readonly clicked: boolean;
  readonly created_at: string;
}
