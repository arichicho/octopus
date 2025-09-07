# Configuración de Variables de Entorno en Vercel

## Variables de Firebase Admin que necesitas configurar en Vercel:

Basándome en tu archivo `iamtheoceo-firebase-adminsdk-fbsvc-2ce40a658d.json`, necesitas configurar estas variables en Vercel:

### Opción A: Una sola variable (JSON)
```bash
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"iamtheoceo","private_key_id":"2ce40a658d111381dab6312b572d14df0a491e94","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCFkOzkLnNQFQJd\n+f9YlTYTN/WT4k4VfwnyZsyAbOMC+Epo3rbdAvylw/w1V7xnXIP2nNva5EbjIOMM\nEXxLz3M6WFQ1TUb4aTUB/9Wtt/bAvqA1Iqvf1zGryJ3gFMyX5lwCSPY021cqBU33\nYIVF/A75Atq7kICc22+XLyjHu6ltUysBkTntG+bwrXl7+RWDYX7Hz/6lR/itwDz4\nS9nBYHBmyeSRqgb2It8EnGl2DYX6nN7dN8AlhC6HMzTPzJ/gF5uqeSaAUVQhtLBb\n5zL9EygtNPnwdGtSu4B1G4mIYTIl6ftOZMEnAIqk1zU3t4+JjoqfauaCMyxD+ay1\njFE8Xa9tAgMBAAECggEACdkyI8UVCu5G+rzzSgnT2ejsulcby36kMh5zAnPaQp7M\n2xyzk7+johQTEFqEHC74gAJNkmn18XYRp73Q/MSyyguMnKgyYnYHdY/ypoODte9D\nCt1KmmUDVuz3pHfZeh3UjPU/n41zc41pPqNRpbkR4Dnd/P8zrIfgRjUw/EE8cJYa\nYScCwT5Ts0du09A5qE6bAf8zoDBWaGfA3iHXATEWYac4ZEr1RN/bcqZnPk+eZgEv\n4aSErdMvOTAij54JqsKHg2A5U7DpClj7jWGE96SbVE7ewcBaBLAnbaszIYKeQqI0\nfRQpiXz4YlgaS/k9OZHlkzRXMp3dAXiLtnTYtkx5VQKBgQC7UXZ/Fi4uV0iCGr3v\nTjqTY5tVrinBBvZo4uJx7ueB+DrncHy7FLcMmmhZ5D21/hq/j0idx5FuTtdAaGoH\nf1hXYHWI6pBMcbSFFZIaiD4ze/zumGkPY+Cy860uKqkv+kuvgohfqdodtItiY4MF\nTLvTX6bSDopgKS29j737sf68RwKBgQC2igvvyPA/0Ogc38V7MGNLxtY5E3HacbcP\ncOZjMaGELL9fIGYp01ck31MX0FBLuVsnwR5+7xxsUizRpZDCC7omHX4T3kiug7GF\nnZ2+PxnYKPz424a33N5vLnjSUEswdV9M8mAnVtbBdG3V99kA985UKPkNfxlbY2py\nnhYAnIy0qwKBgQCOoVLnJg53/sIZPx+MzjZP8DJhJUJp1lFeQBRIyK7DCi5f+Akh\nsn5HPHNkryRGJXxcjE+wxDr6kVHZmyfRGag8sBgO7vx9GL9p7qjXRxKFxU0sqCSn\nMVfxKxac5qL5A08KDwykOwL4R3cyra8gI/OI2XZ+z8+RtQk9I+x3cGsVFQKBgCXJ\nAZuLHqA3IDUJ5RkQ9Rz0ddeuvLyZGWmq1yXlWifAE4UfccZqpvlMvlM+ShOyLBEGChs\ng2GHIX0SrZBgE0z3nHrTVAvM0YK+Y/rim4qMCU+DfIoO9x4MLEcbeYsfb9ECGs4U\nxe6evSmibjICcfsPULh/Gr6+doNCWwCK1McfoMitAoGACPRI3rGyg6fk+8M3yNrq\nTSIAwfSMqnwGapqfDiR+VilAl7XWSnpflz6RnvnA2ptF1ha0gvFnrLJYSWslnoZP\nQGXIvyOL21qHO9Jx4c4Ba3elpaXox1XXOW+NpC7bFISURGTTwD9OyJlvKOT71jg4\ndTiSG6XlMK/0oRPRcgtrqNs=\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-fbsvc@iamtheoceo.iam.gserviceaccount.com","client_id":"113932522586937250240","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40iamtheoceo.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
```

