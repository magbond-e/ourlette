import { createClient } from '../supabase/client';

/**
 * PowerSync Connector Interface & Helper Configuration
 * Prepares the application for offline-first synchronization with Supabase
 */
export interface PowerSyncConnectorConfig {
  endpoint: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export class PowerSyncService {
  private static endpoint = process.env.NEXT_PUBLIC_POWERSYNC_URL || '';

  static isConfigured(): boolean {
    return Boolean(this.endpoint && process.env.NEXT_PUBLIC_SUPABASE_URL);
  }

  static async getCredentials() {
    const supabase = createClient();
    if (!supabase) return null;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    return {
      endpoint: this.endpoint,
      token: session.access_token,
      user_id: session.user.id,
    };
  }
}
