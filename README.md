
# Green Hands Fleet

Application mobile de gestion de flotte et de shifts pour chauffeurs.

## 🚀 Démarrage

### Installation des dépendances
```bash
npm install
```

### Lancement de l'application
```bash
npm run dev
```

### Build iOS
Pour résoudre les problèmes de build iOS, suivez ces étapes:

1. **Nettoyage complet:**
```bash
rm -rf node_modules package-lock.json ios android
npm install
```

2. **Build avec EAS:**
```bash
eas build --platform ios --clear-cache
```

## 📱 Fonctionnalités

- **Authentification:** Connexion Chef d'équipe (email/mot de passe) et Chauffeur (téléphone)
- **Gestion des shifts:** Début/fin de shift avec tracking GPS automatique
- **Inspections:** Inspections d'équipement au départ et au retour avec photos/vidéos
- **Batteries:** Enregistrement du nombre de batteries avec signatures
- **Gestion de flotte:** Carte en temps réel, véhicules, maintenance
- **Alertes:** Centre d'alertes pour les chefs d'équipe
- **Rapports:** Historique des inspections et rapports

## 🔧 Technologies

- **Framework:** React Native + Expo 54
- **Navigation:** Expo Router
- **Authentification:** Better Auth
- **Backend:** https://rpc6sxjj85p45v32bk69yeg2mmejz38r.app.specular.dev
- **Caméra/QR:** expo-camera (migration depuis expo-barcode-scanner)
- **Localisation:** expo-location avec tracking en arrière-plan

## 📝 Notes importantes

- L'app utilise `expo-camera` pour le scan QR (expo-barcode-scanner a été supprimé pour compatibilité Expo 54)
- Le tracking GPS se lance automatiquement au début du shift
- Les inspections sont obligatoires avant de pouvoir terminer un shift

## 🔗 Repository

GitHub: https://github.com/benamaryannispro-max/green-hands-fleet-app-ltzbex.git

---

Made with 💙 using [Natively.dev](https://natively.dev)
