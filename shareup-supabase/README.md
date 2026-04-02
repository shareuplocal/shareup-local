# ShareUP — Version Supabase 3.0

Application PWA de don alimentaire de voisinage.  
Migré de Firebase vers **Supabase** (Auth, PostgreSQL, Realtime, Storage).

## Stack technique
- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Supabase (remplace Firebase)
- Leaflet / React-Leaflet
- PWA (vite-plugin-pwa)

## Installation locale

```bash
# 1. Cloner le repo
git clone https://github.com/TON_REPO/shareup.git
cd shareup

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env
cp .env.example .env
# → Remplir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# 4. Lancer en développement
npm run dev
```

## Configuration Supabase

1. Aller dans **Supabase → SQL Editor → New query**
2. Copier-coller le contenu de `supabase/schema.sql`
3. Cliquer **Run**
4. Dans **Authentication → Providers** : activer **Google**
5. Dans **Authentication → URL Configuration** :
   - Site URL : `https://shareup-local.fr`
   - Redirect URLs : `https://shareup-local.fr/**`

## Variables d'environnement

```env
VITE_SUPABASE_URL=https://isbjfpubfobsdyixzrlt.supabase.co
VITE_SUPABASE_ANON_KEY=ta-cle-anon-ici
```

## Déploiement

```bash
npm run build
# → dossier dist/ prêt à déployer
```

Voir les instructions de déploiement sur Netlify/Cloud Run dans la doc.
