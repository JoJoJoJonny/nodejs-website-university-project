# 💡 Token Manager Project:

Ho immaginato una piattaforma pensata per incentivare il "buon comportamento", la partecipazione attiva e il completamento dei compiti.

I professori possono assegnare token agli studenti che si distinguono per impegno, partecipazione in classe o corretto svolgimento dei compiti.

Gli studenti, a loro volta, possono scambiarsi i token liberamente, ad esempio per condividere materiali di studio o aiutarsi tra pari.

Tutte le transazioni vengono registrate in una sezione dedicata, così da garantire trasparenza e tracciabilità. 

Ho inoltre aggiunto una classifica che mostra gli studenti col punteggio più alto: alla fine dell’anno, chi sarà in cima alla leaderboard riceverà un riconoscimento speciale!

---

# Screenshot:
Di seguito riporto degli screenshot esemplificativi dell'applicazione in funzione.

## Homepage:
![[screenshots/homepage.png]]

## Student View:




---

# Traccia:
Di seguito riporto la traccia originale del progetto, oggetto di valutazione per il corso "Tecnologie Informatiche per il Web".

## Introduzione al Progetto:
Le piattaforme di gestione token digitali permettono la creazione, l'assegnazione e lo scambio di "gettoni" virtuali che possono rappresentare valore, diritti di accesso, oggetti da collezione o altro.

Il progetto mira a costruire una piattaforma web semplificata per la gestione e lo scambio di token tra utenti.

## Livello 1: Gestione e Scambio di un Token Predefinito
L'applicazione web deve permettere agli utenti di:
- Registrarsi al servizio e accedere successivamente.
- Esiste un singolo tipo di token predefinito nel sistema (es. "CreditoBase" o "PuntoComunità").
- Un ruolo "Amministratore" (potrebbe essere un utente specifico pre-configurato) ha la capacità di "coniare" (creare) nuove unità di questo token e assegnarle a utenti specifici.
- Ogni utente può visualizzare il proprio saldo del token predefinito.
- Gli utenti possono trasferire quantità del proprio token ad altri utenti registrati sulla piattaforma, specificando l'utente destinatario e la quantità da inviare. Il sistema deve verificare che l'utente mittente possieda una quantità sufficiente di token per il trasferimento.
- Ogni utente può visualizzare uno storico delle proprie transazioni (token ricevuti e inviati).

### Esempio indicativo:
Conio e Assegnazione (Amministratore):
- L'Amministratore accede e assegna 100 "CreditiBase" all'utente Mario.
- Mario, accedendo, vede un saldo di 100 "CreditiBase".

Trasferimento tra Utenti:
- Mario decide di inviare 20 "CreditiBase" a Luigi.
- Mario specifica "Luigi" come destinatario e "20" come quantità.
- Il sistema verifica che Mario abbia almeno 20 CreditiBase. Il trasferimento avviene.
- Il saldo di Mario diventa 80 CreditiBase. Il saldo di Luigi (che magari era 0) diventa 20 CreditiBase.
- Nello storico di Mario compare "Inviati 20 CreditiBase a Luigi". Nello storico di Luigi compare "Ricevuti 20 CreditiBase da Mario".

### Obiettivo funzionale:
Realizzare un sistema base per la gestione di un singolo tipo di token digitale, includendo la sua creazione da parte di un amministratore, la visualizzazione dei saldi e la possibilità per gli utenti di scambiarselo, con tracciamento delle transazioni.

---
