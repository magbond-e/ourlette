'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, Filter, ShieldAlert, Crown, Zap, CheckCircle2, XCircle, MoreVertical, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { AdminService } from '@/lib/services/adminService';
import { Couturier } from '@/lib/types/database';
import { useAuth } from '@/lib/context/AuthContext';

export default function AdminComptesPage() {
  const { user: currentAdmin } = useAuth();
  const [couturiers, setCouturiers] = useState<Couturier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<'tous' | 'free' | 'pro'>('tous');
  const [filterStatut, setFilterStatut] = useState<'tous' | 'actif' | 'suspendu'>('tous');

  const [selectedCouturier, setSelectedCouturier] = useState<Couturier | null>(null);
  const [actionSuccess, setActionSuccess] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await AdminService.getAllCouturiers();
    setCouturiers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTogglePlan = async (couturier: Couturier) => {
    if (!currentAdmin?.id) return;
    const targetPlan = couturier.plan === 'pro' ? 'free' : 'pro';
    const ok = await AdminService.updateCouturierPlan(currentAdmin.id, couturier.id, targetPlan, true);
    if (ok) {
      setActionSuccess(`Plan de ${couturier.nom_atelier} modifié vers ${targetPlan.toUpperCase()} (Manuel).`);
      setTimeout(() => setActionSuccess(''), 3500);
      loadData();
    }
  };

  const handleToggleStatus = async (couturier: Couturier) => {
    if (!currentAdmin?.id) return;
    const targetStatus = couturier.statut_compte === 'suspendu' ? 'actif' : 'suspendu';
    const ok = await AdminService.updateCouturierStatus(currentAdmin.id, couturier.id, targetStatus);
    if (ok) {
      setActionSuccess(`Statut de ${couturier.nom_atelier} modifié vers ${targetStatus.toUpperCase()}.`);
      setTimeout(() => setActionSuccess(''), 3500);
      loadData();
    }
  };

  const filteredCouturiers = couturiers.filter((c) => {
    const matchesSearch =
      (c.nom || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.nom_atelier || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.telephone || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlan = filterPlan === 'tous' || c.plan === filterPlan || (!c.plan && filterPlan === 'free');
    const matchesStatut = filterStatut === 'tous' || (c.statut_compte || 'actif') === filterStatut;

    return matchesSearch && matchesPlan && matchesStatut;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-sombre">Gestion des comptes couturiers</h1>
          <p className="text-xs sm:text-sm text-sombre/70 font-semibold mt-0.5">
            Consultez, modifiez les abonnements et gérez l’accès des utilisateurs
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filters and Search Bar */}
      <Card className="p-4 bg-white border-sable/60 rounded-3xl shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-sombre/40 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Rechercher nom, atelier, email, téléphone…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAFAF8] border border-sable/80 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          {/* Filter Plan */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sombre/70">Plan :</span>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#FAFAF8] border border-sable/80 rounded-2xl text-xs font-bold text-sombre focus:outline-none"
            >
              <option value="tous">Tous les plans</option>
              <option value="free">⚡ Free uniquement</option>
              <option value="pro">👑 Pro uniquement</option>
            </select>
          </div>

          {/* Filter Statut */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sombre/70">Statut :</span>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#FAFAF8] border border-sable/80 rounded-2xl text-xs font-bold text-sombre focus:outline-none"
            >
              <option value="tous">Tous les statuts</option>
              <option value="actif">🟢 Actifs</option>
              <option value="suspendu">🔴 Suspendus</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Accounts Table */}
      <Card className="p-0 bg-white border-sable/60 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16">
            <ThreadSpoolLoader label="Chargement de la liste des comptes…" />
          </div>
        ) : filteredCouturiers.length === 0 ? (
          <div className="py-16 text-center text-xs text-sombre/50">Aucun compte ne correspond à votre recherche.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="bg-[#FAFAF8] border-b border-sable/60 text-sombre/70 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Atelier & Couturier</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Localisation</th>
                  <th className="py-3.5 px-4">Plan Actuel</th>
                  <th className="py-3.5 px-4">Statut Compte</th>
                  <th className="py-3.5 px-4">Date Création</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sable/40 text-sombre">
                {filteredCouturiers.map((c) => (
                  <tr key={c.id} className="hover:bg-clair/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-sm text-sombre block">{c.nom_atelier}</span>
                        <span className="text-[11px] text-sombre/60 font-medium">{c.nom}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div>{c.email || '—'}</div>
                      <div className="text-sombre/60">{c.telephone || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {c.ville || c.pays ? `${c.ville || ''} ${c.pays ? `(${c.pays})` : ''}` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.plan === 'pro' ? (
                        <span className="inline-flex items-center gap-1 bg-gold text-sombre px-2.5 py-0.5 rounded-full font-extrabold text-[10px] shadow-xs">
                          <Crown className="w-3 h-3" /> Pro {c.plan_change_manuel ? '(Manuel)' : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-sable/40 text-sombre px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                          <Zap className="w-3 h-3" /> Free
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.statut_compte === 'suspendu' ? (
                        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full font-bold text-[10px] border border-rose-300">
                          <XCircle className="w-3 h-3 text-rose-600" /> Suspendu
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold text-[10px] border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Actif
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-sombre/70 font-mono text-[11px]">
                      {c.date_creation ? new Date(c.date_creation).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTogglePlan(c)}
                          className="px-2.5 py-1 rounded-xl text-[11px] font-bold border border-sable/80 hover:bg-sombre hover:text-white transition-colors"
                          title="Changer de plan"
                        >
                          {c.plan === 'pro' ? 'Passer Free' : 'Offrir Pro'}
                        </button>
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
                            c.statut_compte === 'suspendu'
                              ? 'border-emerald-500 text-emerald-700 hover:bg-emerald-500 hover:text-white'
                              : 'border-rose-400 text-rose-700 hover:bg-rose-500 hover:text-white'
                          }`}
                          title="Changer le statut de compte"
                        >
                          {c.statut_compte === 'suspendu' ? 'Réactiver' : 'Suspendre'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
