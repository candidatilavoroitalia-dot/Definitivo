# Parrucco - App Prenotazione Parrucchiere

## Descrizione
Applicazione web completa per la prenotazione di appuntamenti per un parrucchiere, con pannello di amministrazione e notifiche WhatsApp.

## Stack Tecnologico
- **Backend:** FastAPI (Python) + MongoDB
- **Frontend:** React.js + Tailwind CSS + Shadcn/UI
- **Notifiche:** Twilio WhatsApp API
- **Mobile:** Progressive Web App (PWA)

## Funzionalità Implementate ✅

### Autenticazione
- [x] Registrazione utenti con email, password, nome, telefono
- [x] Login con JWT token (validità 7 giorni)
- [x] Ruolo admin separato da utente normale

### Prenotazione Appuntamenti
- [x] Flusso 3 step: Servizio → Parrucchiere → Data/Ora
- [x] Calendario con date disabilitate (domenica, giorni passati, giorni non lavorativi)
- [x] **Sistema disponibilità avanzato**: mostra solo slot liberi
- [x] **Validazione backend**: blocca prenotazioni su slot già occupati
- [x] Riepilogo prenotazione prima della conferma

### Pannello Amministratore
- [x] Dashboard con statistiche (totale, in attesa, confermati, cancellati)
- [x] **Sezione prioritaria "Appuntamenti di Oggi"**
- [x] Filtri per data e stato
- [x] **Conferma appuntamenti** (con notifica WhatsApp)
- [x] **Annulla appuntamenti** (cambia stato a cancelled)
- [x] **Sposta appuntamenti** (modal con selezione nuova data/ora)
- [x] **Elimina appuntamenti** (rimozione definitiva)
- [x] Gestione Servizi (CRUD)
- [x] Gestione Parrucchieri (CRUD)
- [x] Impostazioni: testi homepage, immagine hero, giorni lavorativi, orari

### PWA
- [x] App installabile su mobile/desktop
- [x] Pulsante "Scarica App" nella homepage
- [x] Service Worker per funzionalità offline base

### Notifiche WhatsApp (RICHIEDE CREDENZIALI TWILIO)
- [x] Notifica al cliente alla conferma dell'appuntamento
- [x] Notifica all'admin per ogni nuova prenotazione
- [x] Promemoria 1 ora prima (scheduler APScheduler)

## API Endpoints Principali
```
POST /api/auth/register - Registrazione
POST /api/auth/login - Login
GET /api/services - Lista servizi
GET /api/hairdressers - Lista parrucchieri
POST /api/availability - Verifica slot disponibili
POST /api/appointments - Nuova prenotazione (con validazione slot)
GET /api/appointments/my - Appuntamenti utente
GET /api/admin/appointments - Tutti gli appuntamenti (admin)
PATCH /api/admin/appointments/{id}/confirm - Conferma (admin)
PATCH /api/admin/appointments/{id} - Modifica/Sposta/Annulla (admin)
DELETE /api/admin/appointments/{id} - Elimina definitivamente (admin)
GET /api/settings - Impostazioni app
PUT /api/admin/settings - Aggiorna impostazioni (admin)
```

## Credenziali Test
- **Admin:** admin@parrucco.it / admin123

## Configurazione WhatsApp (opzionale)
Per abilitare le notifiche WhatsApp, aggiungere in `backend/.env`:
```
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_NUMBER=+14155238886
```

## Stato: COMPLETATO ✅
Data ultimo aggiornamento: 30 Gennaio 2026

## Bug Fix Recenti
- [x] Validazione slot occupati nel backend (impedisce doppie prenotazioni)
- [x] UI admin per spostare/annullare/eliminare appuntamenti

## Backlog / Miglioramenti Futuri
- [ ] Calendario visuale nella dashboard admin
- [ ] Export appuntamenti in CSV
- [ ] Notifiche email (alternativa a WhatsApp)
- [ ] Sistema di recensioni clienti
- [ ] Report mensili automatici
