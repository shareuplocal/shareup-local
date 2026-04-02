import React from 'react';
import { motion } from 'motion/react';
import { Settings, LogOut, Trash2, ShieldAlert, UserCog, Bell, Globe, HelpCircle, ChevronRight, Share2, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SettingsSectionProps {
  onLogout: () => void;
  onDeleteAccount: () => void;
  onResetStats: () => void;
  onEditProfile: () => void;
  onShowInfo: (title: string, message: string) => void;
  isAdmin: boolean;
  userDisplayName: string;
  userId: string;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  onLogout,
  onDeleteAccount,
  onResetStats,
  onEditProfile,
  onShowInfo,
  isAdmin,
  userDisplayName,
  userId
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const handleItemClick = (id: string) => {
    switch (id) {
      case 'profile':
        onEditProfile();
        break;
      case 'notifications':
        setNotificationsEnabled(!notificationsEnabled);
        break;
      case 'legal':
        onShowInfo('Mentions Légales', 'ShareUP est une application solidaire éditée par l\'association ShareUP Local.\n\nSiège social : Paris, France\nContact : shareuplocal@gmail.com\n\nHébergement : Google Cloud Platform\n\nDonnées personnelles : Conformément au RGPD, vous disposez d\'un droit d\'accès, de rectification et de suppression de vos données via les réglages de votre profil.');
        break;
      case 'help':
        const subject = encodeURIComponent(`[ShareUP] Assistance - ${userDisplayName} (${userId})`);
        const body = encodeURIComponent(`Bonjour l'équipe ShareUP,\n\nJ'ai besoin d'aide concernant mon compte.\n\n---\nID Utilisateur : ${userId}\nNom actuel : ${userDisplayName}\n---`);
        window.location.href = `mailto:shareuplocal@gmail.com?subject=${subject}&body=${body}`;
        break;
      case 'about':
        onShowInfo('À propos de ShareUP', 'ShareUP v1.2.0 - Une application solidaire pour lutter contre le gaspillage alimentaire.\n\nCHIFFRES CHOCS :\n• 1/3 de la nourriture produite est gaspillée.\n• 10 millions de tonnes jetées par an en France.\n• 1 repas sauvé = 1,5kg de CO2 évité.\n\nMerci de faire partie de la solution !');
        break;
      default:
        break;
    }
  };

  const settingsGroups = [
    {
      title: "Compte & Sécurité",
      items: [
        { id: 'profile', label: 'Modifier mon profil', icon: UserCog, color: 'text-blue-500 bg-blue-50' },
        { id: 'notifications', label: `Notifications (${notificationsEnabled ? 'Activées' : 'Désactivées'})`, icon: Bell, color: notificationsEnabled ? 'text-orange-500 bg-orange-50' : 'text-slate-400 bg-slate-50' },
        { id: 'legal', label: 'Mentions Légales', icon: ShieldAlert, color: 'text-purple-500 bg-purple-50' },
      ]
    },
    {
      title: "Application",
      items: [
        { id: 'help', label: 'Centre d\'aide', icon: HelpCircle, color: 'text-green-500 bg-green-50' },
        { id: 'about', label: 'À propos de ShareUP', icon: Info, color: 'text-slate-500 bg-slate-50' },
      ]
    }
  ];

  return (
    <div className="mt-16 pb-20">
      <div className="flex items-center justify-between mb-8 ml-2">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Réglages & Préférences</h3>
        <span className="text-[10px] font-bold text-gray-300 italic">v1.2.0</span>
      </div>

      <div className="space-y-10">
        {settingsGroups.map((group) => (
          <div key={group.title} className="space-y-4">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{group.title}</p>
            <div className="bg-white border-2 border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              {group.items.map((item, idx) => (
                <button 
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={cn(
                    "w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group",
                    idx !== group.items.length - 1 && "border-b-2 border-slate-50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", item.color)}>
                      <item.icon size={18} />
                    </div>
                    <span className="text-sm font-black text-slate-700">{item.label}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Actions Spéciales */}
        <div className="space-y-4">
          <p className="text-[9px] font-black text-red-400 uppercase tracking-[0.2em] ml-1">Actions Critiques</p>
          <div className="bg-white border-2 border-red-50 rounded-3xl overflow-hidden shadow-sm">
            {isAdmin && (
              <button 
                onClick={onResetStats}
                className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition-colors group border-b-2 border-red-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShieldAlert size={18} />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-black text-red-600 block">Réinitialiser les stats</span>
                    <span className="text-[10px] font-bold text-red-400 italic">Action administrateur uniquement</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-red-200" />
              </button>
            )}
            
            <button 
              onClick={onLogout}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group border-b-2 border-slate-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LogOut size={18} />
                </div>
                <span className="text-sm font-black text-slate-700">Se déconnecter</span>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </button>

            <button 
              onClick={onDeleteAccount}
              className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Trash2 size={18} />
                </div>
                <div className="text-left">
                  <span className="text-sm font-black text-red-500 block">Supprimer mon compte</span>
                  <span className="text-[10px] font-bold text-red-300 italic">Action irréversible</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-red-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsSection;
