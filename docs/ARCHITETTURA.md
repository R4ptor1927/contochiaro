# ContoChiaro — decisioni prima dell'implementazione

## 1. Architettura
Next.js App Router, React, TypeScript strict, Tailwind 4; Supabase PostgreSQL e Auth; Vercel. Route server autenticano ogni accesso con getUser. Client React chiama API same-origin; la chiave privilegiata è utilizzata esclusivamente dal server per eliminare l'account autenticato dopo riautenticazione. Nessuna dipendenza dai servizi Sites: prevale lo stack richiesto.

## 2. Schema
profiles 1—N fiscal_profiles (un profilo per anno), clients 1—N invoices 1—N invoice_items e payments; tax_payments, savings_reserves, deadlines, tax_estimates, activity_logs appartengono all'utente. tax_configurations contiene versioni pubbliche in sola lettura con fonti e validità. Ogni relazione privata usa FK composite (id,user_id), impedendo riferimenti cross-user anche fuori dall'app. Importi PostgreSQL numeric(14,2); calcoli decimal.js e arrotondamento HALF_UP. Totali fattura derivati da righe nella transazione SQL. Lock sulla fattura per serializzare gli incassi.

## 3. Flusso
Registrazione → conferma email → login → onboarding in tre passi → dashboard. Fattura → incassi parziali/completi → stima per cassa → registrazione riserve/versamenti. Le scadenze personali/stimate non diventano ufficiali senza fonte e data di verifica. Demo in memoria su /demo, indipendente da Auth e database; refresh ripristina i dati.

## 4. Repository
app/ (route, layout, API), components/ (UI e funzionalità), lib/ (Supabase, schemi, dati), services/ (motore fiscale e aggregazioni), types/, supabase/migrations/, tests/ (unitari, database, integrazione, browser), docs/. Separazione per responsabilità; nessuna formula fiscale nei componenti.

## 5. Sicurezza
RLS SELECT/INSERT/UPDATE/DELETE con auth.uid() = user_id; le tabelle di storico sono append-only, scritte da trigger/funzioni controllate. API rifiuta mutazioni cross-origin, valida payload con Zod e non accetta user_id. Supabase RLS resta il confine di sicurezza anche per chiamate REST dirette. Vincoli SQL proteggono date/importi/stati e transazioni; invoker RPC per fatture. Recupero password PKCE; redirect fisso same-origin. Password mai nei log. Esportazione autenticata; cancellazione account con password e cascade. Configurazioni centrali modificabili solo da amministrazione SQL.

## 6. Motore fiscale
Strategie Gestione Separata, Artigiani, Commercianti e personalizzata. Parametri versionati; profilo annuale salva una copia esplicita dei valori. Incassi per data di pagamento (anche fatture di anni precedenti), deduzioni dei contributi effettivamente pagati nell'anno, crediti distinti per imposta e contributi e anno di competenza. Acconti futuri opzionali espliciti, mai doppio conteggio automatico. Risultati con formule, parametri, anno, versione, avvertenze. Oltre soglia di uscita immediata: stima non utilizzabile per regime ordinario. Altre casse/agevolazioni richiedono configurazione professionale. Disponibilità è una stima sui flussi registrati, non un saldo bancario.

## 7. Roadmap
1 fondazioni/schema/Auth; 2 onboarding; 3 documenti/clienti/incassi; 4 motore/riserve; 5 dashboard; 6 scadenze/versamenti; 7 simulatore; 8 test e sicurezza; 9 accessibilità/responsive; 10 pacchetto deployment. Ad ogni fase typecheck/lint/build; schema verificato con PostgreSQL embedded compatibile, integrazione Supabase live separata richiede progetto di test. Nessuna dichiarazione di verifica remota senza esecuzione.
