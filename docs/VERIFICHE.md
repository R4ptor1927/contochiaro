# Verifiche della consegna

Verifica locale del 30 settembre 2026.

- TypeScript: controllo superato.
- Build Next.js di produzione: completata.
- Lint: nessun errore; avvisi di stile per navigazioni con ricaricamento completo dopo login/logout e download.
- Motore fiscale, validazione e PostgreSQL/RLS: 32 test superati.
- Browser Google Chrome: 3 test superati, inclusi creazione cliente → fattura → incasso parziale → simulatore, pagina registrazione senza configurazione e navigazione mobile senza overflow orizzontale.
- Dipendenze: audit npm senza vulnerabilità segnalate al controllo.
- Layout registrazione e dashboard: screenshot verificati.

## Non verificato senza configurazione esterna

Non è stato creato un progetto Supabase o Vercel, non è stato eseguito un deploy pubblico e non sono state spedite email reali. Registrazione, verifica email, recupero e cancellazione sono implementati contro Supabase; la prova completa sul progetto del gestore richiede le configurazioni descritte nella guida online.

Il test `test:integration` è predisposto per un Supabase dedicato di prova: crea due account temporanei, verifica identità e isolamento e li elimina. Non simula SMTP. Se mancano le variabili TEST_SUPABASE, termina con un messaggio esplicito anziché dichiarare un successo.

Il database locale dei test usa PostgreSQL embedded PGlite. Verifica il SQL, i vincoli e le policy reali con identità simulate; non certifica le impostazioni di un'istanza Supabase remota.

## Confini del prodotto

Gestione interna, non invio SDI; stime fiscali, non dichiarazioni o F24; nessun addebito automatico degli abbonamenti. Supporta un'attività e coefficiente per profilo annuale. Parametri individuali, agevolazioni, altre casse, regime ordinario, più attività e validità fiscale complessiva richiedono verifica professionale. Privacy e Termini richiedono completamento prima del lancio commerciale.
