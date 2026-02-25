export interface RevenueCatWebhookEvent {
  type: string;
  app_user_id?: string;
  original_app_user_id?: string;
  product_id?: string;
  /** PRODUCT_CHANGE: product after the change */
  new_product_id?: string;
  entitlement_id?: string;
  entitlement_ids?: string[];
  environment?: string;
  /**
   * Store/source of the purchase in RevenueCat (e.g. APP_STORE, PLAY_STORE, STRIPE, PADDLE).
   * Used to determine how cancellation should be handled.
   */
  store?: string;
  transaction_id?: string;
  original_transaction_id?: string;
  period_type?: string;
  purchased_at_ms?: number;
  expiration_at_ms?: number;
  purchased_at?: string;
  expiration_at?: string;
  event_timestamp_ms?: number;
  price?: number;
  price_in_usd?: number;
  currency?: string;
  subscriber_attributes?: Record<string, { value: string }>;
  /** TRANSFER: source app user id(s) */
  transferred_from?: string[];
  /** TRANSFER: destination app user id(s) */
  transferred_to?: string[];
}

export interface RevenueCatWebhookPayload {
  event: RevenueCatWebhookEvent;
  api_version?: string;
}
