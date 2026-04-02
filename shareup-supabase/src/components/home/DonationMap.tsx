import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Donation, PublicProfile } from '../../types';
import { LocateFixed, Share2, AlertTriangle, ShoppingBag, Loader2, MapPin, Search } from 'lucide-react';

// Fix Leaflet marker icons
const markerIcon2x = new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href;
const markerIcon = new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href;
const markerShadow = new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href;

delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const getCategoryEmoji = (category: string) => {
  const mapping: { [key: string]: string } = {
    'Fruits & Légumes': '🍎',
    'Produits Laitiers': '🥛',
    'Boulangerie': '🥖',
    'Épicerie': '🥫',
    'Boissons': '🥤',
    'Plats Cuisinés': '🍲',
    'Viandes & Poissons': '🥩',
    'Surgelés': '❄️',
    'Hygiène & Beauté': '🧼',
    'Entretien': '🧹',
    'Autre': '📦'
  };
  return mapping[category] || '📦';
};

const getDonationIcon = (category: string) => {
  const emoji = getCategoryEmoji(category);
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #22c55e; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); font-size: 20px;">${emoji}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

const getUserLocationIcon = () => {
  return L.divIcon({
    className: 'user-location-icon',
    html: `
      <div style="position: relative; width: 24px; height: 24px;">
        <div style="position: absolute; inset: 0; background-color: #3b82f6; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); z-index: 2;"></div>
        <div style="position: absolute; inset: -8px; background-color: rgba(59, 130, 246, 0.2); border-radius: 50%; animation: pulse 2s infinite; z-index: 1;"></div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
      </style>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const LocationMarker = ({ 
  setPosition, 
  triggerFly, 
  setLocationError, 
  profile,
  onUpdateLocation
}: { 
  setPosition: (pos: [number, number]) => void, 
  triggerFly: number, 
  setLocationError: (err: boolean) => void, 
  profile: PublicProfile | null,
  onUpdateLocation: (lat: number, lng: number) => void
}) => {
  const map = useMap();
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      map.stopLocate();
      setLocationError(true);
    }, 12000);

    map.locate({ enableHighAccuracy: true, timeout: 10000 });
    
    const onLocationFound = (e: L.LocationEvent) => {
      clearTimeout(timeout);
      const pos: [number, number] = [e.latlng.lat, e.latlng.lng];
      setPosition(pos);
      map.flyTo(e.latlng, 15);
      setLocationError(false);
      // Removed redundant and unthrottled onUpdateLocation call to save quota.
      // Location updates are handled centrally and throttled in App.tsx.
    };

    const onLocationError = () => {
      clearTimeout(timeout);
      setLocationError(true);
    };

    map.on("locationfound", onLocationFound);
    map.on("locationerror", onLocationError);
    
    return () => {
      clearTimeout(timeout);
      map.stopLocate();
      map.off("locationfound", onLocationFound);
      map.off("locationerror", onLocationError);
    };
  }, [map, setPosition, setLocationError, profile, onUpdateLocation]);

  useEffect(() => {
    if (triggerFly > 0) {
      map.locate({ enableHighAccuracy: true });
    }
  }, [triggerFly, map]);

  return null;
};

const MapUpdater = ({ center, radius }: { center: [number, number] | null, radius: number }) => {
  const map = useMap();
  useEffect(() => {
    if (center && map) {
      try {
        const circle = L.circle(center, { radius: radius * 1000 });
        map.fitBounds(circle.getBounds(), { padding: [20, 20] });
      } catch (e) {
        console.warn("MapUpdater error:", e);
      }
    }
  }, [center, radius, map]);
  return null;
};

interface DonationMapProps {
  userPos: [number, number] | null;
  setUserPos: (pos: [number, number] | null) => void;
  locationError: boolean;
  setLocationError: (err: boolean) => void;
  donations: Donation[];
  radius: number;
  triggerFly: number;
  profile: PublicProfile | null;
  onUpdateLocation: (lat: number, lng: number) => void;
  onSelectDonation: (donation: Donation) => void;
  onReserve: (donation: Donation) => void;
  onShare: (donation: Donation) => void;
  onReport: (donation: Donation) => void;
  onNavigate: (lat: number, lng: number) => void;
  manualCity: string;
  setManualCity: (city: string) => void;
  handleCitySearch: (e: React.FormEvent) => void;
  isSearchingCity: boolean;
}

const DonationMap = ({
  userPos,
  setUserPos,
  locationError,
  setLocationError,
  donations,
  radius,
  triggerFly,
  profile,
  onUpdateLocation,
  onSelectDonation,
  onReserve,
  onShare,
  onReport,
  onNavigate,
  manualCity,
  setManualCity,
  handleCitySearch,
  isSearchingCity
}: DonationMapProps) => {
  return (
    <div className="h-full w-full relative">
      {(!userPos && !locationError) && (
        <div className="absolute inset-0 z-[2000] bg-white/40 backdrop-blur-md flex items-center justify-center">
          <div className="glass-card p-10 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 max-w-xs text-center border-white/60">
            <div className="bg-brand-100 p-5 rounded-[2rem] text-brand-600 animate-float">
              <Loader2 className="animate-spin" size={40} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-2xl tracking-tight mb-2">Localisation...</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">Nous cherchons votre position pour afficher les dons proches.</p>
            </div>
            <button 
              onClick={() => setLocationError(true)}
              className="text-xs font-black text-brand-600 uppercase tracking-widest hover:underline mt-2"
            >
              Saisir manuellement
            </button>
          </div>
        </div>
      )}

      {locationError && !userPos && (
        <div className="absolute inset-0 z-[2000] bg-slate-900/20 backdrop-blur-xl flex items-center justify-center p-8">
          <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl w-full max-w-sm border border-white/20">
            <div className="bg-orange-100 w-20 h-20 rounded-[2.5rem] flex items-center justify-center text-orange-600 mb-8 mx-auto animate-float">
              <MapPin size={40} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 text-center mb-3 tracking-tight">Où êtes-vous ?</h3>
            <p className="text-sm text-slate-500 text-center mb-10 font-medium leading-relaxed">La géolocalisation automatique a échoué. Indiquez votre ville pour continuer.</p>
            
            <form onSubmit={handleCitySearch} className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                  placeholder="Ex: Lyon, 69001..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-5 font-black text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-all shadow-inner"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSearchingCity}
                className="w-full bg-brand-600 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-brand-200 flex items-center justify-center gap-3 hover:bg-brand-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSearchingCity ? <Loader2 className="animate-spin" /> : <Search size={24} />}
                Voir les dons à proximité
              </button>
            </form>
          </div>
        </div>
      )}

      <MapContainer
        center={[48.8566, 2.3522]}
        zoom={13}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <LocationMarker 
          setPosition={setUserPos} 
          triggerFly={triggerFly} 
          setLocationError={setLocationError} 
          profile={profile}
          onUpdateLocation={onUpdateLocation}
        />
        <MapUpdater center={userPos} radius={radius} />
        {userPos && (
          <>
            <Marker position={userPos} icon={getUserLocationIcon()}>
              <Popup>Vous êtes ici</Popup>
            </Marker>
            <Circle 
              center={userPos} 
              radius={radius * 1000} 
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.05, weight: 1 }} 
            />
          </>
        )}

        {donations.map((donation) => (
          <Marker 
            key={donation.id} 
            position={[donation.location.lat, donation.location.lng]}
            icon={getDonationIcon(donation.category)}
          >
            <Popup className="custom-popup">
              <div className="p-3 min-w-[240px]">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{getCategoryEmoji(donation.category)}</span>
                  <h4 className="font-black text-slate-900 leading-tight text-lg tracking-tight">{donation.title}</h4>
                </div>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2 font-medium leading-relaxed">{donation.description}</p>
                
                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => onSelectDonation(donation)}
                    className="w-full bg-white text-brand-600 text-[11px] font-black py-3 rounded-2xl border-2 border-brand-600 hover:bg-brand-50 transition-all active:scale-95"
                  >
                    VOIR LES DÉTAILS
                  </button>
                  <button
                    onClick={() => onReserve(donation)}
                    className="w-full bg-brand-600 text-white text-[11px] font-black py-3 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-brand-100 hover:bg-brand-700 transition-all active:scale-95"
                  >
                    <ShoppingBag size={16} />
                    RÉCUPÉRER LE DON
                  </button>
                  
                  <div className="grid grid-cols-3 gap-2.5 mt-1">
                    <button
                      onClick={() => onNavigate(donation.location.lat, donation.location.lng)}
                      className="bg-slate-50 text-slate-500 p-3 rounded-2xl flex items-center justify-center hover:bg-brand-50 hover:text-brand-600 transition-all active:scale-90"
                      title="Naviguer"
                    >
                      <LocateFixed size={18} />
                    </button>
                    <button
                      onClick={() => onShare(donation)}
                      className="bg-slate-50 text-slate-500 p-3 rounded-2xl flex items-center justify-center hover:bg-brand-50 hover:text-brand-600 transition-all active:scale-90"
                      title="Partager"
                    >
                      <Share2 size={18} />
                    </button>
                    <button
                      onClick={() => onReport(donation)}
                      className="bg-slate-50 text-slate-500 p-3 rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all active:scale-90"
                      title="Signaler"
                    >
                      <AlertTriangle size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default DonationMap;
