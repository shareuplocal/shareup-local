import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ShieldCheck, Scale, Gavel, UserCheck, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LegalPage = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 pb-32 max-w-2xl mx-auto"
    >
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mentions Légales & CGU</h1>
      </header>

      <div className="space-y-8 text-gray-600 leading-relaxed">
        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
            <Gavel className="text-orange-600" size={20} /> Mentions Légales (LCEN)
          </h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Éditeur du site</h3>
              <p>[Votre Nom ou Nom de l'Association/Entreprise]</p>
              <p>[Adresse Siège Social]</p>
              <p>Email : shareuplocal@gmail.com</p>
              <p>SIRET / RNA : [Votre Numéro]</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Directeur de la publication</h3>
              <p>[Votre Nom]</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Hébergeur</h3>
              <p>Google Cloud Platform</p>
              <p>Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irlande</p>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="text-purple-600" size={20} /> Politique de Confidentialité (RGPD)
          </h2>
          <div className="space-y-4 text-sm">
            <p>
              <strong>Responsable du traitement :</strong> [Votre Nom]
            </p>
            <p>
              <strong>Données collectées :</strong> Nous collectons votre nom, email, photo de profil (via Google) et votre position géographique.
            </p>
            <p>
              <strong>Finalité :</strong> La géolocalisation est utilisée uniquement pour vous proposer des dons à proximité (base légale : consentement). Vos données ne sont jamais vendues.
            </p>
            <p>
              <strong>Durée de conservation :</strong> Vos données sont conservées tant que votre compte est actif. Vous pouvez supprimer votre compte à tout moment depuis votre profil.
            </p>
            <p>
              <strong>Vos droits :</strong> Vous disposez d'un droit d'accès, de rectification et de suppression. Pour toute réclamation, vous pouvez contacter la CNIL (www.cnil.fr).
            </p>
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="text-green-600" size={20} /> 1. Objet du Service
          </h2>
          <p className="text-sm">
            ShareUP est une plateforme de mise en relation entre particuliers pour le don d'objets et de denrées alimentaires. 
            Notre mission est de lutter contre le gaspillage et de favoriser l'économie circulaire. 
            L'utilisation du service est strictement réservée à un usage non commercial.
          </p>
        </section>

        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
            <Scale className="text-blue-600" size={20} /> 2. Responsabilité des Utilisateurs
          </h2>
          <div className="space-y-3 text-sm">
            <p>
              <strong>Donneurs :</strong> Vous vous engagez à donner des produits conformes à la description, non dangereux et, 
              pour les denrées alimentaires, non périmés. Vous êtes responsable de la qualité des produits donnés.
            </p>
            <p>
              <strong>Receveurs :</strong> Vous acceptez les produits en l'état. Il vous appartient de vérifier la conformité 
              et la qualité des produits au moment de la remise. ShareUP ne saurait être tenu responsable en cas d'intoxication 
              ou de défaut d'un objet.
            </p>
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
            <Scale className="text-green-600" size={20} /> 3. Textes de Lois & Sources Officielles
          </h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-bold text-gray-900 mb-1">🇫🇷 France : Loi Garot & Loi AGEC</h3>
              <p className="mb-2 italic text-[11px]">Lutte contre le gaspillage alimentaire et économie circulaire.</p>
              <ul className="list-disc pl-5 space-y-1 text-blue-600 font-medium">
                <li><a href="https://www.legifrance.gouv.fr/loda/id/JORFTEXT000032036280/" target="_blank" rel="noopener noreferrer">Loi n° 2016-138 (Loi Garot)</a></li>
                <li><a href="https://www.ecologie.gouv.fr/loi-anti-gaspillage-economie-circulaire-agec" target="_blank" rel="noopener noreferrer">Loi AGEC (Anti-gaspillage)</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">🇪🇺 Europe : Green Deal & Circular Economy</h3>
              <p className="mb-2 italic text-[11px]">Objectifs de réduction des déchets au niveau européen.</p>
              <ul className="list-disc pl-5 space-y-1 text-blue-600 font-medium">
                <li><a href="https://ec.europa.eu/food/safety/food_waste_en" target="_blank" rel="noopener noreferrer">EU Food Waste Strategy</a></li>
                <li><a href="https://environment.ec.europa.eu/strategy/circular-economy-action-plan_en" target="_blank" rel="noopener noreferrer">Circular Economy Action Plan</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">🌍 Monde : Objectifs de Développement Durable (ONU)</h3>
              <p className="mb-2 italic text-[11px]">ODD 12.3 : Réduire de moitié le gaspillage alimentaire mondial.</p>
              <ul className="list-disc pl-5 space-y-1 text-blue-600 font-medium">
                <li><a href="https://www.un.org/sustainabledevelopment/fr/sustainable-consumption-production/" target="_blank" rel="noopener noreferrer">Objectif 12 : Consommation Responsable</a></li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="text-purple-600" size={20} /> 4. Protection des Données (RGPD)
          </h2>
          <p className="text-sm">
            ShareUP collecte votre position géographique uniquement pour vous proposer des dons à proximité. 
            Vos données ne sont jamais vendues à des tiers. Vous disposez d'un droit d'accès, de modification 
            et de suppression de vos données via les paramètres de votre compte.
          </p>
        </section>

        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
            <Gavel className="text-orange-600" size={20} /> 4. Lutte contre la Fraude
          </h2>
          <p className="text-sm">
            Tout comportement abusif, signalement répété ou tentative de vente sur la plateforme entraînera 
            la suspension immédiate et définitive du compte. La validation mutuelle des dons est obligatoire 
            pour garantir l'intégrité des statistiques d'impact.
          </p>
        </section>

        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
            <UserCheck className="text-blue-600" size={20} /> 5. Transparence et Rôles
          </h2>
          <div className="space-y-4 text-sm">
            <p>
              <strong>Compte Administrateur :</strong> En tant qu'éditeur et hébergeur de la plateforme, nous disposons d'un compte utilisateur ("ShareUP") pour tester les fonctionnalités et modérer le contenu. Ce compte est soumis aux mêmes CGU que tout autre utilisateur.
            </p>
            <p>
              <strong>Modération :</strong> L'administrateur a la possibilité de suspendre des comptes ou de supprimer des dons en cas de non-respect des règles de la communauté (tentative de vente, produits dangereux, harcèlement).
            </p>
            <p>
              <strong>Intégrité des données :</strong> Nous nous engageons à ne pas gonfler artificiellement les statistiques d'impact. Les calculs de CO2 sont basés sur des sources scientifiques reconnues (FAO/ADEME).
            </p>
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
            <Scale className="text-pink-600" size={20} /> 6. Propriété Intellectuelle
          </h2>
          <p className="text-sm">
            ShareUP est une marque déposée. Toute reproduction totale ou partielle du contenu, du design 
            ou du code source est strictement interdite sans autorisation préalable.
          </p>
        </section>

        <div className="text-center pt-8">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Dernière mise à jour : 30 Mars 2026
          </p>
          <p className="text-[10px] text-gray-400 mt-2">
            Contact : shareuplocal@gmail.com
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default LegalPage;