### Opción B: Variables separadas (Recomendado)
```bash
FIREBASE_PROJECT_ID=iamtheoceo
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@iamtheoceo.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCFkOzkLnNQFQJd\n+f9YlTYTN/WT4k4VfwnyZsyAbOMC+Epo3rbdAvylw/w1V7xnXIP2nNva5EbjIOMM\nEXxLz3M6WFQ1TUb4aTUB/9Wtt/bAvqA1Iqvf1zGryJ3gFMyX5lwCSPY021cqBU33\nYIVF/A75Atq7kICc22+XLyjHu6ltUysBkTntG+bwrXl7+RWDYX7Hz/6lR/itwDz4\nS9nBYHBmyeSRqgb2It8EnGl2DYX6nN7dN8AlhC6HMzTPzJ/gF5uqeSaAUVQhtLBb\n5zL9EygtNPnwdGtSu4B1G4mIYTIl6ftOZMEnAIqk1zU3t4+JjoqfauaCMyxD+ay1\njFE8Xa9tAgMBAAECggEACdkyI8UVCu5G+rzzSgnT2ejsulcby36kMh5zAnPaQp7M\n2xyzk7+johQTEFqEHC74gAJNkmn18XYRp73Q/MSyyguMnKgyYnYHdY/ypoODte9D\nCt1KmmUDVuz3pHfZeh3UjPU/n41zc41pPqNRpbkR4Dnd/P8zrIfgRjUw/EE8cJYa\nYScCwT5Ts0du09A5qE6bAf8zoDBWaGfA3iHXATEWYac4ZEr1RN/bcqZnPk+eZgEv\n4aSErdMvOTAij54JqsKHg2A5U7DpClj7jWGE96SbVE7ewcBaBLAnbaszIYKeQqI0\nfRQpiXz4YlgaS/k9OZHlkzRXMp3dAXiLtnTYtkx5VQKBgQC7UXZ/Fi4uV0iCGr3v\nTjqTY5tVrinBBvZo4uJx7ueB+DrncHy7FLcMmmhZ5D21/hq/j0idx5FuTtdAaGoH\nf1hXYHWI6pBMcbSFFZIaiD4ze/zumGkPY+Cy860uKqkv+kuvgohfqdodtItiY4MF\nTLvTX6bSDopgKS29j737sf68RwKBgQC2igvvyPA/0Ogc38V7MGNLxtY5E3HacbcP\ncOZjMaGELL9fIGYp01ck31MX0FBLuVsnwR5+7xxsUizRpZDCC7omHX4T3kiug7GF\nnZ2+PxnYKPz424a33N5vLnjSUEswdV9M8mAnVtbBdG3V99kA985UKPkNfxlbY2py\nnhYAnIy0qwKBgQCOoVLnJg53/sIZPx+MzjZP8DJhJUJp1lFeQBRIyK7DCi5f+Akh\nsn5HPHNkryRGJXxcjE+wxDr6kVHZmyfRGag8sBgO7vx9GL9p7qjXRxKFxU0sqCSn\nMVfxKxac5qL5A08KDwykOwL4R3cyra8gI/OI2XZ+z8+RtQk9I+x3cGsVFQKBgCXJ\nAZuLHqA3IDUJ5RkQ9Rz0ddeuvLyZGWmq1yXlWifAE4UfccZqpvlM+ShOyLBEGChs\ng2GHIX0SrZBgE0z3nHrTVAvM0YK+Y/rim4qMCU+DfIoO9x4MLEcbeYsfb9ECGs4U\nxe6evSmibjICcfsPULh/Gr6+doNCWwCK1McfoMitAoGACPRI3rGyg6fk+8M3yNrq\nTSIAwfSMqnwGapqfDiR+VilAl7XWSnpflz6RnvnA2ptF1ha0gvFnrLJYSWslnoZP\nQGXIvyOL21qHO9Jx4c4Ba3elpaXox1XXOW+NpC7bFISURGTTwD9OyJlvKOT71jg4\ndTiSG6XlMK/0oRPRcgtrqNs=\n-----END PRIVATE KEY-----\n"
```

## Otras variables importantes:

```bash
# Firebase Cliente Web
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=iamtheoceo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=iamtheoceo
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=iamtheoceo.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret

# App Config
NEXT_PUBLIC_APP_URL=https://octopus-theceo.vercel.app
ENCRYPTION_KEY=tu_clave_de_32_caracteres_hex

# Opcionales
CLAUDE_API_KEY=tu_claude_api_key
SENDGRID_API_KEY=tu_sendgrid_api_key
```

## Cómo configurar en Vercel:

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto "octopus-theceo"
3. Ve a "Settings" → "Environment Variables"
4. Agrega cada variable una por una
5. Asegúrate de marcar "Production" para todas las variables
6. Haz clic en "Save"
7. Redespliega la aplicación

## Verificación:

Después de configurar las variables y redesplegar, puedes probar:

```bash
# Sin token (debería devolver 401)
node test-integrations.js

# Con token (debería devolver 200)
node test-integrations.js "tu_token_aqui"
```
