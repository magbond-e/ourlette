# Directives du Projet Ourlette

Ce document régit les règles d'architecture, de conception, de sécurité et d'implémentation pour le développement d'**Ourlette** (SaaS de gestion d'ateliers de couture africains).

---

## 1. Principes Fondamentaux & Identité du Projet

- **Produit** : Ourlette — Carnet de commandes, fiche mesures, vitrine publique et gestion d'atelier pour couturiers.
- **Mobile-first absolu** : Interfaces optimisées en priorité pour les petits écrans mobiles (360px – 400px de large). Aucun texte tronqué, aucune superposition.
- **Connexion faible & 3G** : Tout doit rester léger, rapide et résilient.
- **Typographie** : 
  - Police Display / Titres éditoriaux : `Violense` (chargée localement depuis `/public/fonts/`).
  - Police Corps & Données : `Satoshi` et `Inter` (via `next/font`).
  - Wordmark : toujours `Ourlette<span class="text-gold">.</span>` avec le point doré collé sans espace.
- **Palette Farata.net** :
  - Sombre : `#2B1215` (`sombre`)
  - Foncé : `#5F1C25` (`fonce`)
  - Accent : `#AC0C21` (`accent`)
  - Or : `#D4AF37` (`gold`)
  - Sable : `#E5C0C4` (`sable`)
  - Vert Atelier : `#2D6A4F` (`vertbouton`)
  - Fond application : `#FAFAF8`
- **UI Rules** :
  - Cartes `rounded-3xl` ou `rounded-2xl`, boutons `rounded-full` ou `rounded-2xl` tactiles (min 44px de hauteur).
  - Icônes monochromes (Lucide React) `w-5 h-5` minimum.
  - **Pas d'émojis décoratifs** dans l'UI (uniquement autorisés si purement fonctionnels, ex. lien WhatsApp).
  - Toujours prévoir `pb-28` sur les pages du dashboard pour ne pas masquer le contenu sous la barre de navigation mobile fixe en bas (`fixed bottom-0`).

---

## 2. Modèle Économique & Quotas des Plans

- **Plan Gratuit (Free)** :
  - Maximum **10 commandes actives** simultanément (non livrées).
  - Maximum **8 photos de réalisations** dans la vitrine.
  - Slug d'atelier aléatoire (`atelier-xxxxxx`).
- **Plan Pro** :
  - Tarif : **1 999 FCFA / mois** (`PRO_PLAN_PRICE = 1999` dans `@/lib/utils/planLimits.ts`).
  - Commandes illimitées (aucun blocage).
  - Photos de vitrine illimitées.
  - Slug d'atelier personnalisé (`ourlette.app/nom-atelier`).
  - Badge "Atelier Certifié" sur la vitrine.
  - Exportation fiches clients & mesures.
  - Support direct prioritaire WhatsApp 7j/7.

---

## 3. Intégration de l'API SasPay (Règles Strictes)

- Utilisez la documentation officielle : `/llms.txt` de la documentation SasPay.
- Utilisez la spécification OpenAPI : `/api-reference/openapi.json`.
- Utilisez l'URL de base `https://api.saspay.me/api/v1`.
- Effectuez toutes les requêtes SasPay depuis le backend (`lib/services/saspayService.ts`, `app/api/...`).
- Stockez la clé API dans un gestionnaire de secrets ou une variable d'environnement (`SASPAY_API_KEY`, `SASPAY_WEBHOOK_SECRET`).
- Ne placez jamais la clé API dans le frontend, les logs ou le dépôt Git.
- Envoyez la clé avec `Authorization: Bearer sk_test_...` en développement, `sk_live_...` en production.
- Montants : chaînes décimales (`"1999.00"` ou `"2500.00"`), jamais de flottants directs. Utilisez `SasPayService.formatAmount()`.
- Envoyez un `Idempotency-Key` sur `POST /payments/softpay/`, `POST /payouts/initialize/`, `POST /wallet-transfers/` et `POST /payments/{payment_id}/retry/`.
- Ne livrez un produit ou n'activez un accès que lorsque `GET /payments/{payment_id}/verify/` renvoie `SUCCESS`.
- Si `checkout_url` est non vide après un softpay ou une session checkout, redirigez le client vers cette URL.
- Vérifiez la signature des webhooks (`X-Webhook-Signature`, `X-Webhook-Timestamp`) sur le corps brut (`request.text()`), et rejetez un horodatage de plus de 300 secondes.
- Pour un retrait, whitelistez l'IP du serveur ; sinon l'appel renvoie `403 ip_not_whitelisted`.
- Gérez les réponses `401`, `403`, `404`, `409`, `422` et `429` selon l'endpoint ; en cas de `429`, espacez les appels.
- N'inventez aucun endpoint, champ, statut ou événement absent de la spécification OpenAPI.

---

## 4. Architecture Backend, Supabase & Sécurité

