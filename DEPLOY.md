# 🚀 Déploiement ShareUP sur Netlify

## Variables d'environnement requises

Dans **Netlify Dashboard → Site Settings → Environment Variables**, ajouter :

| Variable | Valeur |
|---|---|
| `VITE_SUPABASE_URL` | `https://isbjfpubfobsdyixzrlt.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

## Configuration Netlify

- **Base directory** : `shareup-supabase`
- **Build command** : `npm run build`
- **Publish directory** : `shareup-supabase/dist`

## OAuth Google (Supabase)

Dans Supabase Dashboard → Authentication → Providers → Google :
- Redirect URL : `https://isbjfpubfobsdyixzrlt.supabase.co/auth/v1/callback`

Dans Google Cloud Console → Authorized redirect URIs, ajouter :
- `https://isbjfpubfobsdyixzrlt.supabase.co/auth/v1/callback`
- `https://shareup-local.fr` (votre domaine)
