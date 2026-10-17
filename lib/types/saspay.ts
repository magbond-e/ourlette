/**
 * SasPay TypeScript Type Definitions
 * Conformité stricte avec la spécification OpenAPI 3.1 (/api-reference/openapi.json)
 * Base URL: https://api.saspay.me/api/v1
 */

export type SasPayStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export type SasPayFeeChargeMode = 'ADD_ON' | 'DEDUCTED';

export type SasPayEventType =
  | 'transaction.created'
  | 'transaction.success'
  | 'transaction.failed'
  | 'transaction.cancelled'
  | 'settlement.requested'
  | 'settlement.approved'
  | 'settlement.success'
  | 'settlement.failed'
  | 'settlement.cancelled'
  | 'wallet_transfer.requested'
  | 'wallet_transfer.completed'
  | 'wallet_transfer.rejected'
  | 'webhook.test';

export interface SasPayCustomer {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

/**
 * Corps de requête pour POST /payments/softpay/
 */
export interface SasPaySoftpayRequest {
  merchant?: string; // UUID du marchand (optionnel avec clé API)
  amount: string; // Décimale string ex: "2500.00"
  currency: string; // ISO 3 lettres ex: "XOF"
  country: string; // ISO 2 lettres ex: "BJ"
  description?: string;
  customer: {
    email: string;
    first_name: string;
    last_name: string;
    phone: string; // ex: "+22997505050"
  };
  network: string; // ex: "mtn_bj", "moov_bj", "wave_sn", etc.
  metadata?: Record<string, any>;
  fee_charge_mode?: SasPayFeeChargeMode | null;
  preferred_gateway?: string;
  otp?: string; // OTP pré-paiement (Orange Money CI/BF)
}

/**
 * Réponse pour POST /payments/softpay/ (201 Created)
 */
export interface SasPaySoftpayResponse {
  message?: string;
  id: string; // Transaction UUID
  status: SasPayStatus;
  checkout_url?: string; // Si non vide, le client DOIT être redirigé vers cette URL
}

/**
 * Corps de requête pour POST /checkout-sessions/
 */
export interface SasPayCheckoutSessionRequest {
  amount: string; // Décimale string ex: "5000.00"
  currency: string; // ISO 3 lettres ex: "XOF"
  customer_email: string;
  customer_name: string;
  description?: string;
  country?: string; // ISO 2 lettres optionnel
  customer_phone?: string;
  return_url?: string;
  metadata?: Record<string, any>;
  fee_charge_mode?: SasPayFeeChargeMode | null;
  expires_at?: string;
}

/**
 * Réponse pour POST /checkout-sessions/ (201 Created)
 */
export interface SasPayCheckoutSessionResponse {
  id: string;
  merchant: string;
  created_by_member?: string;
  slug: string;
  checkout_url: string;
  amount: string;
  currency: string;
  description?: string;
  country?: string;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  return_url?: string;
  metadata?: Record<string, any>;
  fee_charge_mode?: SasPayFeeChargeMode | string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  expires_at?: string | null;
  transaction?: string | null;
  payment_link?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Réponse pour GET /payments/{payment_id}/verify/ (200 OK)
 */
export interface SasPayVerifyPaymentResponse {
  message?: string;
  id: string; // UUID de la transaction
  reference: string; // ex: "TXN-20260812-000512"
  merchant: string;
  customer: any;
  country: any;
  network: any;
  transaction_type: 'PAIEMENT' | string;
  flow_direction: 'INBOUND' | 'OUTBOUND' | string;
  description?: string;
  requested_amount: string; // "2500.00"
  fee_charge_mode: SasPayFeeChargeMode | string;
  client_fee?: string;
  gateway_fee?: string;
  platform_fee?: string;
  pricing_rule?: any;
  merchant_pricing_rule?: any;
  debited_amount: string; // Montant prélevé au payeur
  net_amount: string; // Montant net revenant au marchand
  currency: string;
  status: SasPayStatus;
  current_gateway?: string;
  external_reference?: string;
  ip_address?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Requête pour POST /payouts/initialize/
 */
export interface SasPayPayoutRequest {
  merchant?: string;
  amount: string; // "10000.00"
  currency: string; // "XAF"
  country: string; // "CM"
  description?: string;
  customer: {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  method: string; // Code réseau ex: "mtn_cm"
  recipient: {
    msisdn: string; // Numéro ex: "677889900"
  };
  metadata?: Record<string, any>;
  fee_charge_mode?: SasPayFeeChargeMode | null;
  preferred_gateway?: string;
}

/**
 * Réponse pour POST /payouts/initialize/ (201 Created)
 */
export interface SasPayPayoutResponse {
  message?: string;
  id: string;
}

/**
 * Requête pour POST /payments/{payment_id}/retry/
 */
export interface SasPayRetryPaymentRequest {
  methods?: string[];
  customer?: {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  preferred_gateway?: string;
}

/**
 * Réponse pour POST /payments/{payment_id}/retry/ (200 OK)
 */
export interface SasPayRetryPaymentResponse {
  message?: string;
  id: string;
  checkout_url?: string;
}

/**
 * Requête pour POST /wallet-transfers/
 */
export interface SasPayWalletTransferRequest {
  merchant?: string;
  from_country: string; // "BJ"
  to_country: string; // "CM"
  from_amount: string; // "50000.00"
}

/**
 * Réponse pour POST /wallet-transfers/ (201 Created)
 */
export interface SasPayWalletTransferResponse {
  id: string;
  reference: string;
  merchant: string;
  requested_by_member?: string | null;
  from_country: string;
  to_country: string;
  from_amount: string;
  from_currency: string;
  to_amount: string;
  to_currency: string;
  exchange_rate: string;
  fee_amount: string;
  fee_percent_applied: string;
  status: 'PENDING' | 'COMPLETED';
  approved_by_admin?: string | null;
  approved_at?: string | null;
  completed_at?: string | null;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Données envoyées dans un Webhook transaction.success
 */
export interface SasPayWebhookTransactionData {
  id: string;
  reference: string;
  type: string;
  status: SasPayStatus;
  amount: string;
  fee?: string;
  charged: string;
  net_amount: string;
  fee_charge_mode: SasPayFeeChargeMode;
  currency: string;
  country: string;
  network: string;
  msisdn?: string;
  metadata?: Record<string, any>;
}

/**
 * Structure générique d'un Webhook SasPay
 */
export interface SasPayWebhookPayload<T = any> {
  event: SasPayEventType;
  data: T;
}

/**
 * Erreurs d'API SasPay
 */
export interface SasPayApiErrorResponse {
  success?: boolean;
  error?: {
    message: string;
    code: string;
  };
  message?: string;
  code?: string | number;
  [field: string]: any;
}