- **Supabase SSR & Client** : Utilisez `@supabase/ssr` pour les composants serveur et Server Actions, et le client singleton côté navigateur.
- **Sécurité RLS (Row Level Security)** : RLS activé sur toutes les tables de la base de données. Chaque utilisateur n'accède qu'à ses propres données (`auth.uid() = couturier_id`), à l'exception des vitrines publiques (`/[slug]`) en lecture seule.
- **Clé Service Role** : `SUPABASE_SERVICE_ROLE_KEY` est strictement réservée au backend (webhooks, opérations administratives isolées). Ne jamais l'exposer au client.
- **Protection des routes** : `middleware.ts` protège les espaces privés `(dashboard)`, `/pro`, et `/admin`. Redirection automatique vers `/login` si non authentifié.
- **Espace Admin** (`/admin`) : Réservé aux administrateurs validés dans la table `admins`. Gestion des comptes, bascule manuelle des plans Free ↔ Pro (`plan_change_manuel`), codes promo, KPIs financiers et journal d'audit (`admin_logs`).
- **Synchronisation Offline & DataService** : PowerSync gère la persistance locale SQLite et la synchronisation avec Supabase pour les tables `clients`, `mesures` et `commandes`. Toute interaction avec les données métier doit impérativement passer par `DataService` (`lib/services/dataService.ts`) qui gère de façon transparente la persistance locale, la file d'attente hors-ligne (`QueueItem`) et les mutations distantes Supabase.
- **Internationalisation (i18n)** : L'application est bilingue (Français / Anglais). Toutes les nouvelles chaînes d'interface doivent impérativement être déclarées dans `lib/i18n/locales/fr.ts` et `lib/i18n/locales/en.ts` et consommées via le hook `useTranslation()`. Aucun texte en dur non traduit dans les pages de bord.
- **Centre de Notifications & Alertes** : Gestion centralisée via `NotificationService` et `NotificationContext`. Les rappels de livraison, alertes de retard et relances sont programmés via `/api/cron/check-alerts`.

---

## 5. Directives de Sécurité & Audit (audit-securite.md & rapport-audit.md)

Le document de référence pour les exigences de sécurité est `.directives-IA/audit-securite.md` et les résultats d'audit validés figurent dans `rapport-audit.md` (15 vulnérabilités traitées, 100% de conformité).
Tout développement ultérieur doit continuer de respecter impérativement ces 10 invariants :

1. **Aucune fuite de secrets** : Les clés privées (`SUPABASE_SERVICE_ROLE_KEY`, `SASPAY_API_KEY`, `SASPAY_WEBHOOK_SECRET`) ne doivent **jamais** être préfixées par `NEXT_PUBLIC_`, injectées dans le bundle client, ni commitées dans Git. Ne jamais afficher de vraies valeurs de secret dans les rapports ou logs.
2. **Imperméabilité du Plan Pro** : Un couturier ne doit jamais pouvoir modifier sa propre colonne `plan` ou `statut_compte` via l'API client Supabase. Le plan Pro est activé exclusivement par le serveur après vérification positive (`GET /payments/{id}/verify/` -> `SUCCESS`).
3. **Vitrine publique sans fuite d'informations privées** : La lecture publique de la vitrine ne doit exposer ni l'email personnel, ni le numéro de téléphone privé, ni aucune donnée d'atelier non consentie.
4. **Isolation multi-tenant absolue** : Aucun couturier ne peut lire, modifier ou supprimer les clients, mesures, commandes ou photos d'un autre (`auth.uid() = couturier_id` ou `WITH CHECK`).
5. **Défense en profondeur (Beyond Middleware)** : Le `middleware.ts` n'est pas la seule barrière. Chaque Route Handler, Server Action et page d'administration doit revérifier l'identité de l'utilisateur (`supabase.auth.getUser()`) et ses permissions côté serveur.
6. **Webhooks sécurisés & idempotents** : Vérification HMAC-SHA256 sur le corps brut (`request.text()`), rejet systématique des horodatages > 300s, contrôle strict d'unicité de transaction (`transaction_id UNIQUE`) et vérification du montant attendu.
7. **Codes promo atomiques** : Décrémentation atomique en base pour éviter les utilisations concurrentes non autorisées, avec limitation de débit (rate limiting).
8. **Sécurité des uploads & médias** : Validation stricte des types MIME et tailles côté serveur. Refus catégorique des fichiers SVG (risque XSS). URLs externes validées sans risque SSRF.
9. **Hygiène de session et appareils partagés** : Effacement complet des données locales de session et de la base PowerSync locale lors de la déconnexion (`disconnectAndClear`).
10. **En-têtes de sécurité & XSS** : Configuration stricte des en-têtes HTTP (CSP, HSTS, nosniff, frame-ancestors, Permissions-Policy), pas de `dangerouslySetInnerHTML` non assaini, et échappement rigoureux dans le JSON-LD.

---

## 6. Directives Ergonomie & Expérience Couturier (Directive 6 & Bonnes Pratiques)

- **Directive 6 — Prise de mesures intégrée à la commande** : Lors de la création d'une nouvelle commande (`/commandes/nouvelle`), le couturier doit pouvoir consulter et saisir ou modifier les mesures du client sélectionné directement sur la page sans devoir naviguer vers une autre route.
- **Résilience réseau & Fallback client** : Toujours prévoir un affichage par défaut immédiat (optimistic UI ou fallback local) en cas de lenteur réseau ou chargement d'authentification asynchrone. Ne jamais bloquer l'écran avec un loader infini.
- **Onboarding Obligatoire** : Les nouveaux ateliers sont guidés par `MandatoryOnboardingModal` afin de garantir que l'identité de l'atelier, le contact WhatsApp et la devise soient convenablement renseignés avant toute prise de commande.


