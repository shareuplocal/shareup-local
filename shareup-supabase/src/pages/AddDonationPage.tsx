import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Barcode, MapPin, Calendar, Info, Save, X, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import BarcodeScanner from '../components/BarcodeScanner';
import { cn, handleFirestoreError, OperationType } from '../lib/utils';
import { ChatService } from '../lib/ChatService';

const AddDonationPage = () => {
  const { user, isQuotaExceeded } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [offLoading, setOffLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Fruits & Légumes',
    expiryDate: '',
    barcode: '',
    weight: '',
    weightValue: 0,
    nutriscore: '',
    ecoscore: '',
    novaGroup: null as number | null,
    allergens: [] as string[],
    composition: '',
    nutriments: {} as Record<string, number | string | boolean | null>,
    imageUrl: '',
  });

  const categories = [
    'Fruits & Légumes', 'Produits Laitiers', 'Boulangerie', 'Épicerie',
    'Boissons', 'Plats Cuisinés', 'Viandes & Poissons', 'Surgelés',
    'Hygiène & Beauté', 'Entretien', 'Autre',
  ];

  const handleScan = async (barcode: string) => {
    setScanning(false);
    setOffLoading(true);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();
      if (data.status === 1) {
        const p = data.product;

        let weightVal = 0;
        const qVal = parseFloat(p.product_quantity);
        const qUnit = (p.product_quantity_unit || '').toLowerCase();
        if (!isNaN(qVal)) {
          if (qUnit === 'g' || qUnit === 'ml') weightVal = qVal / 1000;
          else if (qUnit === 'kg' || qUnit === 'l') weightVal = qVal;
          else {
            const match = (p.quantity || '').match(/(\d+[\.,]?\d*)\s*(g|kg|ml|l)/i);
            if (match) {
              let val = parseFloat(match[1].replace(',', '.'));
              const unit = match[2].toLowerCase();
              if (unit === 'g' || unit === 'ml') weightVal = val / 1000;
              else weightVal = val;
            }
          }
        } else if (p.quantity) {
          const match = p.quantity.match(/(\d+[\.,]?\d*)\s*(g|kg|ml|l)/i);
          if (match) {
            let val = parseFloat(match[1].replace(',', '.'));
            const unit = match[2].toLowerCase();
            if (unit === 'g' || unit === 'ml') weightVal = val / 1000;
            else weightVal = val;
          }
        }

        let detectedCategory = 'Autre';
        const offCategories = p.categories_tags || [];
        const offText = (p.categories || '').toLowerCase();

        if (offCategories.some((c: string) => c.includes('fruit') || c.includes('vegetable')) || offText.includes('fruit') || offText.includes('légume')) detectedCategory = 'Fruits & Légumes';
        else if (offCategories.some((c: string) => c.includes('dairy') || c.includes('cheese') || c.includes('milk')) || offText.includes('laitier')) detectedCategory = 'Produits Laitiers';
        else if (offCategories.some((c: string) => c.includes('bread') || c.includes('bakery')) || offText.includes('pain') || offText.includes('boulangerie')) detectedCategory = 'Boulangerie';
        else if (offCategories.some((c: string) => c.includes('beverage') || c.includes('drink')) || offText.includes('boisson')) detectedCategory = 'Boissons';
        else if (offCategories.some((c: string) => c.includes('meat') || c.includes('fish')) || offText.includes('viande') || offText.includes('poisson')) detectedCategory = 'Viandes & Poissons';
        else if (offCategories.some((c: string) => c.includes('frozen')) || offText.includes('surgelé')) detectedCategory = 'Surgelés';
        else if (offCategories.some((c: string) => c.includes('ready-to-eat') || c.includes('meal')) || offText.includes('plat cuisiné')) detectedCategory = 'Plats Cuisinés';
        else if (offText.includes('épicerie') || offCategories.some((c: string) => c.includes('grocery') || c.includes('snack'))) detectedCategory = 'Épicerie';
        if (offText.includes('cacahuète') || offText.includes('peanut') || offText.includes('nut')) detectedCategory = 'Épicerie';

        const productTitle = p.product_name
          ? (p.brands ? `${p.product_name} - ${p.brands}` : p.product_name)
          : formData.title;

        setFormData(prev => ({
          ...prev,
          barcode,
          title: productTitle,
          category: detectedCategory,
          weight: p.quantity || '',
          weightValue: weightVal,
          nutriscore: p.nutrition_grades || '',
          ecoscore: p.ecoscore_grade || '',
          novaGroup: p.nova_group || null,
          allergens: p.allergens_from_ingredients
            ? Array.from(new Set(p.allergens_from_ingredients.split(',').map((s: string) => s.trim()).filter(Boolean)))
            : [],
          composition: p.ingredients_text || '',
          nutriments: p.nutriments || {},
          imageUrl: p.image_url || '',
        }));
      }
    } catch (err) {
      console.error('OFF Error:', err);
    } finally {
      setOffLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isQuotaExceeded) return;
    setLoading(true);

    try {
      // Supprimer les doublons (même code-barres, même donneur)
      if (formData.barcode) {
        const { data: dups } = await supabase
          .from('donations')
          .select('id')
          .eq('donor_id', user.id)
          .eq('barcode', formData.barcode)
          .eq('status', 'available');

        for (const dup of dups || []) {
          await supabase.from('donations').delete().eq('id', dup.id);
          await ChatService.deleteConversationByDonationId(dup.id);
        }
      }

      let location = {
        lat: 48.8566,
        lng: 2.3522,
        address: 'Paris, France',
        commune: 'Paris',
        postcode: '',
      };

      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true, timeout: 5000, maximumAge: 0,
          });
        });
        location.lat = pos.coords.latitude;
        location.lng = pos.coords.longitude;

        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`);
        const data = await res.json();
        location.address = data.display_name || 'Adresse inconnue';
        location.commune = data.address.city || data.address.town || data.address.village || data.address.municipality || 'Inconnue';
        location.postcode = data.address.postcode || '';
      } catch (geoErr) {
        console.error('Geolocation error:', geoErr);
        setStatusMessage('Position approximative utilisée.');
      }

      const { error } = await supabase.from('donations').insert({
        donor_id: user.id,
        donor_name: user.displayName || 'Anonyme',
        title: formData.title,
        description: formData.description,
        category: formData.category,
        expiry_date: formData.expiryDate,
        barcode: formData.barcode,
        weight: formData.weight,
        weight_value: formData.weightValue,
        nutriscore: formData.nutriscore,
        ecoscore: formData.ecoscore,
        nova_group: formData.novaGroup,
        allergens: formData.allergens,
        composition: formData.composition,
        nutriments: formData.nutriments,
        image_url: formData.imageUrl,
        location,
        status: 'available',
        is_confirmed_by_donor: false,
        is_confirmed_by_receiver: false,
        participant_ids: [user.id],
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
      navigate('/');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'donations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className="p-6 max-w-lg mx-auto pb-32 bg-slate-50 min-h-screen"
    >
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[8000] bg-slate-900/90 backdrop-blur-xl text-white px-8 py-4 rounded-[2rem] font-black shadow-2xl flex items-center gap-3 border border-white/10"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
            {statusMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="mb-10 pt-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-brand-100 p-2.5 rounded-2xl text-brand-600 shadow-sm">
            <Sparkles className="text-brand-600" size={22} />
          </div>
          <span className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em]">Nouveau Don</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Partager un don</h1>
        <p className="text-slate-500 mt-2 font-medium">Scannez, indiquez la DLC, et c'est prêt !</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="relative">
          <div
            onClick={() => setScanning(true)}
            className="group relative glass-card border-2 border-dashed border-brand-200 rounded-[3rem] p-12 flex flex-col items-center justify-center text-brand-600 cursor-pointer hover:border-brand-400 hover:bg-white/80 transition-all duration-500 shadow-2xl shadow-brand-100/20 overflow-hidden border-white/60"
          >
            <div className="relative z-10 flex flex-col items-center">
              {offLoading ? (
                <Loader2 className="animate-spin mb-6 text-brand-500" size={64} />
              ) : formData.imageUrl ? (
                <div className="relative mb-6">
                  <img src={formData.imageUrl} alt="Produit" className="w-40 h-40 object-cover rounded-[2.5rem] shadow-2xl border-4 border-white" referrerPolicy="no-referrer" />
                  <div className="absolute -bottom-3 -right-3 bg-brand-600 text-white p-3 rounded-2xl shadow-xl"><Barcode size={20} /></div>
                </div>
              ) : (
                <div className="bg-brand-100 p-8 rounded-[2.5rem] mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  <Barcode size={56} className="text-brand-600" />
                </div>
              )}
              <span className="font-black text-2xl tracking-tight text-slate-900">
                {formData.barcode ? 'Produit identifié !' : 'Scanner le produit'}
              </span>
              <span className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.2em]">
                {formData.barcode ? formData.barcode : 'Remplissage automatique'}
              </span>

              <div className="mt-8 flex flex-col items-center w-full max-w-[220px]">
                <div className="h-px w-full bg-slate-100 mb-6" />
                {showManualInput ? (
                  <div className="flex gap-2 w-full">
                    <input
                      type="text" value={manualBarcode}
                      onChange={(e) => setManualBarcode(e.target.value)}
                      placeholder="Code-barres"
                      className="flex-1 bg-white px-4 py-3 rounded-2xl text-xs font-black text-slate-900 focus:outline-none border-2 border-brand-100 focus:border-brand-500 transition-all"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button type="button" onClick={(e) => { e.stopPropagation(); if (manualBarcode) handleScan(manualBarcode); setShowManualInput(false); }}
                      className="bg-brand-600 text-white p-3 rounded-2xl shadow-lg hover:bg-brand-700 transition-all active:scale-90">
                      <Save size={18} />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={(e) => { e.stopPropagation(); setShowManualInput(true); }}
                    className="text-[10px] font-black text-brand-700 uppercase tracking-[0.2em] hover:text-brand-800 transition-colors">
                    Saisie manuelle du code
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-8 rounded-[3rem] shadow-2xl shadow-slate-900/5 border-white/60">
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <Calendar size={14} className="text-brand-500" /> Date d'expiration (DLC)
            </label>
            <input
              type="date" required
              className="w-full bg-slate-50 rounded-[1.5rem] px-8 py-5 font-black text-slate-900 focus:ring-4 focus:ring-brand-500/10 transition-all outline-none border-2 border-transparent focus:border-brand-500 shadow-inner"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            />
          </div>
        </div>

        <AnimatePresence>
          {formData.barcode && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6 overflow-hidden">
              <div className="glass-card p-8 rounded-[3rem] shadow-2xl shadow-slate-900/5 border-white/60 space-y-8">
                <div className="flex items-center gap-6 border-b border-slate-50 pb-6">
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Produit détecté</p>
                    <h3 className="font-black text-slate-900 text-2xl leading-tight tracking-tight">{formData.title || 'Nom inconnu'}</h3>
                  </div>
                  {formData.nutriscore && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Santé</span>
                        <div className={cn('w-12 h-12 flex items-center justify-center rounded-[1.25rem] font-black text-white text-lg uppercase shadow-xl',
                          formData.nutriscore === 'a' ? 'bg-green-600' : formData.nutriscore === 'b' ? 'bg-green-400' : formData.nutriscore === 'c' ? 'bg-yellow-400' : formData.nutriscore === 'd' ? 'bg-orange-500' : 'bg-red-600')}>
                          {formData.nutriscore}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Catégorie</p>
                    <p className="font-black text-slate-700 text-lg">{formData.category}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Quantité</p>
                    <p className="font-black text-slate-700 text-lg">{formData.weight || 'Inconnue'}</p>
                  </div>
                </div>
              </div>

              {formData.allergens.length > 0 && (
                <div className="bg-orange-50 p-8 rounded-[2.5rem] border border-orange-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 text-orange-700">
                    <Info size={18} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Allergènes détectés</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {formData.allergens.map(a => (
                      <span key={a} className="bg-white px-4 py-2 rounded-xl text-[10px] font-black text-orange-800 border border-orange-200 uppercase tracking-wider shadow-sm">
                        {a.replace('en:', '')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={loading || !formData.barcode}
          className="w-full bg-brand-600 text-white font-black py-6 rounded-[2.5rem] shadow-2xl shadow-brand-200 flex items-center justify-center gap-4 hover:bg-brand-700 transition-all active:scale-95 disabled:opacity-50 text-lg tracking-tight"
        >
          {loading ? <Loader2 className="animate-spin" /> : (<><Save size={28} />Publier mon don</>)}
        </button>
      </form>

      <AnimatePresence>
        {scanning && <BarcodeScanner onScan={handleScan} onClose={() => setScanning(false)} />}
      </AnimatePresence>
    </motion.div>
  );
};

export default AddDonationPage;
