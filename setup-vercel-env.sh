#!/bin/bash

# Script para configurar variables de entorno en Vercel
# Ejecutar: ./setup-vercel-env.sh

echo "🚀 Configurando variables de entorno en Vercel..."

# Firebase Cliente Web
echo "📱 Configurando Firebase Cliente Web..."
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production <<< "AIzaSyButtaDMIheklUExNySlL9HCNaVUW-8UFY"
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production <<< "iamtheoceo.firebaseapp.com"
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production <<< "iamtheoceo"
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production <<< "iamtheoceo.firebasestorage.app"
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production <<< "511546212594"
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production <<< "1:511546212594:web:08397e8ff7f942a34a906b"

# Firebase Admin
echo "🔐 Configurando Firebase Admin..."
vercel env add FIREBASE_PROJECT_ID production <<< "iamtheoceo"
vercel env add FIREBASE_CLIENT_EMAIL production <<< "firebase-adminsdk-fbsvc@iamtheoceo.iam.gserviceaccount.com"
vercel env add FIREBASE_PRIVATE_KEY production <<< "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCFkOzkLnNQFQJd\n+f9YlTYTN/WT4k4VfwnyZsyAbOMC+Epo3rbdAvylw/w1V7xnXIP2nNva5EbjIOMM\nEXxLz3M6WFQ1TUb4aTUB/9Wtt/bAvqA1Iqvf1zGryJ3gFMyX5lwCSPY021cqBU33\nYIVF/A75Atq7kICc22+XLyjHu6ltUysBkTntG+bwrXl7+RWDYX7Hz/6lR/itwDz4\nS9nBYHBmyeSRqgb2It8EnGl2DYX6nN7dN8AlhC6HMzTPzJ/gF5uqeSaAUVQhtLBb\n5zL9EygtNPnwdGtSu4B1G4mIYTIl6ftOZMEnAIqk1zU3t4+JjoqfauaCMyxD+ay1\njFE8Xa9tAgMBAAECggEACdkyI8UVCu5G+rzzSgnT2ejsulcby36kMh5zAnPaQp7M\n2xyzk7+johQTEFqEHC74gAJNkmn18XYRp73Q/MSyyguMnKgyYnYHdY/ypoODte9D\nCt1KmmUDVuz3pHfZeh3UjPU/n41zc41pPqNRpbkR4Dnd/P8zrIfgRjUw/EE8cJYa\nYScCwT5Ts0du09A5qE6bAf8zoDBWaGfA3iHXATEWYac4ZEr1RN/bcqZnPk+eZgEv\n4aSErdMvOTAij54JqsKHg2A5U7DpClj7jWGE96SbVE7ewcBaBLAnbaszIYKeQqI0\nfRQpiXz4YlgaS/k9OZHlkzRXMp3dAXiLtnTYtkx5VQKBgQC7UXZ/Fi4uV0iCGr3v\nTjqTY5tVrinBBvZo4uJx7ueB+DrncHy7FLcMmmhZ5D21/hq/j0idx5FuTtdAaGoH\nf1hXYHWI6pBMcbSFFZIaiD4ze/zumGkPY+Cy860uKqkv+kuvgohfqdodtItiY4MF\nTLvTX6bSDopgKS29j737sf68RwKBgQC2igvvyPA/0Ogc38V7MGNLxtY5E3HacbcP\ncOZjMaGELL9fIGYp01ck31MX0FBLuVsnwR5+7xxsUizRpZDCC7omHX4T3kiug7GF\nnZ2+PxnYKPz424a33N5vLnjSUEswdV9M8mAnVtbBdG3V99kA985UKPkNfxlbY2py\nnhYAnIy0qwKBgQCOoVLnJg53/sIZPx+MzjZP8DJhJUJp1lFeQBRIyK7DCi5f+Akh\nsn5HPHNkryRGJXxcjE+wxDr6kVHZmyfRGag8sBgO7vx9GL9p7qjXRxKFxU0sqCSn\nMVfxKxac5qL5A08KDwykOwL4R3cyra8gI/OI2XZ+z8+RtQk9I+x3cGsVFQKBgCXJ\nAZuLHqA3IDUJ5RkQ9Rz0ddeuvLyZGWmq1yXlWifAE4UfccZqpvlMvlM+ShOyLBEGChs\ng2GHIX0SrZBgE0z3nHrTVAvM0YK+Y/rim4qMCU+DfIoO9x4MLEcbeYsfb9ECGs4U\nxe6evSmibjICcfsPULh/Gr6+doNCWwCK1McfoMitAoGACPRI3rGyg6fk+8M3yNrq\nTSIAwfSMqnwGapqfDiR+VilAl7XWSnpflz6RnvnA2ptF1ha0gvFnrLJYSWslnoZP\nQGXIvyOL21qHO9Jx4c4Ba3elpaXox1XXOW+NpC7bFISURGTTwD9OyJlvKOT71jg4\ndTiSG6XlMK/0oRPRcgtrqNs=\n-----END PRIVATE KEY-----\n"

# Google OAuth
echo "🔑 Configurando Google OAuth..."
vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID production <<< "511546212594-2n67bqufe9h562fl41bfe0a7c37k98q6.apps.googleusercontent.com"
vercel env add GOOGLE_CLIENT_SECRET production <<< "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"

# App Configuration
echo "⚙️ Configurando App..."
vercel env add NEXT_PUBLIC_APP_URL production <<< "https://octopus-byh0hk7ri-arichicho1-gmailcoms-projects.vercel.app"
vercel env add NODE_ENV production <<< "production"
vercel env add ENCRYPTION_KEY production <<< "fb22371513fe03ea9a4d18d1dfa07f5e08a8cbdbf5285902f4377a72b367ca6e"

echo "✅ Variables de entorno configuradas!"
echo "🔄 Redesplegando aplicación..."
vercel --prod

echo "🎉 ¡Despliegue completado!"
echo "🌐 URL: https://octopus-byh0hk7ri-arichicho1-gmailcoms-projects.vercel.app"
echo "📱 Mi Día: https://octopus-byh0hk7ri-arichicho1-gmailcoms-projects.vercel.app/dashboard/my-day"
