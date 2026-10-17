import crypto from 'crypto';
import {
  SasPaySoftpayRequest,
  SasPaySoftpayResponse,
  SasPayCheckoutSessionRequest,
  SasPayCheckoutSessionResponse,
  SasPayVerifyPaymentResponse,
  SasPayPayoutRequest,
  SasPayPayoutResponse,
  SasPayRetryPaymentRequest,
  SasPayRetryPaymentResponse,
  SasPayWalletTransferRequest,
  SasPayWalletTransferResponse,
} from '@/lib/types/saspay';

export class SasPayError extends Error {
  public status: number;
  public code?: string;
  public details?: any;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'SasPayError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class SasPayService {
  private static readonly BASE_URL = 'https://api.saspay.me/api/v1';

  /**
   * Récupère la clé API SasPay côté serveur
   * Ne jamais exposer côté client
   */
  private static getApiKey(): string {
    const key = process.env.SASPAY_API_KEY;
    if (!key) {
      throw new SasPayError(
        'SASPAY_API_KEY non configurée dans les variables d’environnement.',
        500,
        'missing_api_key'
      );
    }
    return key.trim();
  }

  /**
   * Secret de signature des webhooks
   */
  private static getWebhookSecret(): string {
    return (process.env.SASPAY_WEBHOOK_SECRET || '').trim();
  }

  /**
   * Convertit un montant en chaîne décimale formatée selon l'OpenAPI SasPay (ex: "2500.00")
   * Empêche tout passage de flottant direct.
   */
  static formatAmount(amount: number | string): string {
    if (typeof amount === 'string') {
      const parsed = parseFloat(amount.replace(',', '.'));
      if (isNaN(parsed) || parsed < 0) {
        throw new Error(`Montant invalide pour SasPay : ${amount}`);
      }
      return parsed.toFixed(2);
    }
    if (typeof amount === 'number') {
      if (isNaN(amount) || amount < 0) {
        throw new Error(`Montant invalide pour SasPay : ${amount}`);
      }
      return amount.toFixed(2);
    }
    throw new Error(`Type de montant non supporté : ${typeof amount}`);
  }

  /**
   * Normalise un nom de pays, indicatif ou texte libre en code ISO 2 lettres requis par SasPay (ex: "Bénin" -> "BJ")
   */
  static normalizeCountryCode(countryStr?: string | null): string | undefined {
    if (!countryStr) return undefined;
    const clean = countryStr.trim().toLowerCase();

    const map: Record<string, string> = {
      'bénin': 'BJ',
      'benin': 'BJ',
      'bj': 'BJ',
      '+229': 'BJ',
      '229': 'BJ',

      'côte d\'ivoire': 'CI',
      'cote d\'ivoire': 'CI',
      'ci': 'CI',
      '+225': 'CI',
      '225': 'CI',

      'togo': 'TG',
      'tg': 'TG',
      '+228': 'TG',
      '228': 'TG',

      'sénégal': 'SN',
      'senegal': 'SN',
      'sn': 'SN',
      '+221': 'SN',
      '221': 'SN',

      'mali': 'ML',
      'ml': 'ML',
      '+223': 'ML',
      '223': 'ML',

      'burkina faso': 'BF',
      'burkina': 'BF',
      'bf': 'BF',
      '+226': 'BF',
      '226': 'BF',

      'niger': 'NE',
      'ne': 'NE',
      '+227': 'NE',
      '227': 'NE',

      'cameroun': 'CM',
      'cameroon': 'CM',
      'cm': 'CM',
      '+237': 'CM',
      '237': 'CM',

      'gabon': 'GA',
      'ga': 'GA',
      '+241': 'GA',
      '241': 'GA',

      'guinée': 'GN',
      'guinee': 'GN',
      'gn': 'GN',
      '+224': 'GN',
      '224': 'GN',

      'congo': 'CG',
      'cg': 'CG',
      '+242': 'CG',
      '242': 'CG',

      'rdc': 'CD',
      'cd': 'CD',
      '+243': 'CD',
      '243': 'CD',
    };

    if (map[clean]) return map[clean];
    if (clean.length === 2 && /^[a-z]{2}$/i.test(clean)) return clean.toUpperCase();

    // Si pays non standard, ne pas envoyer une valeur invalide qui provoquerait un rejet 400 chez SasPay
    return undefined;
  }

