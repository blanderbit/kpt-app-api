export interface RevenueCatWebhookEvent {
  type: string;
  app_user_id: string;
  original_app_user_id?: string;
  product_id?: string;
  entitlement_id?: string;
  environment?: string;
  transaction_id?: string;
  original_transaction_id?: string;
  period_type?: string;
  purchased_at_ms?: number;
  expiration_at_ms?: number;
  purchased_at?: string;
  expiration_at?: string;
  price?: number;
  price_in_usd?: number;
  currency?: string;
  subscriber_attributes?: Record<string, { value: string }>;
}

export interface RevenueCatWebhookPayload {
  event: RevenueCatWebhookEvent;
}
