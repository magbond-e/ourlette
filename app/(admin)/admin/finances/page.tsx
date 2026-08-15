'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, DollarSign, PieChart, RefreshCw, BarChart2, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { AdminService, FinancialMetrics } from '@/lib/services/adminService';
import { formatFCFA } from '@/lib/utils/formatters';

export default function AdminFinancesPage() {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await AdminService.getFinancialMetrics();
    setMetrics(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !metrics) {
    return (
      <div className="py-20 flex justify-center">
        <ThreadSpoolLoader label="Calcul des métriques financières et de la valorisation SaaS…" size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-sombre">Finances & Analytics SaaS</h1>
          <p className="text-xs sm:text-sm text-sombre/70 font-semibold mt-0.5">
            Indicateurs clés de performance financière, revenus récurrents et métriques d’abonnements Pro
          </p>
        </div>
      </div>

      {/* Primary Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <Card className="p-5 bg-sombre text-white border-gold/40 rounded-3xl shadow-md space-y-2">
          <span className="text-xs font-bold text-sable uppercase tracking-wider">MRR (Revenu Mensuel Récurrent)</span>
          <div className="text-3xl font-display font-extrabold text-white font-mono">
            {formatFCFA(metrics?.mrr || 0)}
          </div>
          <p className="text-[11px] text-clair/70 font-medium">Exclut les plans passés en Pro manuellement</p>
        </Card>

        {/* ARR */}
        <Card className="p-5 bg-white border-sable/60 rounded-3xl shadow-xs space-y-2">
          <span className="text-xs font-bold text-sombre/70 uppercase tracking-wider">ARR (Revenu Annuel Récurrent)</span>
          <div className="text-3xl font-display font-extrabold text-sombre font-mono">
            {formatFCFA(metrics?.arr || 0)}
          </div>
          <p className="text-[11px] text-sombre/60 font-medium">Projection annuelle (MRR × 12)</p>
        </Card>

        {/* Total Revenue */}
        <Card className="p-5 bg-white border-sable/60 rounded-3xl shadow-xs space-y-2">
          <span className="text-xs font-bold text-sombre/70 uppercase tracking-wider">Revenu Total Cumulé</span>
          <div className="text-3xl font-display font-extrabold text-sombre font-mono">
            {formatFCFA(metrics?.totalRevenue || 0)}
          </div>
          <p className="text-[11px] text-sombre/60 font-medium">Historique complet des encaissements KKiaPay</p>
        </Card>

        {/* Panier Moyen */}
        <Card className="p-5 bg-white border-sable/60 rounded-3xl shadow-xs space-y-2">
          <span className="text-xs font-bold text-sombre/70 uppercase tracking-wider">Panier Moyen Pro</span>
          <div className="text-3xl font-display font-extrabold text-sombre font-mono">
            {formatFCFA(metrics?.averageBasket || 1999)}
          </div>
          <p className="text-[11px] text-sombre/60 font-medium">Tarif d'abonnement mensuel (1 999 FCFA)</p>
        </Card>
      </div>

      {/* SaaS Performance Unit Economics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Conversion Free -> Pro */}
        <Card className="p-5 bg-white border-sable/60 rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sombre/70 uppercase">Taux de Conversion Free → Pro</span>
            <PieChart className="w-5 h-5 text-accent" />
          </div>
          <div className="text-3xl font-display font-extrabold text-sombre font-mono">
            {metrics?.conversionRate || 0}%
          </div>
          <p className="text-[11px] text-sombre/60 font-semibold border-t border-sable/40 pt-2">
            Proportion de couturiers ayant activé la version Pro
          </p>
        </Card>

        {/* Churn Rate */}
        <Card className="p-5 bg-white border-sable/60 rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sombre/70 uppercase">Taux de Churn Estimé</span>
            <RefreshCw className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-display font-extrabold text-sombre font-mono">
            {metrics?.churnRate || 3.5}% / mois
          </div>
          <p className="text-[11px] text-sombre/60 font-semibold border-t border-sable/40 pt-2">
            Estimation de l'attrition mensuelle des abonnés Pro
          </p>
        </Card>

        {/* LTV */}
        <Card className="p-5 bg-white border-sable/60 rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sombre/70 uppercase">LTV Estimée (Valeur Vie Client)</span>
            <BarChart2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-display font-extrabold text-sombre font-mono">
            {formatFCFA(metrics?.estimatedLtv || 85000)}
          </div>
          <p className="text-[11px] text-sombre/60 font-semibold border-t border-sable/40 pt-2">
            Calculé sur la durée de vie moyenne par atelier (Panier ÷ Churn)
          </p>
        </Card>
      </div>

      {/* Valuation Estimate Box (PRD-Admin Section 5) */}
      <Card className="p-6 sm:p-8 bg-gradient-to-br from-sombre via-[#3D1A1E] to-sombre text-white border-2 border-gold rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center gap-3 border-b border-gold/30 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-gold/20 text-gold border border-gold/40 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-display font-bold text-white">
              Estimation de la Valeur de Revente du SaaS Ourlette
            </h2>
            <p className="text-xs text-clair/80 font-medium">
              Calculé sur un multiple standard de 3× à 5× l'ARR (Revenu Annuel Récurrent)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4 py-2">
          <div>
            <span className="text-xs text-sable font-bold uppercase tracking-wider block">Fourchette d’estimation indicative :</span>
            <div className="text-3xl sm:text-4xl font-display font-extrabold text-gold font-mono mt-1">
              {formatFCFA(metrics?.resaleValuationMin || 0)} — {formatFCFA(metrics?.resaleValuationMax || 0)}
            </div>
          </div>

          <div className="text-right text-xs text-clair/70 font-mono">
            ARR actuel : {formatFCFA(metrics?.arr || 0)}
          </div>
        </div>

        <div className="p-4 bg-white/10 rounded-2xl border border-white/15 text-xs text-clair/90 leading-relaxed font-sans space-y-1">
          <p className="font-bold text-gold flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>Note d'information importante :</span>
          </p>
          <p>
            Cette fourchette représente une estimation indicative basée sur les multiples de marché usuels (3x à 5x l'ARR) pour les SaaS bootstrappés. Une valorisation réelle dépend d'une transaction effective, du taux de croissance et du profil d'acheteur.
          </p>
        </div>
      </Card>
    </div>
  );
}