  /**
   * Effectue un appel API vers SasPay avec gestion uniforme des erreurs et authentification
   */
  private static async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
      body?: any;
      idempotencyKey?: string;
      retryCount?: number;
    } = {}
  ): Promise<T> {
    const apiKey = this.getApiKey();
    const url = `${this.BASE_URL}${endpoint}`;
    const method = options.method || 'GET';

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (options.body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    let response: Response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (err: any) {
      throw new SasPayError(
        `Erreur réseau lors de la communication avec SasPay : ${err.message || 'Échec de connexion'}`,
        502,
        'network_error',
        err
      );
    }

    // Gestion du Rate Limiting (429) : espacer les appels
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000;

      const currentRetries = options.retryCount || 0;
      if (currentRetries < 2) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        return this.request<T>(endpoint, {
          ...options,
          retryCount: currentRetries + 1,
        });
      }

      throw new SasPayError(
        'Limite de débit SasPay atteinte (429 Too Many Requests). Veuillez espacer les requêtes.',
        429,
        'rate_limited'
      );
    }

    let responseData: any;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      responseData = await response.json().catch(() => null);
    } else {
      const text = await response.text().catch(() => '');
      responseData = { message: text };
    }

    if (!response.ok) {
      const status = response.status;
      const errorCode = responseData?.error?.code || responseData?.code || 'api_error';
      let errorMessage = responseData?.error?.message || responseData?.message;

      // Déballer les objets d'erreur SasPay (ex: { country: ["L'object avec iso_code=..."] })
      if (!errorMessage && responseData?.error) {
        if (typeof responseData.error === 'object') {
          const details = Object.entries(responseData.error)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : JSON.stringify(v)}`)
            .join(' ; ');
          if (details) errorMessage = details;
        } else if (typeof responseData.error === 'string') {
          errorMessage = responseData.error;
        }
      }

      if (!errorMessage) {
        errorMessage = `Erreur SasPay HTTP ${status}`;
      }

      if (status === 401) {
        throw new SasPayError(
          `SasPay 401 Non autorisé : clé API invalide, manquante ou expirée.`,
          401,
          errorCode,
          responseData
        );
      }

      if (status === 403) {
        if (errorCode === 'ip_not_whitelisted') {
          throw new SasPayError(
            `SasPay 403 IP non whitelistée : l'adresse IP du serveur doit être ajoutée dans la whitelist du tableau de bord SasPay pour autoriser les retraits.`,
            403,
            errorCode,
            responseData
          );
        }
        if (errorCode === 'api_key_scope_forbidden') {
          throw new SasPayError(
            `SasPay 403 Scope insuffisant : la clé API n'a pas les droits requis (PAYIN/PAYOUT).`,
            403,
            errorCode,
            responseData
          );
        }
        throw new SasPayError(
          `SasPay 403 Accès interdit : ${errorMessage}`,
          403,
          errorCode,
          responseData
        );
      }

      if (status === 404) {
        throw new SasPayError(
          `SasPay 404 Ressource introuvable : ${errorMessage}`,
          404,
          errorCode,
          responseData
        );
      }

      if (status === 409) {
        throw new SasPayError(
          `SasPay 409 Conflit (Idempotence ou état terminal) : ${errorMessage}`,
          409,
          errorCode,
          responseData
        );
      }

      if (status === 422) {
        throw new SasPayError(
          `SasPay 422 Données non traitables (${errorCode}) : ${errorMessage}`,
          422,
          errorCode,
          responseData
        );
      }

      throw new SasPayError(
        `SasPay Erreur ${status} : ${errorMessage}`,
        status,
        errorCode,
        responseData
      );
    }

    // SasPay enveloppe ses réponses réussies dans { success: true, data: { ... }, code: 200/201 }
    const finalData = responseData?.data !== undefined ? responseData.data : responseData;
    return finalData as T;
  }

  /**
   * Initier un paiement Softpay (Push USSD ou redirection si checkout_url renseignée)
   * POST /payments/softpay/
   * Nécessite une Idempotency-Key
   */
  static async softpay(
    params: SasPaySoftpayRequest,
    idempotencyKey?: string
  ): Promise<SasPaySoftpayResponse> {
    const key = idempotencyKey || crypto.randomUUID();
    const normalizedCountry = this.normalizeCountryCode(params.country) || 'BJ';
    const formattedParams: SasPaySoftpayRequest = {
      ...params,
      country: normalizedCountry,
      amount: this.formatAmount(params.amount),
    };

    return this.request<SasPaySoftpayResponse>('/payments/softpay/', {
      method: 'POST',
      body: formattedParams,
      idempotencyKey: key,
    });
  }

  /**
   * Créer une session de Checkout hébergé
   * POST /checkout-sessions/
   */
  static async createCheckoutSession(
    params: SasPayCheckoutSessionRequest
  ): Promise<SasPayCheckoutSessionResponse> {
    const normalizedCountry = this.normalizeCountryCode(params.country);
    const formattedParams: SasPayCheckoutSessionRequest = {
      ...params,
      country: normalizedCountry,
      amount: this.formatAmount(params.amount),
    };

    return this.request<SasPayCheckoutSessionResponse>('/checkout-sessions/', {
      method: 'POST',
      body: formattedParams,
    });
  }

  /**
   * Vérifier le statut réel d'un paiement côté passerelle
   * GET /payments/{payment_id}/verify/
   * Seul le statut "SUCCESS" autorise la livraison d'un produit ou activation de compte.
   */
  static async verifyPayment(paymentId: string): Promise<SasPayVerifyPaymentResponse> {
    if (!paymentId) {
      throw new SasPayError('payment_id requis pour vérifier le paiement.', 400, 'missing_payment_id');
    }
    return this.request<SasPayVerifyPaymentResponse>(`/payments/${encodeURIComponent(paymentId)}/verify/`, {
      method: 'GET',
    });
  }

  /**
   * Confirmer un paiement par OTP post-push
   * POST /payments/{payment_id}/confirm-otp/
   */
  static async confirmOtp(
    paymentId: string,
    otp: string
  ): Promise<{ message: string; id: string; status: string }> {
    return this.request<{ message: string; id: string; status: string }>(
      `/payments/${encodeURIComponent(paymentId)}/confirm-otp/`,
      {
        method: 'POST',
        body: { otp },
      }
    );
  }

  /**
   * Rejouer un paiement échoué sans recréer de nouvelle transaction
   * POST /payments/{payment_id}/retry/
   * Nécessite une Idempotency-Key
   */
  static async retryPayment(
    paymentId: string,
    params?: SasPayRetryPaymentRequest,
    idempotencyKey?: string
  ): Promise<SasPayRetryPaymentResponse> {
    const key = idempotencyKey || crypto.randomUUID();
    return this.request<SasPayRetryPaymentResponse>(
      `/payments/${encodeURIComponent(paymentId)}/retry/`,
      {
        method: 'POST',
        body: params || {},
        idempotencyKey: key,
      }
    );
  }

  /**
   * Initier un Payout (retrait / versement à un bénéficiaire)
   * POST /payouts/initialize/
   * Nécessite une Idempotency-Key et une IP de serveur whitelistée.
   */
  static async initializePayout(
    params: SasPayPayoutRequest,
    idempotencyKey?: string
  ): Promise<SasPayPayoutResponse> {
    const key = idempotencyKey || crypto.randomUUID();
    const formattedParams: SasPayPayoutRequest = {
      ...params,
      amount: this.formatAmount(params.amount),
    };

    return this.request<SasPayPayoutResponse>('/payouts/initialize/', {
      method: 'POST',
      body: formattedParams,
      idempotencyKey: key,
    });
  }

  /**
   * Vérifier un Payout
   * GET /payouts/{payout_id}/verify/
   */
  static async verifyPayout(payoutId: string): Promise<any> {
    return this.request<any>(`/payouts/${encodeURIComponent(payoutId)}/verify/`, {
      method: 'GET',
    });
  }

  /**
   * Initier un transfert interwallet
   * POST /wallet-transfers/
   * Nécessite une Idempotency-Key
   */
  static async initializeWalletTransfer(
    params: SasPayWalletTransferRequest,
    idempotencyKey?: string
  ): Promise<SasPayWalletTransferResponse> {
    const key = idempotencyKey || crypto.randomUUID();
    const formattedParams: SasPayWalletTransferRequest = {
      ...params,
      from_amount: this.formatAmount(params.from_amount),
    };

    return this.request<SasPayWalletTransferResponse>('/wallet-transfers/', {
      method: 'POST',
      body: formattedParams,
      idempotencyKey: key,
    });
  }

  /**
   * Vérification cryptographique de la signature des Webhooks SasPay
   * - Vérifie l'âge de l'horodatage (rejette si > 300 secondes)
   * - Vérifie la signature HMAC SHA-256 sur le corps BRUT (`${timestamp}.${rawBody}`)
   * - Comparaison en temps constant (crypto.timingSafeEqual)
   */
  static verifyWebhookSignature(
    rawBody: string | Buffer,
    signatureHeader: string | null,
    timestampHeader: string | null,
    customSecret?: string
  ): { valid: boolean; reason?: string } {
    const secret = customSecret || this.getWebhookSecret();

    if (!secret) {
      return { valid: false, reason: 'Secret de webhook SasPay non configuré' };
    }
    if (!signatureHeader) {
      return { valid: false, reason: 'Header X-Webhook-Signature manquant' };
    }
    if (!timestampHeader) {
      return { valid: false, reason: 'Header X-Webhook-Timestamp manquant' };
    }

    const timestampNum = parseInt(timestampHeader, 10);
    if (isNaN(timestampNum)) {
      return { valid: false, reason: 'Horodatage invalide' };
    }

    // 1. Contrôle de l'âge : tolérance 300 secondes (5 minutes)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestampNum) > 300) {
      return { valid: false, reason: 'Horodatage expiré (dépassé de plus de 300 secondes)' };
    }

    // 2. Calcul du HMAC SHA-256 sur `${timestamp}.${rawBody}`
    const rawBodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
    const signedData = Buffer.concat([Buffer.from(`${timestampHeader}.`, 'utf8'), rawBodyBuffer]);

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedData)
      .digest('hex')
      .toLowerCase();

    const receivedSignature = signatureHeader.trim().toLowerCase();

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const receivedBuffer = Buffer.from(receivedSignature, 'utf8');

    if (expectedBuffer.length !== receivedBuffer.length) {
      return { valid: false, reason: 'Longueur de signature incorrecte' };
    }

    // Comparaison en temps constant
    const isMatching = crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
    if (!isMatching) {
      return { valid: false, reason: 'Signature HMAC invalide' };
    }

    return { valid: true };
  }
}
