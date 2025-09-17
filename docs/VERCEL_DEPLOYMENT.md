# Deploy a Vercel + Cron (Spotify Charts)

## Prerrequisitos
- Cuenta en Vercel y Vercel CLI instalado: `npm i -g vercel`
- Variables de entorno listas (usa `config/env.example` de guía)

## Variables de entorno mínimas
- `NEXT_PUBLIC_APP_URL` (ej. `https://octopus-yourapp.vercel.app`)
- Firebase cliente: `NEXT_PUBLIC_FIREBASE_*`
- (Opcional) Spotify: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`
- (Opcional) `INTERNAL_API_KEY`
- (Opcional) `CRON_SECRET` para disparos manuales del cron

Configúralas en Vercel:
- Dashboard > Project > Settings > Environment Variables

## Despliegue
```bash
vercel
# validar preview
vercel --prod
```

## Cron en Vercel
Este repo incluye `vercel.json` con un cron que llama 3 veces por día a:
`/api/music-trends/cron?territory=all&period=all`

Horario (UTC): 00:30, 12:30, 18:30
- Buenos Aires (UTC-3): 21:30, 09:30, 15:30

El endpoint acepta:
- Header de Vercel Cron (`x-vercel-cron` / `x-vercel-scheduled`), o
- `?key=CRON_SECRET` o header `X-Cron-Secret: CRON_SECRET`

## Pruebas manuales
```bash
# Preview/local (sin clave, no prod):
curl "https://<tu-app>.vercel.app/api/music-trends/cron?territory=all&period=all"

# Con secreto (prod):
curl "https://<tu-app>.vercel.app/api/music-trends/cron?territory=argentina&period=daily&key=$CRON_SECRET"
```

## Persistencia
Los scrapes se guardan en Firestore vía `MusicTrendsStorage.storeChartData` en la colección `music_charts`.

