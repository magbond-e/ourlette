# Stripe Integration — Ourlette

## Contexte Projet
- **Produit** : SaaS pour couturiers (Ourlette)
- **Services Stripe** : Billing, Invoicing, Tax

## ⚠️ SÉCURITÉ — NE JAMAIS METTRE DE CLÉS ICI

Les clés API Stripe doivent être stockées **uniquement** dans `.env.local` (jamais committé).

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

Voir le fichier `.env.example` à la racine du projet pour la structure.

## Instructions d'intégration

1. Récupérer les clés depuis https://dashboard.stripe.com/apikeys
2. Les ajouter dans `.env.local` (jamais dans du code ou un fichier markdown)
3. Utiliser `process.env.STRIPE_SECRET_KEY` côté serveur uniquement
4. Utiliser `process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` côté client

## Ressources
- Documentation : https://docs.stripe.com
- MCP Server : https://mcp.stripe.com
