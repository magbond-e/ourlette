import { Couturier } from '../types/database';

const DEFAULT_COUTURIER: Couturier = {
  id: '',
  nom: 'Couturier',
  nom_atelier: 'Mon Atelier',
  email: '',
  telephone: '',
  ville: '',
  pays: '',
  langue: 'fr',
  devise: 'FCFA',
  plan: 'free',
  slug_vitrine: 'mon-atelier',
  date_creation: new Date().toISOString(),
};

/**
 * @deprecated Use DataService instead which provides user isolation and Supabase synchronization.
 */
export class MockStorageService {
  static getCouturier(): Couturier {
    return DEFAULT_COUTURIER;
  }

  static updateCouturier(data: Partial<Couturier>): Couturier {
    return { ...DEFAULT_COUTURIER, ...data };
  }

  static getClients() {
    return [];
  }

  static getClientById() {
    return undefined;
  }

  static addClient() {
    return null;
  }

  static getMesureByClientId() {
    return undefined;
  }

  static saveMesure() {
    return null;
  }

  static getCommandes() {
    return [];
  }

  static getCommandeById() {
    return undefined;
  }

  static addCommande() {
    return null;
  }

  static updateCommande() {
    return undefined;
  }

  static addVersement() {
    return undefined;
  }

  static getRealisations() {
    return [];
  }

  static addRealisation() {
    return null;
  }

  static deleteRealisation() {}
}
