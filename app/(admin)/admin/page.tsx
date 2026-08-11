'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, ShoppingBag, Globe, Crown, TrendingUp, Calendar, Zap, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { AdminService, AdminKPIs, GrowthChartPoint } from '@/lib/services/adminService';

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<AdminKPIs | null>(null);
  const [chartData, setChartData] = useState<GrowthChartPoint[]>([]);
  const [period, setPeriod] = useState<'7j' | '30j' | '90j' | 'tout'>('30j');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [kpiRes, chartRes] = await Promise.all([
      AdminService.getDashboardKPIs(),
      AdminService.getGrowthChartData(period),
    ]);
    setKpis(kpiRes);
    setChartData(chartRes);
    setLoading(false);
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !kpis) {
    return (
      <div className="py-20 flex justify-center">
        <ThreadSpoolLoader label="Chargement des statistiques admin…" size="lg" />
      </div>
    );
  }

  const totalInscriptionsPeriod = chartData.reduce((sum, p) => sum + p.inscriptions, 0);
  const totalCommandesPeriod = chartData.reduce((sum, p) => sum + p.commandes, 0);

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-sombre">Vue d'ensemble de la plateforme</h1>
          <p className="text-xs sm:text-sm text-sombre/70 font-semibold mt-0.5">
            Suivi global des utilisateurs, des abonnements et de l’activité des ateliers
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center bg-white p-1 rounded-2xl border border-sable/80 shadow-xs shrink-0">
          {(['7j', '30j', '90j', 'tout'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                period === p
                  ? 'bg-sombre text-white shadow-xs'
                  : 'text-sombre/70 hover:text-sombre hover:bg-clair'
              }`}
            >
              {p === '7j' ? '7 Jours' : p === '30j' ? '30 Jours' : p === '90j' ? '90 Jours' : 'Tout'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Couturiers */}
        <Card className="p-5 bg-white border-sable/60 rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sombre/70 uppercase tracking-wider">Couturiers Inscrits</span>
            <div className="w-9 h-9 rounded-2xl bg-accent/10 text-accent flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-display font-extrabold text-sombre font-mono">
              {kpis?.totalCouturiers || 0}
            </span>
            <div className="text-xs font-bold flex gap-1.5">
              <span className="text-gold bg-gold/10 px-2 py-0.5 rounded-full border border-gold/30">
                👑 {kpis?.proCount || 0} Pro
              </span>
              <span className="text-sombre/70 bg-sable/30 px-2 py-0.5 rounded-full">
                ⚡ {kpis?.freeCount || 0} Free
              </span>
            </div>
          </div>
          <p className="text-[11px] text-sombre/60 font-semibold border-t border-sable/40 pt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>+{kpis?.newCouturiers30d || 0} nouveaux ces 30 derniers jours</span>
          </p>
        </Card>

        {/* Card 2: Couturiers Actifs */}
        <Card className="p-5 bg-white border-sable/60 rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sombre/70 uppercase tracking-wider">Comptes Actifs</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-display font-extrabold text-sombre font-mono">
              {kpis?.activeCouturiers || 0}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {kpis?.totalCouturiers ? Math.round(((kpis.activeCouturiers / kpis.totalCouturiers) * 100)) : 0}% Activité
            </span>
          </div>
          <p className="text-[11px] text-sombre/60 font-semibold border-t border-sable/40 pt-2">
            Ateliers ayant créé au moins 1 commande
          </p>
        </Card>

        {/* Card 3: Total Commandes */}
        <Card className="p-5 bg-white border-sable/60 rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sombre/70 uppercase tracking-wider">Commandes Totales</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-display font-extrabold text-sombre font-mono">
              {kpis?.totalCommandes || 0}
            </span>
            <span className="text-xs font-bold text-sombre/70 bg-sable/40 px-2 py-0.5 rounded-full">
              Plateforme
            </span>
          </div>
          <p className="text-[11px] text-sombre/60 font-semibold border-t border-sable/40 pt-2">
            Volume global de commandes générées
          </p>
        </Card>

        {/* Card 4: Vitrines Actives */}
        <Card className="p-5 bg-white border-sable/60 rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sombre/70 uppercase tracking-wider">Vitrines Publiques</span>
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-display font-extrabold text-sombre font-mono">
              {kpis?.activeVitrines || 0}
            </span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              En ligne
            </span>
          </div>
          <p className="text-[11px] text-sombre/60 font-semibold border-t border-sable/40 pt-2">
            Pages vitrines publiques actuellement ouvertes
          </p>
        </Card>
      </div>

      {/* Activity Growth Section */}
      <Card className="p-6 bg-white border-sable/60 rounded-3xl shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-sable/40 pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            <h2 className="text-base font-bold text-sombre">Activité sur la période ({period})</h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-accent inline-block" /> Inscriptions ({totalInscriptionsPeriod})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-gold inline-block" /> Commandes ({totalCommandesPeriod})
            </span>
          </div>
        </div>

        {/* Growth Bar Chart Visualization */}
        <div className="space-y-3">
          {chartData.length === 0 ? (
            <p className="text-center py-10 text-xs text-sombre/50">Aucune donnée disponible pour cette période.</p>
          ) : (
            <div className="h-48 flex items-end gap-1.5 pt-6 pb-2 overflow-x-auto no-scrollbar">
              {chartData.map((pt, idx) => {
                const maxVal = Math.max(...chartData.map((p) => Math.max(p.inscriptions, p.commandes)), 1);
                const hInsc = Math.max(4, Math.round((pt.inscriptions / maxVal) * 160));
                const hCmd = Math.max(4, Math.round((pt.commandes / maxVal) * 160));
                return (
                  <div key={idx} className="flex-1 min-w-[20px] flex flex-col items-center gap-1 group relative">
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 bg-sombre text-white text-[10px] p-2 rounded-xl shadow-lg pointer-events-none z-20 whitespace-nowrap">
                      <p className="font-bold">{pt.date}</p>
                      <p className="text-accent">Inscriptions : {pt.inscriptions}</p>
                      <p className="text-gold">Commandes : {pt.commandes}</p>
                    </div>

                    <div className="w-full flex items-end justify-center gap-0.5 h-40">
                      <div
                        style={{ height: `${hInsc}px` }}
                        className="w-1.5 bg-accent/80 rounded-t-sm group-hover:bg-accent transition-colors"
                      />
                      <div
                        style={{ height: `${hCmd}px` }}
                        className="w-1.5 bg-gold/80 rounded-t-sm group-hover:bg-gold transition-colors"
                      />
                    </div>
                    <span className="text-[9px] text-sombre/40 font-mono truncate w-full text-center">
                      {pt.date.split('-').slice(1).join('/')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
