import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Map as MapIcon, PlusSquare, MessageCircle, User as UserIcon, Home, ShieldCheck, Check, Bell, LogOut, Leaf, AlertCircle } from 'lucide-react';
import { AuthProvider, useAuth } from './AuthContext';
import { signInWithGoogle, supabase } from './supabase';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationService } from './lib/NotificationService';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || "Une erreur inattendue est survenue.";

      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
          <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center text-red-600 mb-6">
            <AlertTriangle size={40} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Oups ! Quelque chose a mal tourné.</h1>
          <p className="text-gray-500 mb-8 max-w-xs mx-auto">
            {errorMessage}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-gray-900 text-white font-bold py-4 px-8 rounded-2xl hover:bg-black transition-all active:scale-95"
          >
            <RefreshCcw size={20} />
            Recharger l'application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lazy load pages
const HomePage = React.lazy(() => import('./pages/HomePage'));
const AddDonationPage = React.lazy(() => import('./pages/AddDonationPage'));
const MessagesPage = React.lazy(() => import('./pages/MessagesPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const LegalPage = React.lazy(() => import('./pages/LegalPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const FriendsPage = React.lazy(() => import('./pages/FriendsPage'));
const DonationHistoryPage = React.lazy(() => import('./pages/DonationHistoryPage'));

const BottomNav = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!user) return;

    // Écoute des conversations non lues
    const channelMessages = supabase
      .channel('unread-messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `participants=cs.{${user.id}}`,
      }, () => {
        supabase
          .from('conversations')
          .select('id')
          .contains('participants', [user.id])
          .neq('last_message_sender_id', user.id)
          .then(({ data }) => setUnreadMessages(data?.length ?? 0));
      })
      .subscribe();

    // Écoute des demandes d'amis en attente
    const channelRequests = supabase
      .channel('pending-requests')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friend_requests',
        filter: `to_id=eq.${user.id}`,
      }, () => {
        supabase
          .from('friend_requests')
          .select('id')
          .eq('to_id', user.id)
          .eq('status', 'pending')
          .then(({ data }) => setPendingRequests(data?.length ?? 0));
      })
      .subscribe();

    // Chargement initial
    supabase.from('conversations').select('id').contains('participants', [user.id]).neq('last_message_sender_id', user.id)
      .then(({ data }) => setUnreadMessages(data?.length ?? 0));
    supabase.from('friend_requests').select('id').eq('to_id', user.id).eq('status', 'pending')
      .then(({ data }) => setPendingRequests(data?.length ?? 0));

    return () => {
      supabase.removeChannel(channelMessages);
      supabase.removeChannel(channelRequests);
    };
  }, [user]);

  const navItems = [
    { icon: Home, label: 'Accueil', path: '/' },
    { icon: PlusSquare, label: 'Donner', path: '/add' },
    { 
      icon: MessageCircle, 
      label: 'Messages', 
      path: '/messages',
      badge: unreadMessages > 0 ? unreadMessages : null 
    },
    { 
      icon: UserIcon, 
      label: 'Profil', 
      path: '/profile',
      badge: pendingRequests > 0 ? pendingRequests : null
    },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
      <nav className="glass-card rounded-[2.5rem] px-6 py-3 flex justify-around items-center shadow-2xl shadow-brand-900/10 border-white/40">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center p-2 transition-all duration-300 relative group",
                isActive ? "text-brand-600 scale-110" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <div className="relative">
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <motion.div 
                    layoutId="nav-active"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-600 rounded-full"
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

const LoginScreen = () => {
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (!accepted) return;
    setIsLoggingIn(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Login failed:", err);
      setError("Échec de la connexion. Veuillez réessayer.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8 text-center overflow-hidden relative">
      {/* Background Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-50 rounded-full blur-[120px] opacity-60 animate-pulse-soft" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-50 rounded-full blur-[120px] opacity-60 animate-pulse-soft" />

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="mb-16 relative z-10"
      >
        <div className="w-32 h-32 bg-brand-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-brand-200 mb-10 mx-auto transform rotate-12 hover:rotate-0 transition-all duration-700 animate-float">
          <PlusSquare size={64} className="text-white" />
        </div>
        <h1 className="text-7xl font-black text-slate-900 mb-6 tracking-tighter leading-none">ShareUP</h1>
        <p className="text-slate-500 max-w-xs mx-auto font-medium text-xl leading-snug">
          Donnez vos surplus alimentaires à vos voisins et <span className="text-brand-600 font-black">sauvez la planète</span>. 🌍
        </p>
      </motion.div>
      
      <div className="w-full max-w-xs space-y-8 relative z-10">
        <div className="flex items-start gap-4 text-left bg-slate-50/50 backdrop-blur-sm p-6 rounded-3xl border border-slate-100 shadow-sm">
          <button 
            onClick={() => setAccepted(!accepted)}
            className={cn(
              "mt-1 w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all shrink-0",
              accepted ? "bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-100" : "bg-white border-slate-200"
            )}
          >
            {accepted && <Check size={14} strokeWidth={4} />}
          </button>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            J'accepte les <Link to="/legal" className="text-brand-600 font-black hover:underline">CGU</Link> et je m'engage à ne donner que des produits propres à la consommation.
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100"
          >
            {error}
          </motion.div>
        )}

        <button
          onClick={handleLogin}
          disabled={!accepted || isLoggingIn}
          className={cn(
            "w-full flex items-center justify-center gap-4 bg-slate-900 text-white font-black py-6 px-8 rounded-[2.5rem] shadow-2xl transition-all active:scale-95 disabled:opacity-20 disabled:grayscale group relative overflow-hidden",
            accepted && !isLoggingIn && "hover:bg-slate-800 hover:-translate-y-1"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          {isLoggingIn ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {isLoggingIn ? "Connexion..." : "Continuer avec Google"}
        </button>
      </div>
    </div>
  );
};

const TermsOverlay = ({ onAccept }: { onAccept: () => void }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 z-[6000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
  >
    <motion.div 
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      className="bg-white rounded-[3rem] p-8 max-w-sm w-full shadow-2xl text-center"
    >
      <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center text-green-600 mx-auto mb-6">
        <ShieldCheck size={40} />
      </div>
      <h2 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Dernière étape !</h2>
      <p className="text-gray-500 text-sm mb-8 leading-relaxed">
        Pour utiliser ShareUP, vous devez accepter nos CGU. Cela nous permet de garantir la sécurité de tous nos utilisateurs.
      </p>
      <button
        onClick={onAccept}
        className="w-full bg-green-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95"
      >
        J'accepte et je commence
      </button>
    </motion.div>
  </motion.div>
);

const ApprovalScreen = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-sm w-full"
      >
        <div className="w-24 h-24 bg-blue-100 rounded-[2rem] flex items-center justify-center text-blue-600 mx-auto mb-8">
          <ShieldCheck size={48} />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Compte en attente</h1>
        <p className="text-gray-500 font-medium leading-relaxed mb-8">
          Votre inscription a bien été reçue ! Pour garantir la sécurité de la communauté, chaque nouveau compte doit être validé par le créateur de ShareUP.
        </p>
        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 mb-8">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Statut</p>
          <p className="text-blue-600 font-black text-lg">Vérification en cours...</p>
        </div>
        <p className="text-sm text-gray-400">
          Vous recevrez l'accès dès que votre compte sera approuvé. Merci de votre patience ! 🙏
        </p>
        <button 
          onClick={() => supabase.auth.signOut()}
          className="mt-8 flex items-center justify-center gap-2 w-full text-gray-400 font-bold text-sm hover:text-gray-600 transition-colors"
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </motion.div>
    </div>
  );
};

const AppContent = () => {
  const { user, profile, publicProfile, userLocation, loading } = useAuth();
  const location = useLocation();

  const isAdmin = user?.email === 'shareuplocal@gmail.com' || profile?.role === 'admin';
  const isApproved = isAdmin || (publicProfile && publicProfile.isApproved);

  // Mise à jour de la localisation dans Supabase
  useEffect(() => {
    if (!user || !userLocation) return;

    const lastUpdate = localStorage.getItem(`last_loc_update_${user.id}`);
    const lastLat = localStorage.getItem(`last_loc_lat_${user.id}`);
    const lastLng = localStorage.getItem(`last_loc_lng_${user.id}`);
    const now = Date.now();

    let distanceMoved = 1000;
    if (lastLat && lastLng) {
      const R = 6371;
      const dLat = (userLocation.lat - parseFloat(lastLat)) * Math.PI / 180;
      const dLon = (userLocation.lng - parseFloat(lastLng)) * Math.PI / 180;
      const a = Math.sin(dLat/2) ** 2 +
                Math.cos(parseFloat(lastLat) * Math.PI / 180) * Math.cos(userLocation.lat * Math.PI / 180) *
                Math.sin(dLon/2) ** 2;
      distanceMoved = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    if (!lastUpdate || now - parseInt(lastUpdate) > 30 * 60 * 1000 || distanceMoved > 1.0) {
      localStorage.setItem(`last_loc_update_${user.id}`, now.toString());
      localStorage.setItem(`last_loc_lat_${user.id}`, userLocation.lat.toString());
      localStorage.setItem(`last_loc_lng_${user.id}`, userLocation.lng.toString());

      supabase
        .from('users_public')
        .update({
          last_location: {
            lat: userLocation.lat,
            lng: userLocation.lng,
            updatedAt: new Date().toISOString(),
          }
        })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) console.warn("Could not update user location:", error.message);
        });
    }
  }, [user, userLocation]);

  // Notifications
  useEffect(() => {
    if (!user || !isApproved) return;
    const ns = NotificationService.getInstance();
    ns.requestPermission();
    const prefs = profile?.notifications;
    const unsubMessages = prefs?.newMessages !== false ? ns.listenForNewMessages(user.id) : () => {};
    const unsubFriendRequests = ns.listenForFriendRequests(user.id);
    let unsubDonations = () => {};
    if (userLocation && prefs?.newDonations !== false) {
      unsubDonations = ns.listenForNewDonations(user.id, userLocation.lat, userLocation.lng, prefs?.radius);
    }
    return () => {
      unsubMessages();
      unsubFriendRequests();
      unsubDonations();
    };
  }, [user, userLocation, isApproved, profile?.notifications]);

  // Acceptation des CGU
  const handleAcceptTerms = async () => {
    if (!user) return;
    const { error } = await supabase.from('users').update({ terms_accepted: true }).eq('id', user.id);
    if (error) console.error("Erreur acceptation CGU:", error.message);
  };

  // Message de bienvenue
  const welcomeAttempted = React.useRef(false);
  useEffect(() => {
    if (!user || !isApproved || !publicProfile || publicProfile.welcomeMessageSent || welcomeAttempted.current) return;

    const sendWelcomeMessage = async () => {
      welcomeAttempted.current = true;
      try {
        // 1. Trouver l'admin
        const { data: admins } = await supabase.from('users_public').select('id').eq('role', 'admin').limit(1);
        if (!admins?.length) return;
        const adminId = admins[0].id;

        // 2. Créer la conversation
        const conversationId = `welcome_${user.id}`;
        const { data: existing } = await supabase.from('conversations').select('id').eq('id', conversationId).single();

        if (!existing) {
          const welcomeText = "Bienvenue sur ShareUP ! 🌍 Saviez-vous que 1/3 de la nourriture produite dans le monde est gaspillée ? En France, 10 millions de tonnes sont jetées par an. ShareUP est votre outil pour agir. Donnez vos surplus à vos voisins ! Plus vous donnez, plus vous gagnez des badges prestigieux. Votre premier défi : faites votre premier don aujourd'hui ! 🚀";

          await supabase.from('conversations').insert({
            id: conversationId,
            participants: [adminId, user.id],
            last_message: welcomeText,
            last_message_sender_id: adminId,
            donation_id: 'admin_support',
            type: 'welcome',
          });

          await supabase.from('messages').insert({
            conversation_id: conversationId,
            text: welcomeText,
            sender_id: adminId,
          });

          await supabase.from('users_public').update({ welcome_message_sent: true }).eq('id', user.id);
        }
      } catch (error: any) {
        console.error("Erreur message de bienvenue:", error?.message);
      }
    };
    sendWelcomeMessage();
  }, [user, publicProfile, isApproved]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-50 rounded-full animate-spin border-t-indigo-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Leaf className="text-indigo-600 animate-pulse" size={20} />
          </div>
        </div>
      </div>
    );
  }

  if (user && !publicProfile && !isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-50 rounded-full animate-spin border-t-indigo-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Leaf className="text-indigo-600 animate-pulse" size={20} />
          </div>
        </div>
      </div>
    );
  }

  if (user && !isApproved && location.pathname !== '/login') {
    return <ApprovalScreen />;
  }

  if (!user) {
    return (
      <Suspense fallback={<div className="p-4">Chargement...</div>}>
        <Routes location={location}>
          <Route path="/legal" element={<LegalPage />} />
          <Route path="*" element={<LoginScreen />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <AnimatePresence>
        {profile && !profile.termsAccepted && (
          <TermsOverlay onAccept={handleAcceptTerms} />
        )}
      </AnimatePresence>
      <Suspense fallback={<div className="p-4">Chargement...</div>}>
        <AnimatePresence mode="wait">
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/add" element={<AddDonationPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/legal" element={<LegalPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/history" element={<DonationHistoryPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
