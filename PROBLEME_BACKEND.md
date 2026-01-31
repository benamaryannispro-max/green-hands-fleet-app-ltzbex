
# 🚨 Problème: Backend non disponible

## Symptôme
L'application affiche l'erreur suivante lors de la connexion:
```
❌ Backend non disponible
Le serveur backend n'est pas accessible.

Code d'erreur: Backend introuvable (404)
```

## Cause
Le backend n'est pas déployé ou l'URL configurée dans `app.json` est incorrecte.

URL actuelle: `https://rpc6sxjj85p45v32bk69yeg2mmejz38r.app.specular.dev`

## Solution

### Option 1: Déployer le backend (Recommandé)

Le code backend existe dans le dossier `backend/` mais n'est pas déployé. Vous devez:

1. **Vérifier que le backend est prêt:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Déployer le backend sur Specular ou un autre service:**
   - Le backend utilise Fastify + Drizzle ORM
   - Base de données PostgreSQL requise
   - Variables d'environnement nécessaires (voir `backend/README.md`)

3. **Mettre à jour l'URL dans `app.json`:**
   ```json
   {
     "expo": {
       "extra": {
         "backendUrl": "https://VOTRE-NOUVELLE-URL.com"
       }
     }
   }
   ```

### Option 2: Utiliser un backend de test local

Pour tester localement:

1. **Démarrer le backend en local:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Utiliser ngrok pour exposer le backend:**
   ```bash
   ngrok http 3000
   ```

3. **Mettre à jour `app.json` avec l'URL ngrok:**
   ```json
   {
     "expo": {
       "extra": {
         "backendUrl": "https://VOTRE-URL-NGROK.ngrok.io"
       }
     }
   }
   ```

4. **Redémarrer l'application Expo:**
   ```bash
   npm run dev
   ```

## Vérification

Une fois le backend déployé, vous devriez pouvoir:

1. ✅ Se connecter avec les identifiants chef d'équipe:
   - Email: `contact@thegreenhands.fr`
   - Mot de passe: `Lagrandeteam13`

2. ✅ Accéder au tableau de bord

3. ✅ Utiliser toutes les fonctionnalités de l'application

## Endpoints requis

Le backend doit exposer les endpoints suivants:

### Authentification
- `POST /api/auth/sign-in/email` - Connexion chef d'équipe
- `POST /api/auth/sign-in/phone` - Connexion chauffeur
- `GET /api/auth/session` - Vérifier la session
- `POST /api/auth/sign-out` - Déconnexion

### Gestion des chauffeurs
- `GET /api/users/drivers` - Liste des chauffeurs
- `POST /api/users/drivers` - Ajouter un chauffeur
- `PUT /api/users/drivers/:id/approve` - Approuver un chauffeur
- `PUT /api/users/drivers/:id/revoke` - Révoquer un chauffeur

### Shifts
- `GET /api/shifts/active` - Shift actif
- `POST /api/shifts/start` - Démarrer un shift
- `PUT /api/shifts/:id/end` - Terminer un shift

### Inspections
- `POST /api/inspections` - Créer une inspection
- `GET /api/inspections/failed` - Inspections échouées

### Véhicules
- `GET /api/vehicles` - Liste des véhicules
- `POST /api/vehicles` - Ajouter un véhicule

### Maintenance
- `GET /api/maintenance` - Logs de maintenance
- `POST /api/maintenance` - Ajouter un log
- `PUT /api/maintenance/:id` - Mettre à jour un log

### Alertes
- `GET /api/alerts` - Liste des alertes
- `PUT /api/alerts/:id/read` - Marquer comme lu

### Localisation
- `POST /api/location/update` - Mettre à jour la position
- `GET /api/location/drivers` - Positions des chauffeurs

## Support

Si le problème persiste après avoir déployé le backend:

1. Vérifiez les logs du backend
2. Vérifiez que la base de données est accessible
3. Vérifiez que les variables d'environnement sont correctes
4. Testez les endpoints avec Postman ou curl

## Contact

Pour toute question, contactez l'équipe de développement.
