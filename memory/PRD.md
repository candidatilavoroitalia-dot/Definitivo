# Parrucco - App Prenotazione Parrucchiere

## Descrizione
Applicazione web completa per la prenotazione di appuntamenti per un parrucchiere, con pannello di amministrazione e notifiche push.

## Stack Tecnologico
- **Backend:** FastAPI (Python) + MongoDB
- **Frontend:** React.js + Tailwind CSS + Shadcn/UI
- **Notifiche:** Push Notifications (PWA)
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
- [x] **Slot occupati visivamente sbarrati**: orari già prenotati mostrati in rosso con testo barrato
- [x] Legenda "Disponibile/Occupato" sotto gli orari
- [x] Riepilogo prenotazione prima della conferma
- [x] **Compatibilità mobile**: elementi touch-friendly

### Pannello Amministratore
- [x] Dashboard con statistiche (totale, in attesa, confermati)
- [x] **Sezione prioritaria "Appuntamenti di Oggi"**
- [x] Filtri per data e stato (select HTML nativi per compatibilità mobile)
- [x] **Conferma appuntamenti**
- [x] **Sposta appuntamenti** (modal con selezione nuova data/ora)
- [x] **Elimina appuntamenti** (rimozione definitiva)
- [x] Gestione Servizi (CRUD)
- [x] Gestione Parrucchieri (CRUD)
- [x] Impostazioni: testi homepage, immagine hero, giorni lavorativi, orari

### PWA
- [x] App installabile su mobile/desktop
- [x] Pulsante "Scarica App" nella homepage
- [x] Service Worker per funzionalità offline base

### Notifiche Appuntamenti (NUOVO)
- [x] Impostazioni notifiche nella dashboard cliente
- [x] Opzioni multiple selezionabili: 10 min, 30 min, 1 ora, 2 ore, 1 giorno prima
- [x] Preferenze salvate a livello utente nel database
- [x] Richiesta permesso Push Notification al salvataggio

## API Endpoints Principali
```
POST /api/auth/register - Registrazione
POST /api/auth/login - Login
GET /api/services - Lista servizi
GET /api/hairdressers - Lista parrucchieri
POST /api/availability - Verifica slot disponibili
POST /api/appointments - Nuova prenotazione (con validazione slot)
GET /api/appointments/my - Appuntamenti utente
GET /api/user/notification-preferences - Preferenze notifiche utente (NUOVO)
PUT /api/user/notification-preferences - Aggiorna preferenze notifiche (NUOVO)
GET /api/admin/appointments - Tutti gli appuntamenti (admin)
PATCH /api/admin/appointments/{id}/confirm - Conferma (admin)
PATCH /api/admin/appointments/{id} - Modifica/Sposta (admin)
DELETE /api/admin/appointments/{id} - Elimina (admin)
DELETE /api/admin/appointments-cancelled/all - Elimina tutti i cancellati (admin)
GET /api/settings - Impostazioni app
PUT /api/admin/settings - Aggiorna impostazioni (admin)
```

## Credenziali Test
- **Admin:** admin@parrucco.it / adminpassword
- **Cliente test:** cliente@test.com / test123456

## Stato: COMPLETATO ✅
Data ultimo aggiornamento: 31 Gennaio 2026

## Modifiche Recenti (31 Gen 2026)
- [x] Verificato e confermato funzionamento flusso prenotazione cliente (3 step)
- [x] Verificato e confermato creazione manuale appuntamenti admin
- [x] Aggiornato Service Worker a v9 per forzare aggiornamento cache
- [x] Reset password admin per test

## Modifiche Precedenti (30 Gen 2026)
- [x] Rimosso sistema WhatsApp/Twilio completamente
- [x] Eliminati tutti gli appuntamenti cancellati dal database
- [x] Rimossa sezione "Cancellati" dal pannello admin
- [x] Semplificati i filtri admin
- [x] Aggiunta pagina creazione manuale appuntamenti (/admin/nuovo)
- [x] Fix compatibilità mobile (elementi touch-friendly)

## Backlog / Miglioramenti Futuri
- [ ] Calendario visuale nella dashboard admin
- [ ] Export appuntamenti in CSV
- [ ] Sistema di recensioni clienti
- [ ] Report mensili automatici
