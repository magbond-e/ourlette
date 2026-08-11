'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, CheckCircle2, XCircle, Percent, DollarSign, Calendar, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { AdminService } from '@/lib/services/adminService';
import { CodePromo } from '@/lib/types/database';
import { useAuth } from '@/lib/context/AuthContext';
import { formatFCFA } from '@/lib/utils/formatters';

export default function AdminCodesPromoPage() {
  const { user: currentAdmin } = useAuth();
  const [promos, setPromos] = useState<CodePromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Form State
  const [code, setCode] = useState('');
  const [type, setType] = useState<'pourcentage' | 'montant_fixe'>('pourcentage');
  const [valeur, setValeur] = useState<number>(15);
  const [maxUses, setMaxUses] = useState<string>('');
  const [expiration, setExpiration] = useState<string>('');
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await AdminService.getPromoCodes();
    setPromos(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin?.id || !code.trim()) return;

    setCreating(true);
    const created = await AdminService.createPromoCode(currentAdmin.id, {
      code: code.trim().toUpperCase(),
      type,
      valeur: Number(valeur),
      plan_concerne: 'pro',
      nombre_utilisation_max: maxUses ? parseInt(maxUses) : null,
      date_expiration: expiration ? new Date(expiration).toISOString() : undefined,
      actif: true,
    });

    if (created) {
      setActionSuccess(`Code promo ${created.code} créé avec succès !`);
      setTimeout(() => setActionSuccess(''), 3500);
      setShowModal(false);
      setCode('');
      setValeur(15);
      setMaxUses('');
      setExpiration('');
      loadData();
    } else {
      alert('Erreur lors de la création du code promo (vérifiez qu’il n’existe pas déjà).');
    }
    setCreating(false);
  };

  const handleToggleActive = async (promo: CodePromo) => {
    if (!currentAdmin?.id) return;
    const ok = await AdminService.togglePromoCode(currentAdmin.id, promo.id, !promo.actif);
    if (ok) {
      setActionSuccess(`Code ${promo.code} ${!promo.actif ? 'activé' : 'désactivé'}.`);
      setTimeout(() => setActionSuccess(''), 3000);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-sombre">Gestion des Codes Promo</h1>
          <p className="text-xs sm:text-sm text-sombre/70 font-semibold mt-0.5">
            Créez et suivez l’utilisation des remises appliquées au checkout KKiaPay
          </p>
        </div>

        <Button
          variant="gold"
          onClick={() => setShowModal(true)}
          className="rounded-full font-bold gap-2 text-xs sm:text-sm shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un Code Promo</span>
        </Button>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Codes Table */}
      <Card className="p-0 bg-white border-sable/60 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16">
            <ThreadSpoolLoader label="Chargement des codes promo…" />
          </div>
        ) : promos.length === 0 ? (
          <div className="py-16 text-center text-xs text-sombre/50">Aucun code promo configuré pour le moment.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="bg-[#FAFAF8] border-b border-sable/60 text-sombre/70 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Code Promo</th>
                  <th className="py-3.5 px-4">Type & Remise</th>
                  <th className="py-3.5 px-4">Utilisations</th>
                  <th className="py-3.5 px-4">Expiration</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sable/40 text-sombre">
                {promos.map((p) => (
                  <tr key={p.id} className="hover:bg-clair/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-extrabold text-sm text-sombre bg-sable/30 px-2.5 py-1 rounded-xl border border-sable/60">
                        {p.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-accent">
                      {p.type === 'pourcentage' ? `-${p.valeur}% sur le plan Pro` : `-${formatFCFA(p.valeur)} sur le plan Pro`}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {p.nombre_utilisation_actuel} / {p.nombre_utilisation_max || '∞'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-sombre/70">
                      {p.date_expiration ? new Date(p.date_expiration).toLocaleDateString('fr-FR') : 'Sans expiration'}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.actif ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold text-[10px] border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-bold text-[10px] border border-gray-300">
                          <XCircle className="w-3 h-3 text-gray-500" /> Inactif
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
                          p.actif
                            ? 'border-gray-300 text-gray-700 hover:bg-gray-200'
                            : 'border-emerald-500 text-emerald-700 hover:bg-emerald-500 hover:text-white'
                        }`}
                      >
                        {p.actif ? 'Désactiver' : 'Activer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-sombre/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <Card className="w-full max-w-md bg-white p-6 rounded-3xl space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-sable/40 pb-3">
              <h3 className="text-base font-bold text-sombre flex items-center gap-2">
                <Tag className="w-5 h-5 text-accent" />
                <span>Nouveau Code Promo</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-sombre/50 hover:text-sombre font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCode} className="space-y-4 font-sans text-xs">
              <Input
                label="Code Promo (Majuscules)"
                type="text"
                placeholder="ex: LANCEMENT2026"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-sombre mb-1">Type de remise</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full p-3 bg-white border border-sable/80 rounded-2xl text-xs font-bold focus:outline-none"
                  >
                    <option value="pourcentage">Pourcentage (%)</option>
                    <option value="montant_fixe">Montant Fixe (FCFA)</option>
                  </select>
                </div>

                <Input
                  label={type === 'pourcentage' ? 'Valeur (%)' : 'Valeur (FCFA)'}
                  type="number"
                  placeholder="ex: 20"
                  value={valeur}
                  onChange={(e) => setValeur(Number(e.target.value))}
                  required
                />
              </div>

              <Input
                label="Nombre d'utilisations max (Vide = Illimité)"
                type="number"
                placeholder="ex: 100"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
              />

              <Input
                label="Date d'expiration (Optionnel)"
                type="date"
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="rounded-full">
                  Annuler
                </Button>
                <Button type="submit" variant="gold" disabled={creating} className="rounded-full font-bold">
                  {creating ? 'Création…' : 'Créer le code'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
