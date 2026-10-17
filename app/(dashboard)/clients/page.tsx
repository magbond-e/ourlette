'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, UserPlus, Ruler, Phone, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BasteLine } from '@/components/ui/BasteLine';
import { DataService } from '@/lib/services/dataService';
import { useClients, useCommandes } from '@/lib/powersync/hooks';
import { useAuth } from '@/lib/context/AuthContext';
import { useLanguage } from '@/lib/i18n';
import { generateWhatsAppContactLink } from '@/lib/utils/formatters';

export default function ClientsPage() {
  const { user } = useAuth();
  const { dict, locale } = useLanguage();
  const isEn = locale === 'en';

  const clients = useClients(user?.id);
  const commandes = useCommandes(user?.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNom, setNewNom] = useState('');
  const [newTelephone, setNewTelephone] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNom.trim() || !user?.id) return;

    await DataService.addClient(user.id, {
      nom: newNom.trim(),
      telephone: newTelephone.trim(),
      notes: newNotes.trim(),
    });

    setShowAddModal(false);
    setNewNom('');
    setNewTelephone('');
    setNewNotes('');
  };

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const filteredClients = clients.filter(
    (c) =>
      c.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.telephone || '').includes(searchQuery)
  );

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredClients.length);
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-clair pb-24 font-sans">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-3 space-y-4">
        {/* Sticky Header: Title + Add Button + Search Bar */}
        <div className="sticky top-[64px] z-20 bg-clair/95 backdrop-blur-md pt-2 pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 space-y-3 border-b border-sable/40 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-display font-bold text-sombre">{dict.clients.title}</h2>
                <span className="text-xs font-extrabold bg-sombre/10 text-sombre px-2.5 py-0.5 rounded-full">
                  {clients.length}
                </span>
              </div>
              <p className="text-xs text-sombre/70 font-semibold">{dict.clients.subtitle}</p>
            </div>
            <Button
              variant="accent"
              size="md"
              className="gap-2 shadow-couture font-extrabold rounded-full px-4 text-xs sm:text-sm"
              onClick={() => setShowAddModal(true)}
            >
              <UserPlus className="w-4 h-4" />
              <span>{dict.clients.newClientButton}</span>
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-sombre/40" />
            <input
              type="text"
              placeholder={dict.clients.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-sable rounded-xl text-xs sm:text-sm text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-sans shadow-xs"
            />
          </div>
        </div>

        {/* Modal: New Client */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-sombre/60 backdrop-blur-xs flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white p-6 space-y-4 shadow-xl border-accent rounded-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-bold text-sombre">{dict.clients.modalTitle}</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-sm text-sombre/50 hover:text-sombre font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <BasteLine color="accent" />

              <form onSubmit={handleAddClient} className="space-y-4">
                <Input
                  label={dict.clients.nameLabel}
                  type="text"
                  placeholder={isEn ? 'e.g. Aïssatou Diop' : 'ex: Aïssatou Diop'}
                  value={newNom}
                  onChange={(e) => setNewNom(e.target.value)}
                  required
                  autoFocus
                />

                <Input
                  label={dict.clients.phoneLabel}
                  type="tel"
                  placeholder={isEn ? 'e.g. +221 77 987 65 43' : 'ex: +221 77 987 65 43'}
                  value={newTelephone}
                  onChange={(e) => setNewTelephone(e.target.value)}
                />

                <Input
                  label={`${dict.clients.notesLabel} (${dict.common.optional})`}
                  type="text"
                  placeholder={dict.clients.notesPlaceholder}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                    {dict.common.cancel}
                  </Button>
                  <Button type="submit" variant="accent" size="md">
                    {dict.clients.saveClientButton}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Clients List (Scrollable) */}
        {filteredClients.length === 0 ? (
          <Card className="py-12 text-center space-y-3 bg-white/80 border-dashed border-2 border-sable rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-clair text-sombre/50 flex items-center justify-center mx-auto">
              <Ruler className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-display font-bold text-sombre">{dict.clients.emptyTitle}</h3>
              <p className="text-xs sm:text-sm text-sombre/60 font-semibold">{dict.clients.emptyDesc}</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {paginatedClients.map((client) => {
                const totalCmds = commandes.filter((c) => c.client_id === client.id).length;

                return (
                  <Card
                    key={client.id}
                    className="p-4 sm:p-5 space-y-3.5 hover:border-accent/60 transition-all bg-white border-sable/70 shadow-xs rounded-3xl flex flex-col justify-between group"
                  >
                    {/* Top: Avatar + Client Info + Order Badge */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar Bubble */}
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-sombre text-gold font-display font-black text-sm sm:text-base flex items-center justify-center shrink-0 border border-gold/30 shadow-xs group-hover:scale-105 transition-transform">
                        {client.nom ? client.nom.charAt(0).toUpperCase() : 'C'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            href={`/clients/${client.id}`}
                            className="font-display font-bold text-sm sm:text-base text-sombre truncate hover:text-accent transition-colors block"
                          >
                            {client.nom}
                          </Link>
                          <span className="text-[10px] sm:text-[11px] font-black text-sombre/80 bg-[#F7F7F5] px-2 sm:px-2.5 py-0.5 rounded-full border border-sable/60 shrink-0">
                            {totalCmds} {isEn ? (totalCmds > 1 ? 'orders' : 'order') : (totalCmds > 1 ? 'commandes' : 'commande')}
                          </span>
                        </div>

                        {/* Phone & Direct Contact */}
                        <div className="flex items-center flex-wrap gap-2 mt-1 text-xs">
                          {client.telephone ? (
                            <>
                              <a
                                href={`tel:${client.telephone}`}
                                className="text-sombre/80 hover:text-accent font-bold inline-flex items-center gap-1 transition-colors text-[11px] sm:text-xs"
                              >
                                <Phone className="w-3.5 h-3.5 text-accent shrink-0" />
                                <span>{client.telephone}</span>
                              </a>
                              <a
                                href={generateWhatsAppContactLink(client.telephone, '')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/70 px-2 py-0.5 rounded-full inline-flex items-center gap-1 transition-colors"
                                title="Discuter sur WhatsApp"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>WhatsApp</span>
                              </a>
                            </>
                          ) : (
                            <span className="text-sombre/40 italic text-[11px]">{isEn ? 'No phone recorded' : 'Aucun contact'}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Strip */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-sable/40 gap-2">
                      <Link
                        href={`/clients/${client.id}/mesures`}
                        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-accent bg-accent/10 hover:bg-accent hover:text-white px-3 sm:px-3.5 py-2 rounded-xl border border-accent/20 transition-all cursor-pointer min-h-[38px]"
                      >
                        <Ruler className="w-3.5 h-3.5 shrink-0" />
                        <span>{dict.clients.cardMeasurements}</span>
                      </Link>

                      <Link
                        href={`/clients/${client.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-sombre/80 hover:text-sombre bg-[#F7F7F5] hover:bg-white border border-sable/60 px-3 sm:px-3.5 py-2 rounded-xl transition-all cursor-pointer min-h-[38px]"
                      >
                        <span>{isEn ? 'Client file' : 'Fiche client'}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-sombre/50" />
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 pb-4 border-t border-sable/40">
                <p className="text-xs text-sombre/60 font-semibold">
                  {isEn
                    ? `Showing ${startIndex + 1} to ${endIndex} of ${filteredClients.length} clients`
                    : `Affichage de ${startIndex + 1} à ${endIndex} sur ${filteredClients.length} clients`}
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-xl border border-sable/80 text-xs font-bold text-sombre bg-white hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {isEn ? 'Previous' : 'Précédent'}
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-sombre text-white shadow-xs'
                          : 'bg-white border border-sable/70 text-sombre/70 hover:bg-black/5'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-xl border border-sable/80 text-xs font-bold text-sombre bg-white hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {isEn ? 'Next' : 'Suivant'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
