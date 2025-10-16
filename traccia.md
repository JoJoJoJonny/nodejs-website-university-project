# Indicazioni generali

Vi proponiamo specifiche articolate su tre livelli progressivi di difficoltà.

## Livello 1 (Applicazione Diretta e Adattamento)
Qui è richiesto di utilizzare strumenti e tecniche viste nelle lezioni, in modo simile a quanto visto.
Ovviamente la dimensione o la complessità dell'applicazione potrebbe essere leggermente maggiore.
L'obiettivo principale è dimostrare di saper adattare quanto appreso a un'applicazione "nuova".

## Livello 2: (Uso Creativo e Approfondimento Tecnico)
Qui si richiede un passo avanti: utilizzare gli strumenti presentati in modo un po' più originale, "spremendosi le meningi" per risolvere problemi più articolati. Pensate, ad esempio, a query al database più complesse, alla progettazione di endpoint parametrici più strutturati, o a logiche di business più elaborate.

## Livello 3: (Esplorazione Autonoma e Innovazione)
Questo è pensato per chi desidera spingersi oltre, richiedendo l'utilizzo di tecnologie o concetti non necessariamente trattati in dettaglio nelle slide.
L'idea è di richiedere uno sforzo personale di ricerca, comprensione e implementazione (ad esempio, l'utilizzo di WebSockets per aggiornamenti della pagina in tempo reale, l'integrazione di API esterne, o l'esplorazione di nuovi paradigmi di sviluppo).

Nota importante: visto lo "spirito" del livello 3, se avete qualche idea interessante potete proporre una vostra estensione di livello 3, alternativa a quella della specifica.
L'idea è che l'implementazione dell'estensione richieda/utilizzi uno strumento non trattato nella lezioni.

---

# Criteri di Valutazione:

La valutazione del progetto terrà in considerazione i seguenti aspetti:
- Aderenza alle Specifiche: La capacità di realizzare le funzionalità richieste per il livello (o i livelli) affrontato.
- Motivazione delle Scelte Progettuali: La chiarezza e la logica con cui saprete giustificare le decisioni tecniche e architetturali adottate.
- Qualità del Risultato Finale:
  - Si valuterà l'usabilità generale dell'applicazione e la sua funzionalità. 
  - Importante: Non sono richieste competenze specifiche di grafica o User Experience (UX) design. Tuttavia, cercheremo di valutare e valorizzare l'attenzione e la cura nel realizzare un'applicazione che risulti "gradevole" e intuitiva da utilizzare.

---

# Corrispondenza Livelli e Valutazione:
Completando con successo il Livello 1, si potrà ambire a una valutazione massima di 24/30.

Affrontando e realizzando efficacemente anche il Livello 2, si potrà raggiungere la valutazione piena (30/30).

Chi punta al massimo risultato, inclusa la lode, è fortemente incoraggiato a cimentarsi con le sfide proposte dal Livello 3.

---

# Piattaforma di Scambio Token Digitali
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



