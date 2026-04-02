import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, mapDonation, toDbDonation } from '../supabase';
import { logout } from '../supabase';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Search, List, Map as MapIcon, Loader2, Leaf, MapPin, ShoppingBag, TrendingUp, Download, AlertCircle, Navigation, Share2, AlertTriangle, X, ChevronRight, Info, Calendar, Award, LocateFixed } from 'lucide-react';
import Papa from 'papaparse';
import { WASTE_STATS } from '../constants';
import { NotificationService } from '../lib/NotificationService';
import { cn, handleFirestoreError, OperationType } from '../lib/utils';
import { Donation, PublicProfile, ImpactStats, GlobalStats, CommuneStats } from '../types';
import L from 'leaflet';

import DonationMap from '../components/home/DonationMap';
import DonationList from '../components/home/DonationList';
import DonationDetailModal from '../components/home/DonationDetailModal';
import ReportModal from '../components/home/ReportModal';
import ExportModal from '../components/home/ExportModal';
import ImpactDashboard from '../components/home/ImpactDashboard';

const HomePage = () => {
  const { user, profile, publicProfile, isQuotaExceeded } = useAuth();
  const navigate = useNavigate();
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [manualCity, setManualCity] = useState('');
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [communeStats, setCommuneStats] = useState<CommuneStats | null>(null);
  const [completedDonations, setCompletedDonations] = useState<Donation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState(10);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [isExporting, setIsExporting] = useState(false);
  const [triggerFly, setTriggerFly] = useState(0);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [impactCommune, setImpactCommune] = useState<{ nom: string; code: string } | null>(null);
  const [communeSearch, setCommuneSearch] = useState('');
  const [communeSuggestions, setCommuneSuggestions] = useState<{ nom: string; code: string }[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [reportModal, setReportModal] = useState<{ isOpen: boolean; donation: Donation; type: 'donation' | 'user' } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [exportModal, setExportModal] = useState(false);
  const [exportCommune, setExportCommune] = useState('');

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  useEffect(() => {
    if (user && userPos) {
      const ns = NotificationService.getInstance();
      const unsub = ns.listenForNewDonations(user.uid, userPos[0], userPos[1], radius);
      return () => unsub();
    }
  }, [user, userPos, radius]);

  // Chargement des donations disponibles + écoute temps réel
  useEffect(() => {
    const fetchDonations = async () => {
      const { data } = await supabase
        .from('donations')
        .select('*')
        .eq('status', 'available')
        .limit(100);
      setDonations((data || []).map(mapDonation));
    };

    fetchDonations();

    const channel = supabase
      .channel('donations-available')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, fetchDonations)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Chargement des stats globales
  useEffect(() => {
    const fetchStats = async () => {
      const { data: completed } = await supabase
        .from('donations')
        .select('weight_value, location, donor_id')
        .eq('status', 'completed')
        .neq('is_placebo', true);

      if (!completed) return;

      const totalKg = completed.reduce((sum, d) => sum + (d.weight_value || 0), 0);
      const communes = new Set(completed.map((d) => d.location?.commune).filter(Boolean));
      const donors = new Set(completed.map((d) => d.donor_id).filter(Boolean));

      setGlobalStats({
        totalKg: parseFloat(totalKg.toFixed(1)),
        totalMeals: completed.length,
        totalWater: Math.round(totalKg * 800),
        uniqueCommunes: communes.size,
        uniqueDonors: donors.size,
        totalProducts: completed.length,
      });
    };

    fetchStats();
  }, []);

  // Stats par commune
  useEffect(() => {
    if (!impactCommune) { setCommuneStats(null); return; }
    const fetchCommuneStats = async () => {
      const { data } = await supabase
        .from('donations')
        .select('weight_value')
        .eq('status', 'completed')
        .neq('is_placebo', true)
        .ilike('location->>commune', `%${impactCommune.nom}%`);

      if (!data) return;
      const totalKg = data.reduce((sum, d) => sum + (d.weight_value || 0), 0);
      setCommuneStats({
        communeName: impactCommune.nom,
        totalKg: parseFloat(totalKg.toFixed(1)),
        totalMeals: data.length,
        totalWater: Math.round(totalKg * 800),
        totalProducts: data.length,
      });
    };
    fetchCommuneStats();
  }, [impactCommune]);

  const fetchCompletedDonations = async () => {
    const { data } = await supabase
      .from('donations')
      .select('*')
      .eq('status', 'completed');
    const docs = (data || []).map(mapDonation);
    setCompletedDonations(docs);
    return docs;
  };

  const handleUpdateLocation = async (lat: number, lng: number) => {
    if (!user) return;
    await supabase
      .from('public_profiles')
      .update({ last_location: { lat, lng } })
      .eq('id', user.id);
  };

  const handleReserve = async (donation: Donation) => {
    if (!user) return;
    if (donation.donorId === user.uid) {
      setStatusMessage('Vous ne pouvez pas réserver votre propre don.');
      return;
    }
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: recentExchanges } = await supabase
        .from('donations')
        .select('id')
        .eq('donor_id', donation.donorId)
        .eq('receiver_id', user.id)
        .in('status', ['reserved', 'completed'])
        .gte('created_at', twentyFourHoursAgo.toISOString());

      if ((recentExchanges?.length || 0) >= 3) {
        setStatusMessage('Vous avez déjà réservé 3 dons chez ce voisin ces dernières 24h.');
        return;
      }

      await supabase.from('donations').update({
        status: 'reserved',
        receiver_id: user.id,
        receiver_name: user.displayName || 'Anonyme',
        participant_ids: [...(donation.sharedByUids || []), user.id, donation.donorId],
      }).eq('id', donation.id);

      const { data: convData } = await supabase.from('conversations').insert({
        donation_id: donation.id,
        participants: [donation.donorId, user.id],
        last_message: `Nouveau don réservé : ${donation.title}`,
        last_message_sender_id: user.id,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }).select().single();

      if (convData) {
        await supabase.from('messages').insert({
          conversation_id: convData.id,
          sender_id: user.id,
          text: `Bonjour ! J'aimerais récupérer votre don : ${donation.title}`,
          created_at: new Date().toISOString(),
        });
        navigate('/messages', { state: { activeChat: { id: convData.id, donationId: donation.id } } });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'donations');
      setStatusMessage('Une erreur est survenue lors de la réservation.');
    }
  };

  const openNavigation = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const handleShare = async (donation: Donation) => {
    if (!user) return;
    const shareData = {
      title: `Don de nourriture : ${donation.title}`,
      text: `Regarde ce don sur ShareUp : ${donation.description}`,
      url: `${window.location.origin}/donation/${donation.id}`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setStatusMessage('Lien copié !');
      }

      const newSharedBy = [...new Set([...(donation.sharedByUids || []), user.id])];
      await supabase.from('donations').update({ shared_by_uids: newSharedBy }).eq('id', donation.id);

      const { data: pubProfile } = await supabase
        .from('public_profiles').select('stats').eq('id', user.id).single();
      if (pubProfile) {
        const newStats = { ...pubProfile.stats, sharedCount: (pubProfile.stats?.sharedCount || 0) + 1 };
        await supabase.from('public_profiles').update({ stats: newStats }).eq('id', user.id);
      }

      const sharedIds = [...new Set([...(profile?.sharedDonationIds || []), donation.id])];
      await supabase.from('profiles').update({ shared_donation_ids: sharedIds }).eq('id', user.id);
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleDeleteDonation = async (donationId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce DÉFINITIVEMENT ?')) return;
    try {
      await supabase.from('donations').delete().eq('id', donationId);
      setSelectedDonation(null);
      const isDonor = user?.uid === donations.find(d => d.id === donationId)?.donorId;
      setStatusMessage(isAdmin && !isDonor ? "Annonce supprimée par l'administrateur." : 'Votre annonce a été supprimée définitivement.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `donations/${donationId}`);
      setStatusMessage('Erreur lors de la suppression.');
    }
  };

  const handleReport = async () => {
    if (!user || !reportModal || !reportReason.trim()) return;
    try {
      await supabase.from('reports').insert({
        type: reportModal.type,
        donation_id: reportModal.type === 'donation' ? reportModal.donation.id : null,
        reported_id: reportModal.donation.donorId,
        reporter_id: user.id,
        reason: reportReason,
        created_at: new Date().toISOString(),
      });

      const donation = reportModal.donation;
      const adminEmail = 'shareuplocal@gmail.com';
      const subject = encodeURIComponent(`[SIGNALEMENT] ${reportModal.type === 'donation' ? 'Don' : 'Utilisateur'} - ${donation.title}`);
      const body = encodeURIComponent(
        `Signalement par : ${user.displayName || 'Anonyme'}\nType : ${reportModal.type}\nDon : ${donation.title}\nRaison : ${reportReason}`
      );
      window.location.href = `mailto:${adminEmail}?subject=${subject}&body=${body}`;

      setReportModal(null);
      setReportReason('');
      setStatusMessage('Signalement enregistré.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reports');
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const realExchanges = completedDonations.filter(d => !d.isPlacebo);
      const dataToExport = exportCommune.trim()
        ? realExchanges.filter(d => d.location.commune?.toLowerCase().includes(exportCommune.toLowerCase()))
        : realExchanges;

      if (dataToExport.length === 0) { setStatusMessage('Aucune donnée trouvée.'); return; }

      const csvData = dataToExport.map(d => ({
        ID: d.id,
        Commune: d.location.commune || 'Inconnu',
        'Code Postal': d.location.postcode || 'N/A',
        Adresse: d.location.address || 'N/A',
        Latitude: d.location.lat || 'N/A',
        Longitude: d.location.lng || 'N/A',
        Produit: d.title,
        Description: d.description || '',
        Catégorie: d.category,
        Statut: d.status,
        'Poids Sauvé (kg)': (d.weightValue || 0).toFixed(2),
        'CO2 Évité (kg)': ((d.weightValue || 0) * 2.5).toFixed(2),
        'Eau Économisée (L)': ((d.weightValue || 0) * 800).toFixed(0),
        'Date de Création': d.createdAt ? new Date(d.createdAt).toLocaleDateString('fr-FR') : 'Inconnue',
        'Date de Finalisation': d.completedAt ? new Date(d.completedAt).toLocaleDateString('fr-FR') : 'Inconnue',
        'Date de Péremption': d.expiryDate || 'N/A',
        'Donneur (Nom)': d.donorName || 'Anonyme',
        'Receveur (Nom)': d.receiverName || 'Anonyme',
        'Nutri-score': d.nutriscore?.toUpperCase() || 'N/A',
        'Type de Don': d.isPlacebo ? 'Placebo' : 'Échange Réel',
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', exportCommune.trim() ? `donnees_shareup_${exportCommune.toLowerCase().replace(/\s+/g, '_')}.csv` : 'donnees_shareup_global.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
      setStatusMessage("Erreur lors de l'export.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCity.trim()) return;
    setIsSearchingCity(true);
    try {
      const resp = await fetch(`https://geo.api.gouv.fr/communes?nom=${manualCity}&limit=1&fields=centre`);
      const data = await resp.json();
      if (data && data.length > 0) {
        const { centre } = data[0];
        setUserPos([centre.coordinates[1], centre.coordinates[0]]);
        setLocationError(false);
      } else {
        setStatusMessage('Ville non trouvée.');
      }
    } catch (err) {
      setStatusMessage('Erreur lors de la recherche.');
    } finally {
      setIsSearchingCity(false);
    }
  };

  const fetchCommuneSuggestions = async (query: string) => {
    if (query.length < 2) { setCommuneSuggestions([]); return; }
    try {
      const resp = await fetch(`https://geo.api.gouv.fr/communes?nom=${query}&limit=5`);
      const data = await resp.json();
      setCommuneSuggestions(data);
    } catch (err) {
      console.error('Commune fetch error:', err);
    }
  };

  const filteredDonations = useMemo(() => {
    return donations.filter(d => {
      const matchesSearch =
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.location.commune?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!userPos) return matchesSearch;
      const dist = L.latLng(userPos).distanceTo(L.latLng(d.location.lat, d.location.lng)) / 1000;
      return matchesSearch && dist <= radius;
    });
  }, [donations, searchQuery, userPos, radius]);

  const impactStats = useMemo(() => {
    const stats = impactCommune ? communeStats : globalStats;
    const personalStats = publicProfile?.stats || { donationsCount: 0, foodSavedKg: 0 };
    return {
      global: {
        kg: Number((stats?.totalKg || 0).toFixed(1)),
        meals: stats?.totalMeals || 0,
        water: stats?.totalWater || 0,
        communes: globalStats?.uniqueCommunes || 0,
        donors: globalStats?.uniqueDonors || 0,
        products: stats?.totalProducts || 0,
      },
      personal: {
        kg: Number((personalStats.foodSavedKg || 0).toFixed(1)),
        meals: personalStats.donationsCount || 0,
        water: Math.round((personalStats.foodSavedKg || 0) * 800),
      },
    } as ImpactStats;
  }, [globalStats, communeStats, impactCommune, publicProfile]);

  const personalSavedKg = impactStats.personal.kg;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen flex flex-col relative bg-slate-50"
    >
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[8000] bg-slate-900/90 backdrop-blur-xl text-white px-8 py-4 rounded-[2rem] font-black shadow-2xl flex items-center gap-3 border border-white/10"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            {statusMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-0 left-0 right-0 z-[1000] p-6 space-y-4 pointer-events-none">
        <div className="flex gap-3 pointer-events-auto max-w-2xl mx-auto w-full">
          <div className="flex-1 glass-card rounded-[2.5rem] shadow-2xl shadow-slate-900/5 flex items-center px-6 py-5 border-white/60">
            <Search size={22} className="text-slate-400 mr-4" />
            <input
              type="text"
              placeholder="Rechercher une ville ou un produit..."
              className="flex-1 bg-transparent outline-none text-base font-bold text-slate-900 placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
              className="p-3 bg-brand-50 text-brand-600 rounded-2xl ml-3 hover:bg-brand-100 transition-colors active:scale-90"
            >
              {viewMode === 'map' ? <List size={22} /> : <MapIcon size={22} />}
            </button>
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-5 shadow-xl border-white/60 pointer-events-auto w-fit max-w-[280px] mx-auto sm:mx-0">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rayon d'action</span>
            <span className="text-sm font-black text-brand-600 bg-brand-50 px-3 py-1 rounded-full">{radius} km</span>
          </div>
          <input
            type="range" min="1" max="10" step="1" value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="w-full h-2 bg-brand-100 rounded-lg appearance-none cursor-pointer accent-brand-600"
          />
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {viewMode === 'map' ? (
            <DonationMap
              key="map"
              userPos={userPos}
              setUserPos={setUserPos}
              locationError={locationError}
              setLocationError={setLocationError}
              donations={filteredDonations}
              radius={radius}
              triggerFly={triggerFly}
              profile={publicProfile}
              onUpdateLocation={handleUpdateLocation}
              onSelectDonation={setSelectedDonation}
              onReserve={handleReserve}
              onShare={handleShare}
              onReport={(d) => setReportModal({ isOpen: true, donation: d, type: 'donation' })}
              onNavigate={openNavigation}
              manualCity={manualCity}
              setManualCity={setManualCity}
              handleCitySearch={handleCitySearch}
              isSearchingCity={isSearchingCity}
            />
          ) : (
            <DonationList
              key="list"
              donations={filteredDonations}
              userPos={userPos}
              onSelectDonation={setSelectedDonation}
              onReserve={handleReserve}
              onShare={handleShare}
              onReport={(d) => setReportModal({ isOpen: true, donation: d, type: 'donation' })}
              onNavigate={openNavigation}
            />
          )}
        </AnimatePresence>

        <div className="absolute bottom-28 right-4 z-[1000] flex flex-col gap-3">
          <button onClick={() => { fetchCompletedDonations(); setExportModal(true); }}
            className="bg-white/80 backdrop-blur-xl p-4 rounded-full shadow-2xl text-blue-600 border border-white/50 hover:scale-110 transition-transform">
            <Download size={24} />
          </button>
          <button onClick={() => setTriggerFly(prev => prev + 1)}
            className="bg-white p-4 rounded-full shadow-2xl text-blue-600 hover:scale-110 transition-transform pointer-events-auto border border-gray-100">
            <LocateFixed size={24} className="fill-blue-600" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-28 left-4 z-[1000] flex flex-col gap-3 pointer-events-none">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowImpactModal(true)}
          className="bg-white/80 backdrop-blur-xl px-5 py-3 rounded-3xl shadow-2xl border border-white/50 pointer-events-auto text-left group">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {impactCommune ? `Impact ${impactCommune.nom}` : 'Impact Global'}
              </p>
              <p className="text-xl font-black text-gray-900">{impactStats.global.kg} kg <span className="text-xs font-normal text-gray-500">sauvés</span></p>
            </div>
          </div>
        </motion.button>

        {user && personalSavedKg > 0 && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-blue-600/90 backdrop-blur-xl px-5 py-3 rounded-3xl shadow-2xl border border-white/10 pointer-events-auto">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl text-white"><Leaf size={20} /></div>
              <div>
                <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Votre Impact</p>
                <p className="text-xl font-black text-white">{impactStats.personal.kg} kg <span className="text-xs font-normal text-blue-100">sauvés</span></p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="bg-gray-900/90 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-white/10 pointer-events-auto max-w-[240px]">
          <h4 className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <AlertCircle size={12} /> Le saviez-vous ?
          </h4>
          <div className="space-y-3">
            {WASTE_STATS.map((stat, i) => (
              <div key={i} className="border-l-2 border-green-500/30 pl-3">
                <p className="text-white font-black text-lg leading-none">{stat.value}</p>
                <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DonationDetailModal
        donation={selectedDonation}
        onClose={() => setSelectedDonation(null)}
        onReserve={handleReserve}
        onNavigate={openNavigation}
        onShare={handleShare}
        onReport={(d, type) => setReportModal({ isOpen: true, donation: d, type })}
        onDelete={handleDeleteDonation}
        isAdmin={isAdmin}
        currentUser={profile}
      />
      <ReportModal
        isOpen={reportModal?.isOpen || false}
        onClose={() => setReportModal(null)}
        reportReason={reportReason}
        setReportReason={setReportReason}
        onReport={handleReport}
        type={reportModal?.type || 'donation'}
      />
      <ExportModal
        isOpen={exportModal}
        onClose={() => setExportModal(false)}
        exportCommune={exportCommune}
        setExportCommune={setExportCommune}
        onExport={handleExportCSV}
        isExporting={isExporting}
      />
      <ImpactDashboard
        isOpen={showImpactModal}
        onClose={() => setShowImpactModal(false)}
        impactCommune={impactCommune}
        setImpactCommune={setImpactCommune}
        communeSearch={communeSearch}
        setCommuneSearch={setCommuneSearch}
        communeSuggestions={communeSuggestions}
        fetchCommuneSuggestions={fetchCommuneSuggestions}
        impactStats={impactStats}
        setCommuneSuggestions={setCommuneSuggestions}
      />
    </motion.div>
  );
};

export default HomePage;
