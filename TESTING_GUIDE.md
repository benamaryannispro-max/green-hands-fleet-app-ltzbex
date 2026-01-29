
# 🧪 GREEN HANDS - Complete Testing Guide

## 🚀 Quick Start

### 1. Start the Development Server
```bash
npm start
# or
npx expo start
```

### 2. Open the App
- **Web:** Press `w` in the terminal or open http://localhost:8081
- **iOS Simulator:** Press `i` in the terminal
- **Android Emulator:** Press `a` in the terminal
- **Physical Device:** Scan the QR code with Expo Go app

## 📋 Test Scenarios

### Scenario 1: Team Leader Login & Driver Management

#### Step 1: Login as Team Leader
1. Open the app
2. You should see the login screen with two tabs
3. Select the **"Chef d'équipe"** tab (should be selected by default)
4. Enter credentials:
   - **Email:** `contact@thegreenhands.fr`
   - **Password:** `Lagrandeteam13`
5. Click **"Se connecter"**
6. ✅ **Expected:** You should be redirected to the Team Leader Dashboard

#### Step 2: View Team Leader Dashboard
1. You should see:
   - Welcome message with your name
   - Role: "Chef d'équipe"
   - 6 menu cards:
     - Journal de bord
     - Approbation (Driver Management)
     - Scanner QR
     - Maintenance
     - Carte flotte (Fleet Map)
     - Rapports
2. ✅ **Expected:** All cards are visible and clickable

#### Step 3: Create a New Driver
1. Click on **"Approbation"** card
2. You should see three tabs: Actifs, En attente, Supprimés
3. Click the **"+"** button (floating action button in bottom right)
4. A modal should appear: "Ajouter un chauffeur"
5. Fill in the form:
   - **Téléphone:** `+33612345678`
   - **Prénom:** `Jean`
   - **Nom:** `Dupont`
6. Click **"Ajouter"**
7. ✅ **Expected:** Success message appears, driver appears in "En attente" tab

#### Step 4: Approve the Driver
1. Switch to **"En attente"** tab
2. You should see Jean Dupont with phone +33612345678
3. Click **"Approuver"** button
4. ✅ **Expected:** Success message appears, driver moves to "Actifs" tab

#### Step 5: Logout
1. Click the logout icon in the top right (arrow icon)
2. ✅ **Expected:** You are redirected to the login screen

---

### Scenario 2: Driver Login & Shift Management

#### Step 1: Login as Driver
1. On the login screen, select the **"Chauffeur"** tab
2. Enter phone number: `+33612345678`
3. Click **"Se connecter"**
4. ✅ **Expected:** You should be redirected to the Driver Dashboard

#### Step 2: View Driver Dashboard
1. You should see:
   - Welcome message: "Bonjour, Jean Dupont"
   - Status card showing "Shift inactif" (red indicator)
   - Button: "Début de shift"
2. ✅ **Expected:** Dashboard shows inactive shift status

#### Step 3: Start a Shift
1. Click **"Début de shift"**
2. **IMPORTANT:** When prompted, grant location permissions
   - iOS: "Allow While Using App" or "Always Allow"
   - Android: "Allow all the time" or "Allow only while using the app"
3. ✅ **Expected:** 
   - Success modal appears: "Shift démarré"
   - Status changes to "Shift actif" (green indicator)
   - Two action buttons appear:
     - "Inspection d'équipement (Départ)"
     - "Nombre de batteries au départ"
   - "Fin de shift" button appears

#### Step 4: Complete Departure Inspection
1. Click **"Inspection d'équipement (Départ)"**
2. You should see the inspection form
3. **Video Section:**
   - Click "Enregistrer une vidéo"
   - ✅ **Expected:** Button changes to "Vidéo enregistrée" (green)
