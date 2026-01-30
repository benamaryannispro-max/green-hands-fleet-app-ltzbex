# Système d'Authentification GREEN HANDS

## Vue d'ensemble

Le système d'authentification a été reconstruit depuis zéro avec deux méthodes de connexion distinctes :

### 1. Connexion Chef d'équipe (Email + Mot de passe)
- **Rôles**: `team_leader`, `admin`
- **Endpoint**: `POST /api/auth/sign-in/email`
- **Identifiants de test**:
  - Email: `contact@thegreenhands.fr`
  - Mot de passe: `Lagrandeteam13`
  - Rôle: `team_leader`

### 2. Connexion Chauffeur (Téléphone uniquement)
- **Rôle**: `driver`
- **Endpoint**: `POST /api/auth/sign-in/phone`
- **Condition**: Le chauffeur doit exister dans la base et avoir `isApproved = true`

## Endpoints d'Authentification

### POST /api/auth/sign-in/email
Connexion pour chef d'équipe ou administrateur.

**Request Body:**
```json
{
  "email": "contact@thegreenhands.fr",
  "password": "Lagrandeteam13"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "contact@thegreenhands.fr",
    "firstName": "Admin",
    "lastName": "Test",
    "role": "team_leader",
    "isApproved": true,
    "isActive": true
  },
  "sessionToken": "random-token"
}
```

**Erreurs possibles:**
- `400`: Email ou mot de passe manquant
- `401`: Email ou mot de passe incorrect
- `403`: L'utilisateur n'a pas le rôle approprié pour cette méthode de connexion

---

### POST /api/auth/sign-in/phone
Connexion pour chauffeur.

**Request Body:**
```json
{
  "phone": "+33612345678"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "phone": "+33612345678",
    "firstName": "John",
    "lastName": "Doe",
    "role": "driver",
    "isApproved": true,
    "isActive": true
  },
  "sessionToken": "random-token"
}
```

**Erreurs possibles:**
- `400`: Numéro de téléphone manquant
- `404`: Numéro de téléphone non reconnu
- `403`: Votre compte est en attente d'approbation (ou compte désactivé)

---

### GET /api/auth/session
Récupère les informations de la session courante.

**Headers:**
```
Cookie: sessionToken=random-token
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "contact@thegreenhands.fr",
    "phone": null,
    "firstName": "Admin",
    "lastName": "Test",
    "role": "team_leader",
    "isApproved": true,
    "isActive": true
  }
}
```

**Erreurs possibles:**
- `401`: Aucune session active

---

### POST /api/auth/sign-out
Déconnecte l'utilisateur actuel.

**Headers:**
```
Cookie: sessionToken=random-token
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

## Gestion des Sessions

Les sessions sont stockées en mémoire (idéal pour développement/test). En production, utilisez Redis ou une base de données persistante.

### Transmission du Token de Session

Le token de session peut être transmis de **deux façons** (priorité donnée au Bearer token):

#### 1. Authorization Header (Bearer Token) - Recommandé pour mobile
```
Authorization: Bearer <sessionToken>
```

Exemple:
```
Authorization: Bearer abc123def456ghi789
```

#### 2. Cookie HTTP - Recommandé pour web
- **Nom**: `sessionToken`
- **Durée**: 24 heures
- **HTTP Only**: Oui
- **Secure**: Non (dev mode)
- **SameSite**: Lax

Exemple:
```
Cookie: sessionToken=abc123def456ghi789
```

**Priorité**: Si les deux sont présents, le Bearer token est utilisé en priorité.

## Structure de la Table `users`

```typescript
{
  id: text (primary key)              // UUID
  email: text (nullable, unique)      // Pour les chefs d'équipe
  phone: text (nullable, unique)      // Pour les chauffeurs
  password: text (nullable)           // Hash bcrypt (chefs d'équipe uniquement)
  firstName: text (required)
  lastName: text (required)
  role: enum ['driver', 'team_leader', 'admin']
  isApproved: boolean (default: false)
  isActive: boolean (default: true)
  createdAt: timestamp
  updatedAt: timestamp
}
```

## Endpoints Protégés avec Bearer Token

Tous les endpoints protégés acceptent le sessionToken soit via:
- **Bearer Token** (recommandé pour applications mobiles)
- **Cookie** (recommandé pour applications web)

### Exemple avec Bearer Token:

```bash
curl -X GET http://localhost:3000/api/vehicles \
  -H "Authorization: Bearer <sessionToken>"
```

### Exemple avec Cookie:

```bash
curl -X GET http://localhost:3000/api/vehicles \
  -H "Cookie: sessionToken=<sessionToken>"
```

Les deux méthodes fonctionnent sur **tous** les endpoints authentifiés.

## Middleware d'Authentification

Utilisé par tous les endpoints protégés.

### `requireAuth(app)`
Vérifie qu'une session valide existe (Bearer token ou Cookie).

### `requireDriver(app)`
Vérifie que la session appartient à un chauffeur.

### `requireTeamLeaderOrAdmin(app)`
Vérifie que la session appartient à un chef d'équipe ou admin.

### `requireAdmin(app)`
Vérifie que la session appartient à un administrateur.

## Test Utilisateur Automatique

Au démarrage du serveur, un utilisateur de test est créé automatiquement s'il n'existe pas:

- **Email**: `contact@thegreenhands.fr`
- **Mot de passe**: `Lagrandeteam13`
- **Prénom**: `Admin`
- **Nom**: `Test`
- **Rôle**: `team_leader`
- **Approuvé**: Oui
- **Actif**: Oui

Vérifiez dans les logs du serveur:
```
✅ Utilisateur test créé: contact@thegreenhands.fr
```
ou
```
✅ Utilisateur test déjà existant: contact@thegreenhands.fr
```

## Messages d'erreur en Français

Tous les messages d'erreur et réponses d'authentification sont en français pour une meilleure expérience utilisateur.

Exemples:
- "Email et mot de passe requis"
- "Numéro de téléphone non reconnu"
- "Votre compte est en attente d'approbation"
- "Accès refusé. Rôle chauffeur requis"

## Architecture

```
/app/code/backend/
├── src/
│   ├── routes/
│   │   ├── auth.ts                 # Endpoints d'authentification
│   │   ├── users.ts                # Gestion des utilisateurs
│   │   └── ...
│   ├── utils/
│   │   └── auth.ts                 # Middlewares et utilitaires d'auth
│   ├── db/
│   │   └── schema.ts               # Schéma Drizzle ORM
│   └── index.ts                    # Point d'entrée
└── drizzle/
    └── *.sql                       # Migrations
```

## Notes Importantes

1. **Pas de Better Auth**: Le système a été entièrement personnalisé sans dépendance externe.
2. **Sessions en mémoire**: Parfait pour dev, mais nécessite une solution persistante en production.
3. **Bcrypt**: Utilisé pour le hachage des mots de passe (force: 10).
4. **Cookies HTTP-Only**: Pour la sécurité contre les attaques XSS.
