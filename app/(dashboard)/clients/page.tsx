'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, UserPlus, Ruler, Phone, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BasteLine } from '@/components/ui/BasteLine';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { DataService } from '@/lib/services/dataService';
import { useClients, useCommandes } from '@/lib/powersync/hooks';
import { Client, Commande } from '@/lib/types/database';
import { useAuth } from '@/lib/context/AuthContext';
import { useNotifications } from '@/lib/context/NotificationContext';

export default function ClientsPage() {
  const { user } = useAuth();
  const { createNotification } = useNotifications();
  // ── Sources de données PowerSync (réactives, offline-first) ──────────────
  // Ces listes se mettent à jour automatiquement dès qu'une écriture locale ou
  // un sync entrant touche les tables `clients` / `commandes`.
  const clients = useClients(user?.id);
  const commandes = useCommandes(user?.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNom, setNewNom] = useState('');
  const [newTelephone, setNewTelephone] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);


  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNom.trim() || !user?.id) return;

    const created = await DataService.addClient(user.id, {
      nom: newNom.trim(),
      telephone: newTelephone.trim(),
      notes: newNotes.trim(),
    });

    if (created) {
      await createNotification({
        type: 'client_created',
        category: 'client',
        priority: 'low',
        title: '👤 Nouveau client ajouté',
        message: `${created.nom} a été ajouté avec succès à votre répertoire.`,
        link: `/clients?id=${created.id}`,
        metadata: { clientId: created.id },
      });
    }

    // Plus besoin de recharger — useClients se met à jour automatiquement
    setShowAddModal(false);
    setNewNom('');
    setNewTelephone('');
    setNewNotes('');
  };

  const filteredClients = clients.filter(
    (c) =>
      c.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.telephone || '').includes(searchQuery)
  );

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] font-sans">
        <main className="max-w-4xl mx-auto px-4 pt-12">
          <ThreadSpoolLoader label="Chargement de la liste des clients…" size="lg" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-clair pb-24 font-sans">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 space-y-4">
        {/* Title & Add Button */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-sombre">Répertoire Clients</h2>
            <p className="text-xs sm:text-sm text-sombre/70 font-semibold">Fiches clients & mensurations sur-mesure</p>
          </div>
          <Button
            variant="accent"
            size="md"
            className="gap-2 shadow-couture font-extrabold"
            onClick={() => setShowAddModal(true)}
          >
            <UserPlus className="w-4 h-4" />
            <span>Nouveau client</span>
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-sombre/40" />
          <input
            type="text"
            placeholder="Rechercher un client par nom ou téléphone…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-sable rounded-xl text-sm sm:text-base text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-2 focus:ring-accent font-sans shadow-sm"
          />
        </div>

        {/* Modal: New Client */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-sombre/60 backdrop-blur-xs flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white p-6 space-y-4 shadow-xl border-accent rounded-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-bold text-sombre">Nouveau client</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-sm text-sombre/50 hover:text-sombre font-bold"
                >
                  ✕
                </button>
              </div>

              <BasteLine color="accent" />

              <form onSubmit={handleAddClient} className="space-y-4">
                <Input
                  label="Nom complet du client"
                  type="text"
                  placeholder="ex: Aïssatou Diop"
                  value={newNom}
                  onChange={(e) => setNewNom(e.target.value)}
                  required
                  autoFocus
                />

                <Input
                  label="Numéro de téléphone"
                  type="tel"
                  placeholder="ex: +221 77 987 65 43"
                  value={newTelephone}
                  onChange={(e) => setNewTelephone(e.target.value)}
                />

                <Input
                  label="Notes / Préférences (optionnel)"
                  type="text"
                  placeholder="ex: Préfère les coupes ajustées, tissu wax"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" variant="accent" size="md">
                    Enregistrer le client
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Clients List - 1 col mobile, 2 cols desktop */}
        {filteredClients.length === 0 ? (
          <Card className="py-12 text-center space-y-3 bg-white/80 border-dashed border-2 border-sable rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-clair text-sombre/50 flex items-center justify-center mx-auto">
              <Ruler className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-display font-bold text-sombre">Aucun client trouvé</h3>
              <p className="text-xs sm:text-sm text-sombre/60 font-semibold">Ajoutez un client pour enregistrer ses mesures.</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredClients.map((client) => {
              const totalCmds = commandes.filter((c) => c.client_id === client.id).length;

              return (
                <Card
                  key={client.id}
                  className="p-5 space-y-4 hover:border-accent transition-all bg-white border-sable/60 shadow-xs rounded-3xl animate-slide-up"
                >
                  <div className="flex items-start justify-between min-w-0 gap-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/clients/${client.id}`} className="font-display font-bold text-lg sm:text-xl text-sombre truncate hover:text-accent block">
                        {client.nom}
                      </Link>
                      {client.telephone ? (
                        <a
                          href={`tel:${client.telephone}`}
                          className="text-xs sm:text-sm text-accent hover:underline inline-flex items-center gap-1 font-bold mt-0.5 whitespace-nowrap shrink-0"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{client.telephone}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-sombre/50 italic block">Sans téléphone</span>
                      )}
                    </div>

                    <span className="text-xs font-extrabold text-sombre/70 bg-[#FAFAF8] px-3 py-1 rounded-full border border-sable/70 shrink-0">
                      {totalCmds} commande{totalCmds > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-sable/40">
                    <Link href={`/clients/${client.id}/mesures`} className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-accent hover:underline bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
                      <Ruler className="w-3.5 h-3.5" />
                      <span>Fiche mesures</span>
                    </Link>

                    <Link href={`/clients/${client.id}`} className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-sombre hover:text-accent hover:underline">
                      <span>Profil complet</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