4. **Safety Items Section:**
   - For each item (Trousse de secours, Roue de secours, Extincteur, Booster batterie):
     - Click **"Oui"** if present
     - Click "Prendre une photo" (button appears)
     - ✅ **Expected:** Button changes to "Photo prise" (green)
     - OR click **"Non"** if not present
     - Enter a comment in the text field
5. Click **"Enregistrer l'inspection"**
6. ✅ **Expected:** Success message, redirected back to dashboard

#### Step 5: Record Departure Batteries
1. Click **"Nombre de batteries au départ"**
2. Fill in the form:
   - **Nombre de batteries:** Enter a number (e.g., `10`)
   - Click **"Prendre une photo"**
   - ✅ **Expected:** Button changes to "Photo prise"
   - **Commentaire:** Enter text (e.g., "Toutes les batteries sont en bon état")
   - Click **"Signer"** for driver signature
   - ✅ **Expected:** Button changes to "Signé"
3. Click **"Enregistrer"**
4. ✅ **Expected:** Success message, redirected back to dashboard

#### Step 6: End the Shift
1. Click **"Fin de shift"**
2. ✅ **Expected:**
   - Success modal appears: "Shift terminé"
   - Status changes back to "Shift inactif"
   - Action buttons disappear
   - Location tracking stops

---

### Scenario 3: Fleet Map (Team Leader)

#### Step 1: Login as Team Leader
1. Logout from driver account
2. Login as team leader (contact@thegreenhands.fr / Lagrandeteam13)

#### Step 2: Start a Driver Shift (for testing)
1. Logout and login as driver (+33612345678)
2. Start a shift (see Scenario 2, Step 3)
3. Keep the shift active

#### Step 3: View Fleet Map
1. Logout and login as team leader again
2. Click **"Carte flotte"** on the dashboard
3. ✅ **Expected:**
   - You should see a map placeholder
   - Below the map, a list of active drivers
   - Jean Dupont should appear with:
     - Name
     - GPS coordinates
     - Last update timestamp
   - The list should update every 30 seconds

---

### Scenario 4: Driver Revoke & Restore

#### Step 1: Revoke Driver Access
1. As team leader, go to **"Approbation"**
2. In the **"Actifs"** tab, find Jean Dupont
3. Click **"Révoquer"**
4. ✅ **Expected:** Driver moves to "Supprimés" tab

#### Step 2: Test Revoked Login
1. Logout
2. Try to login as driver (+33612345678)
3. ✅ **Expected:** Login should fail with error message

#### Step 3: Restore Driver
1. Login as team leader
2. Go to **"Approbation"**
3. Switch to **"Supprimés"** tab
4. Find Jean Dupont
5. Click **"Restaurer"**
6. ✅ **Expected:** Driver moves back to "Actifs" tab

#### Step 4: Test Restored Login
1. Logout
2. Login as driver (+33612345678)
3. ✅ **Expected:** Login should succeed

---

## 🔍 What to Check

### ✅ Authentication
- [ ] Team leader can login with email/password
- [ ] Driver can login with phone number
- [ ] Session persists after app reload
- [ ] Logout works correctly
- [ ] Revoked drivers cannot login

### ✅ Driver Dashboard
- [ ] Shows correct user name
- [ ] Displays shift status correctly
- [ ] Start shift button works
- [ ] End shift button works
- [ ] Location permissions are requested
- [ ] Action buttons appear/disappear based on shift status

### ✅ Inspections
- [ ] Form validation works (all fields required)
- [ ] Video recording placeholder works
- [ ] Photo capture placeholder works
- [ ] Yes/No toggle works correctly
- [ ] Comment field appears when "Non" is selected
- [ ] Photo button appears when "Oui" is selected
- [ ] Submit button is disabled until form is complete
- [ ] Success message appears after submission

### ✅ Battery Records
- [ ] All fields are required
- [ ] Number input accepts only numbers
- [ ] Photo capture placeholder works
- [ ] Signature placeholder works
- [ ] Submit button is disabled until form is complete
- [ ] Success message appears after submission

