# ContoChiaro

Applicazione Next.js per organizzare fatture, incassi, clienti, accantonamenti e stime del regime forfettario italiano. Backend e account reali tramite Supabase. Deploy previsto su Vercel.

**Per metterla online: leggere [GUIDA-ONLINE.md](docs/GUIDA-ONLINE.md).**

## Avvio locale

Richiede Node.js 22.14 o superiore. Nella cartella del progetto:

```sh
npm ci
npm run dev
```

Aprire http://localhost:3000. Senza configurazione si apre `/demo`, con dati fittizi separati dal database. La demo conserva le modifiche durante la navigazione, le ripristina ricaricando la pagina e non crea account.

Per account reali, copiare `.env.example` in `.env.local`, inserire URL e chiavi del proprio progetto Supabase, applicare **tutte** le migrazioni in `supabase/migrations/`, poi `supabase/seed.sql`. Riavviare l'app. Nessuna chiave privilegiata è inviata al browser.

## Funzionalità

- Registrazione email/password, conferma email, login/logout, recupero e modifica password, esportazione ed eliminazione account.
- Profilo personale e fiscale annuale; parametri espliciti e configurazioni centrali versionate.
- Rubrica clienti, fatture con righe, ricerca, filtri, ordinamento, paginazione, dettaglio e modifiche.
- Incassi separati, parziali o completi; importi residui protetti anche nel database.
- Riserve con versamenti/prelievi, versamenti fiscali distinti per anno di competenza e data di pagamento.
- Stime spiegate, simulatore indipendente, dashboard e scadenze personali/stimate/verificate.
- RLS su tutte le tabelle personali; FK composite per impedire relazioni tra utenti diversi; storico modifiche fiscali.

## Verifiche

```sh
npm run typecheck
npm run lint
npm run test -- --configLoader runner
npm run build
npm run test:e2e
```

I test database eseguono il SQL su PostgreSQL embedded PGlite con ruoli `anon` e `authenticated` e una funzione `auth.uid()` equivalente per i test. Verificano isolamento, privilegi, incassi parziali, sovraincasso e cancellazione. Non sostituiscono una prova su un vero progetto Supabase.

I test browser usano Chromium: installarlo con `npx playwright install chromium`, oppure impostare `PLAYWRIGHT_CHANNEL=chrome` per Google Chrome già installato. Per i test Auth live usare esclusivamente un progetto Supabase di prova e le variabili `TEST_SUPABASE_*`, poi `npm run test:integration`. Non usare dati di produzione.

## Limiti dichiarati

Non invia fatture SDI, non versa F24 e non produce dichiarazioni fiscali. Le stime non sono consulenza fiscale. L'ammissibilità al regime, la corretta associazione ATECO/coefficiente, più attività con coefficienti diversi e casi previdenziali speciali richiedono verifica professionale. Le configurazioni nuove non sono pubblicate automaticamente ogni anno: il gestore deve aggiungere una nuova versione nel database.

Le scadenze ufficiali devono essere inserite con fonte e data di verifica. Le riserve non sono conti bancari: se utilizzate per un versamento, registrare il corrispondente prelievo negativo. Eventuali crediti eccedenti sono mostrati separatamente, senza compensazione automatica fra tributi.

Privacy, Termini e Cookie sono documenti da completare con revisione legale e organizzativa prima dell'apertura commerciale. Non è dichiarata conformità GDPR automatica. Nessun sistema di abbonamento o addebito ai clienti è incluso: il documento richiedeva gestione multiutente, non billing SaaS.

## Organizzazione

- `app/`: pagine, autenticazione e API protette.
- `components/`: interfaccia e moduli riutilizzabili.
- `lib/`: validazione, Supabase e dati demo separati.
- `services/`: motore fiscale puro e aggregazioni.
- `supabase/`: migrazioni, configurazione CLI e seed delle regole.
- `tests/`: motore, SQL/RLS, browser e integrazione Auth.
- `docs/ARCHITETTURA.md`: decisioni e modello di sicurezza.

Importi SQL `numeric`, calcoli fiscali con `decimal.js`, arrotondamento a due decimali HALF_UP. Configurazioni fiscali 2026 iniziali con fonti nel seed, da confermare in base alla posizione individuale. Non inserire chiavi, `.env.local`, build o `node_modules` nel repository.
