# RevenueCat Webhook Examples (Test User)

This document contains ready-to-use examples for testing the webhook with a single test user.

## Endpoint

- `POST /subscriptions/revenuecat/webhook`

## Authorization (required)

- Header: `Authorization: Bearer rc_webhook_secret_pleasury_988`
- This must match `REVENUECAT_WEBHOOK_AUTH`.

## Test User (fixed for all examples)

- `app_user_id`: `218`
- `email`: `example@example.com`
- `product_id`: `plesury.monthly`

## Common timestamps used in examples

- `purchased_at_ms`: `1769420657523`
- `expiration_at_ms`: `1772099057534`

## Active subscription events (expect `status=active`, `hasPaidSubscription=1`)

### INITIAL_PURCHASE
```json
{
  "event": {
    "type": "INITIAL_PURCHASE",
    "app_user_id": "218",
    "product_id": "plesury.monthly",
    "purchased_at_ms": 1769420657523,
    "expiration_at_ms": 1772099057534,
    "subscriber_attributes": {
      "email": { "value": "example@example.com" }
    }
  }
}
```

### RENEWAL
```json
{
  "event": {
    "type": "RENEWAL",
    "app_user_id": "218",
    "product_id": "plesury.monthly",
    "purchased_at_ms": 1769420657523,
    "expiration_at_ms": 1772099057534,
    "subscriber_attributes": {
      "email": { "value": "example@example.com" }
    }
  }
}
```

### NON_RENEWING_PURCHASE
```json
{
  "event": {
    "type": "NON_RENEWING_PURCHASE",
    "app_user_id": "218",
    "product_id": "plesury.monthly",
    "purchased_at_ms": 1769420657523,
    "expiration_at_ms": 1772099057534,
    "subscriber_attributes": {
      "email": { "value": "example@example.com" }
    }
  }
}
```

### UNCANCELLATION
```json
{
  "event": {
    "type": "UNCANCELLATION",
    "app_user_id": "218",
    "product_id": "plesury.monthly",
    "purchased_at_ms": 1769420657523,
    "expiration_at_ms": 1772099057534,
    "subscriber_attributes": {
      "email": { "value": "example@example.com" }
    }
  }
}
```

### SUBSCRIPTION_RESUMED
```json
{
  "event": {
    "type": "SUBSCRIPTION_RESUMED",
    "app_user_id": "218",
    "product_id": "plesury.monthly",
    "purchased_at_ms": 1769420657523,
    "expiration_at_ms": 1772099057534,
    "subscriber_attributes": {
      "email": { "value": "example@example.com" }
    }
  }
}
```

## Payment issue events (expect `status=past_due`, `hasPaidSubscription=0`)

### BILLING_ISSUE
```json
{
  "event": {
    "type": "BILLING_ISSUE",
    "app_user_id": "218",
    "product_id": "plesury.monthly",
    "expiration_at_ms": 1769420657523,
    "subscriber_attributes": {
      "email": { "value": "example@example.com" }
    }
  }
}
```

### SUBSCRIPTION_PAUSED
```json
{
  "event": {
    "type": "SUBSCRIPTION_PAUSED",
    "app_user_id": "218",
    "product_id": "plesury.monthly",
    "expiration_at_ms": 1769420657523,
    "subscriber_attributes": {
      "email": { "value": "example@example.com" }
    }
  }
}
```

## Cancel/expire events

### CANCELLATION (expect `status=cancelled`, `hasPaidSubscription=0`)
```json
{
  "event": {
    "type": "CANCELLATION",
    "app_user_id": "218",
    "product_id": "plesury.monthly",
    "expiration_at_ms": 1769420657523,
    "subscriber_attributes": {
      "email": { "value": "example@example.com" }
    }
  }
}
```

### PRODUCT_CHANGE (expect `status=cancelled`, `hasPaidSubscription=0`)
```json
{
  "event": {
    "type": "PRODUCT_CHANGE",
    "app_user_id": "218",
    "product_id": "plesury.monthly",
    "expiration_at_ms": 1769420657523,
    "subscriber_attributes": {
      "email": { "value": "example@example.com" }
    }
  }
}
```

### EXPIRATION (expect `status=expired`, `hasPaidSubscription=0`)
```json
{
  "event": {
    "type": "EXPIRATION",
    "app_user_id": "218",
    "product_id": "plesury.monthly",
    "expiration_at_ms": 1769420657523,
    "subscriber_attributes": {
      "email": { "value": "example@example.com" }
    }
  }
}
```

## Notes for frontend/dev testing

- Always send `Authorization: Bearer rc_webhook_secret_pleasury_988`.
- `app_user_id` is a string but should be the numeric `users.id` for test cases.
- After each call, verify:
  - `subscriptions.status`
  - `users.hasPaidSubscription`