### ✅ Team Leader Dashboard
- [ ] All menu cards are visible
- [ ] Navigation to each screen works
- [ ] Logout button works

### ✅ Driver Management
- [ ] Three tabs work correctly (Actifs, En attente, Supprimés)
- [ ] Add driver modal opens
- [ ] Add driver form validation works
- [ ] Approve button works
- [ ] Revoke button works
- [ ] Restore button works
- [ ] Driver counts update correctly

### ✅ Fleet Map
- [ ] Shows list of active drivers
- [ ] Displays GPS coordinates
- [ ] Shows last update timestamp
- [ ] Updates every 30 seconds
- [ ] Shows "Aucun chauffeur en service" when no active shifts

### ✅ Location Tracking
- [ ] Permissions are requested on shift start
- [ ] Location updates are sent every 30 seconds
- [ ] Tracking stops when shift ends
- [ ] Team leader can see driver locations

---

## 🐛 Common Issues & Solutions

### Issue: "Backend URL not configured"
**Solution:** The backend URL is already configured in `app.json`. Restart the dev server.

### Issue: "Authentication token not found"
**Solution:** Login again. The token may have expired.

### Issue: Location permissions not working
**Solution:** 
- iOS: Go to Settings > Privacy > Location Services > Expo Go > Allow
- Android: Go to Settings > Apps > Expo Go > Permissions > Location > Allow

### Issue: "Unable to resolve module"
**Solution:** Clear cache and restart:
```bash
npx expo start -c
```

### Issue: Login fails with "Échec de la connexion"
**Solution:** 
- Check that the backend is running
- Check network connection
- For drivers: Ensure the driver is approved by a team leader

---

## 📊 API Endpoints Being Tested

| Endpoint | Method | Tested By |
|----------|--------|-----------|
| `/api/auth/sign-in/email` | POST | Team leader login |
| `/api/auth/sign-in/phone` | POST | Driver login |
| `/api/auth/sign-out` | POST | Logout |
| `/api/users/drivers` | POST | Add driver |
| `/api/users/drivers` | GET | View drivers |
| `/api/users/drivers/:id/approve` | PUT | Approve driver |
| `/api/users/drivers/:id/revoke` | PUT | Revoke driver |
| `/api/users/drivers/:id/restore` | PUT | Restore driver |
| `/api/shifts/start` | POST | Start shift |
| `/api/shifts/:id/end` | PUT | End shift |
| `/api/shifts/active` | GET | View active shift |
| `/api/inspections` | POST | Submit inspection |
| `/api/battery-records` | POST | Submit battery record |
| `/api/location/update` | POST | Location tracking |
| `/api/location/fleet` | GET | Fleet map |

---

## 🎉 Success Criteria

The integration is successful if:
- ✅ All test scenarios pass without errors
- ✅ All API endpoints return expected responses
- ✅ UI updates correctly based on API responses
- ✅ Error messages are user-friendly
- ✅ Loading states appear during API calls
- ✅ Session persists across app reloads
- ✅ Location tracking works in foreground and background

---

## 📝 Notes

- **Camera Integration:** Video and photo capture are currently placeholders. They simulate successful uploads but don't actually capture media. This is ready for integration with `expo-camera`.

- **Signature Capture:** Signature functionality is a placeholder. It simulates a signature but doesn't actually capture one. This is ready for integration with a signature pad library.

- **Map Display:** The fleet map shows a list view instead of an actual map. This is ready for integration with `react-native-maps` or `react-leaflet`.

- **Background Location:** Background location tracking requires additional configuration in `app.json` for production builds. The current setup works for development.

---

## 🚀 Ready for Production

Once all tests pass, the app is ready for:
1. QA testing
2. User acceptance testing
3. Beta deployment
4. Production deployment

**Backend URL:** https://rpc6sxjj85p45v32bk69yeg2mmejz38r.app.specular.dev

Happy testing! 🎊
