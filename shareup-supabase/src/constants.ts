export const BADGES = [
  { id: 'pioneer', name: 'Pionnier', description: 'A fait son premier don', icon: '🌱', color: 'text-green-500' },
  { id: 'eco_hero_bronze', name: 'Éco-Héros Bronze', description: 'A sauvé 10kg de produits', icon: '🥉', color: 'text-orange-600' },
  { id: 'eco_hero_silver', name: 'Éco-Héros Argent', description: 'A sauvé 50kg de produits', icon: '🥈', color: 'text-gray-400' },
  { id: 'eco_hero_gold', name: 'Éco-Héros Or', description: 'A sauvé 200kg de produits', icon: '🥇', color: 'text-yellow-500' },
  { id: 'eco_hero_diamond', name: 'Éco-Héros Diamant', description: 'A sauvé 1000kg de produits', icon: '💎', color: 'text-blue-400' },
  { id: 'star_donor_bronze', name: 'Donateur Bronze', description: 'A fait 10 dons', icon: '🥉', color: 'text-orange-600' },
  { id: 'star_donor_silver', name: 'Donateur Argent', description: 'A fait 50 dons', icon: '🥈', color: 'text-gray-400' },
  { id: 'star_donor_gold', name: 'Donateur Or', description: 'A fait 200 dons', icon: '🥇', color: 'text-yellow-500' },
  { id: 'star_donor_diamond', name: 'Donateur Diamant', description: 'A fait 500 dons', icon: '💎', color: 'text-blue-400' },
  { id: 'earth_friend_bronze', name: 'Ami de la Terre Bronze', description: 'A ajouté 5 amis', icon: '🥉', color: 'text-orange-600' },
  { id: 'earth_friend_silver', name: 'Ami de la Terre Argent', description: 'A ajouté 20 amis', icon: '🥈', color: 'text-gray-400' },
  { id: 'earth_friend_gold', name: 'Ami de la Terre Or', description: 'A ajouté 50 amis', icon: '🥇', color: 'text-yellow-500' },
  { id: 'zero_waste', name: 'Zéro Déchet', description: 'A sauvé 500kg de produits', icon: '♻️', color: 'text-green-600' },
  { id: 'bakery_master', name: 'Maître Boulanger', description: 'A sauvé 20 produits de boulangerie', icon: '🥖', color: 'text-amber-600' },
  { id: 'cold_guardian', name: 'Gardien du Froid', description: 'A sauvé 20 produits frais', icon: '❄️', color: 'text-blue-600' },
  { id: 'legend', name: 'Légende ShareUP', description: 'A fait 1000 dons', icon: '👑', color: 'text-purple-600' },
  { id: 'community_pillar', name: 'Pilier de la Communauté', description: 'A reçu 50 dons', icon: '🏛️', color: 'text-indigo-600' },
  { id: 'share_bronze', name: 'Partageur Bronze', description: 'A partagé 5 dons', icon: '📢', color: 'text-orange-600' },
  { id: 'share_silver', name: 'Partageur Argent', description: 'A partagé 20 dons', icon: '📢', color: 'text-gray-400' },
  { id: 'share_gold', name: 'Partageur Or', description: 'A partagé 50 dons', icon: '📢', color: 'text-yellow-500' },
];

export const IMPACT_CONVERSIONS = {
  CO2_PER_KG: 2.5, // kg of CO2 avoided per 1kg of food
};

export const WASTE_STATS = [
  { 
    label: "Tonnes gaspillées / an en France", 
    value: "10M", 
    detail: "Soit 16 milliards d'euros jetés.",
  },
  { 
    label: "Déchets par personne / an", 
    value: "30kg", 
    detail: "Dont 7kg encore emballés.",
  },
  { 
    label: "Empreinte Carbone", 
    value: "15.3M", 
    detail: "Tonnes de CO2 émises inutilement.",
  },
];

export const ANTI_WASTE_LAWS = [
  {
    title: "Loi Garot (2016)",
    description: "Interdit aux supermarchés de plus de 400m² de jeter de la nourriture consommable. Obligation de proposer des conventions de don aux associations."
  },
  {
    title: "Loi AGEC (2020)",
    description: "Loi Anti-Gaspillage pour une Économie Circulaire. Étend la lutte contre le gaspillage au secteur de la restauration collective et de l'agroalimentaire."
  },
  {
    title: "Loi Climat et Résilience (2021)",
    description: "Renforce les obligations de réduction du gaspillage alimentaire et encourage la vente en vrac."
  }
];
