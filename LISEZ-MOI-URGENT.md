
# 🚨 PROBLÈME URGENT: L'application ne fonctionne pas

## Qu'est-ce qui ne va pas ?

Lorsque vous essayez de vous connecter, vous voyez ce message d'erreur:

```
❌ Backend non disponible
Le serveur backend n'est pas accessible.
```

## Pourquoi ?

**Le backend (serveur) n'est pas déployé.** L'application essaie de se connecter à:
```
https://rpc6sxjj85p45v32bk69yeg2mmejz38r.app.specular.dev
```

Mais ce serveur n'existe pas ou n'est plus actif.

## Comment réparer ?

### 🔧 Solution rapide (5 minutes)

1. **Ouvrez un terminal dans le dossier `backend/`:**
   ```bash
   cd backend
   ```

2. **Installez les dépendances:**
   ```bash
   npm install
   ```

3. **Démarrez le serveur en local:**
   ```bash
   npm run dev
   ```

4. **Dans un AUTRE terminal, installez ngrok:**
   ```bash
   npm install -g ngrok
   ```

5. **Exposez votre serveur local:**
   ```bash
   ngrok http 3000
   ```

6. **Copiez l'URL ngrok** (quelque chose comme `https://abc123.ngrok.io`)

7. **Modifiez le fichier `app.json`** à la ligne 44:
   ```json
   "backendUrl": "https://VOTRE-URL-NGROK.ngrok.io"
   ```

8. **Redémarrez l'application:**
   ```bash
   npm run dev
   ```

### ✅ Vérification

Essayez de vous connecter avec:
- **Email:** `contact@thegreenhands.fr`
- **Mot de passe:** `Lagrandeteam13`

Si ça fonctionne, vous verrez le tableau de bord ! 🎉

## Besoin d'aide ?

### Erreur "Database connection failed"
Vous devez configurer une base de données PostgreSQL. Voir `backend/README.md`

### Erreur "Port 3000 already in use"
Un autre programme utilise le port 3000. Changez le port dans `backend/src/index.ts`

### L'application se ferme immédiatement
Vérifiez les logs dans le terminal où vous avez lancé `npm run dev`

## Déploiement permanent

Pour un déploiement permanent (pas juste pour tester):

1. **Créez un compte sur Railway, Render, ou Heroku**
2. **Déployez le dossier `backend/`**
3. **Configurez une base de données PostgreSQL**
4. **Mettez à jour `app.json` avec la nouvelle URL**

## Structure du backend

Le backend est dans le dossier `backend/` et contient:
- ✅ Authentification (email + téléphone)
- ✅ Gestion des chauffeurs
- ✅ Gestion des shifts
- ✅ Inspections
- ✅ Véhicules
- ✅ Maintenance
- ✅ Alertes
- ✅ Localisation GPS

**Tout le code est prêt, il faut juste le déployer !**

## Questions fréquentes

**Q: Pourquoi le backend n'est pas déjà déployé ?**
R: Le backend a été développé mais jamais déployé sur un serveur permanent.

**Q: Combien de temps ça prend ?**
R: 5-10 minutes avec ngrok (temporaire), 30 minutes pour un déploiement permanent.

**Q: C'est gratuit ?**
R: Oui, ngrok et les services comme Railway ont des plans gratuits.

**Q: Je ne suis pas technique, que faire ?**
R: Contactez un développeur ou l'équipe technique pour déployer le backend.

---

**📞 Besoin d'aide immédiate ?**
Contactez l'équipe de développement avec ce message:
"Le backend GREEN HANDS n'est pas déployé. J'ai besoin d'aide pour le mettre en ligne."
