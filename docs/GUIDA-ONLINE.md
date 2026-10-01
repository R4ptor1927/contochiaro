# Mettere ContoChiaro online e attivare gli account personali

L'interfaccia locale è già utilizzabile in demo. Per registrare persone reali servono un progetto Supabase (account e database), un progetto Vercel (app online) e un servizio SMTP (invio delle email di verifica e recupero). Non occorre modificare il codice per collegarli.

## 1. Crea Supabase

1. Accedi a https://supabase.com e crea un nuovo progetto. Scegli preferibilmente una regione europea e conserva la password del database nel tuo gestore di password.
2. Attendi che il progetto sia pronto. Apri **SQL Editor → New query**.
3. Copia tutto il contenuto di `supabase/migrations/202609290001_core.sql` e premi **Run**. Eseguilo una sola volta su un progetto vuoto.
4. Esegui nello stesso modo `supabase/migrations/202609300002_estimate_snapshots.sql`.
5. Infine esegui `supabase/seed.sql`. Aggiunge soltanto configurazioni fiscali centrali, senza dati demo o account fittizi.
6. Nel progetto recupera **Project URL**, **Publishable key** e **Secret key** dalla sezione delle API Keys. La chiave Secret serve al server per eliminare l'account, non deve apparire in variabili che iniziano con `NEXT_PUBLIC_` e non va incollata in chat.

Alternativa per sviluppatori: collegare la CLI Supabase, eseguire `supabase db push` e applicare il seed centralizzato. Non applicare manualmente la prima migrazione una seconda volta.

## 2. Configura email e registrazioni

In **Authentication**:

1. Abilita il provider **Email**, le nuove registrazioni e **Confirm email**.
2. Imposta password minima a 12 caratteri; configura limiti di invio adatti al tuo servizio.
3. Configura **Custom SMTP** con un tuo fornitore di email transazionali, inserendo host, porta, utente, password e mittente verificato. Verifica il dominio secondo le indicazioni del fornitore.

**Questo passaggio è necessario per gli utenti reali:** il servizio email predefinito Supabase è limitato e non è destinato a un lancio pubblico. Non disabilitare la verifica email per aggirare un errore SMTP. Fonte: https://supabase.com/docs/guides/auth/auth-smtp

## 3. Carica il codice su GitHub

1. Crea un repository privato.
2. Carica il contenuto della cartella `contochiaro`, mettendo `package.json` alla radice.
3. Includi `.env.example`, `package-lock.json`, `supabase/`, `app/`, `components/`, `lib/`, `services/`, `types/`, `tests/` e le configurazioni.
4. Non caricare `.env.local`, `node_modules`, `.next`, log, screenshot dei test o chiavi reali. Il `.gitignore` è già predisposto.

Puoi farlo con GitHub Desktop: aggiungi la cartella come repository, crea il primo commit e scegli **Publish repository**, mantenendolo privato.

## 4. Crea il progetto Vercel

1. Accedi a https://vercel.com con GitHub.
2. Scegli **Add New → Project**, importa il repository e lascia **Framework: Next.js**.
3. Se il repository contiene direttamente `package.json`, lascia la Root Directory alla radice. Se hai caricato l'intera cartella superiore, seleziona `contochiaro` come Root Directory.
4. Scegli Node.js 22.x o superiore compatibile con Next.js. Lascia i comandi già forniti in `vercel.json`.
5. Aggiungi queste quattro **Environment Variables** per Production:

| Nome | Valore |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL di Supabase, ad esempio `https://PROGETTO.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key del tuo progetto |
| `SUPABASE_SECRET_KEY` | Secret key, soltanto server; marcarla sensibile |
| `APP_URL` | URL pubblico esatto dell'app, ad esempio `https://contochiaro-tuo.vercel.app`, senza percorso finale |

6. Premi **Deploy**. Se non conosci ancora l'URL, completa il primo deploy, copia l'URL assegnato, aggiorna `APP_URL` e fai **Redeploy**.
7. Ogni modifica alle variabili pubbliche richiede un nuovo deploy. Per le anteprime usare un progetto Supabase di staging e il relativo `APP_URL`, evitando dati reali.

Fonte: https://vercel.com/kb/guide/how-to-add-vercel-environment-variables

## 5. Collega i link email al sito online

In Supabase → Authentication → URL Configuration:

- **Site URL:** il valore esatto di `APP_URL`.
- **Redirect URLs:** aggiungi `https://TUO-DOMINIO/auth/callback`, `https://TUO-DOMINIO/auth/callback?recovery=1` e `https://TUO-DOMINIO/auth/confirm`.
- Per sviluppo locale aggiungi anche i corrispondenti URL `http://localhost:3000/...`.

Non usare domini inventati o wildcard ampie in produzione. Se cambi dominio, aggiorna sia Vercel `APP_URL` sia Supabase.

In **Email Templates**, per funzionare anche quando l'email viene aperta da un dispositivo diverso, usa questi link:

**Confirm signup:**

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Conferma la tua email</a>
```

**Reset password:**

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Imposta una nuova password</a>
```

I percorsi `/auth/confirm` e `/auth/callback` sono già implementati. I template predefiniti PKCE possono richiedere lo stesso browser usato per la richiesta; i template sopra evitano questa dipendenza. Fonte: https://supabase.com/docs/guides/auth/redirect-urls

## 6. Prova il percorso completo prima di invitare clienti

1. Apri `https://TUO-DOMINIO/registrati`, inserisci email e password e conferma l'email ricevuta.
2. Completa dati personali, fiscali e parametri verificati. Un account nuovo deve essere vuoto.
3. Crea un cliente e una fattura, registra un incasso parziale, poi il saldo. Prova anche un importo superiore al residuo: deve essere rifiutato.
4. Esci. Crea un secondo account con un'altra email: non deve vedere alcun dato del primo.
5. Prova recupero password, nuova password, esportazione e cancellazione di un account di prova.
6. Verifica che le email arrivino anche a destinatari che non fanno parte del team Supabase.

Questa prova reale non è stata eseguita durante la preparazione perché non era disponibile un progetto Supabase. I test locali del database non verificano SMTP, impostazioni del tuo progetto o consegna delle email.

## 7. Prima del lancio commerciale

Completa Privacy e Termini con i dati del gestore e revisione legale; configura backup, retention, accessi amministrativi e assistenza. Fai verificare i parametri fiscali, i coefficienti e le categorie previdenziali. Il software non certifica i requisiti per il regime e non sostituisce il commercialista. Attiva gli strumenti antiabuso/rate limiting disponibili nel tuo piano senza disabilitare l'isolamento RLS.

## Problemi comuni

- **“Supabase non configurato”**: controlla i nomi delle variabili e rifai il deploy.
- **Email non ricevuta**: controlla SMTP, dominio mittente e log Auth; il servizio predefinito può inviare solo a destinatari consentiti.
- **Link scaduto**: richiedi una nuova verifica dal login o un nuovo recupero; i link sono monouso.
- **“Richiesta non autorizzata”**: l'origine aperta nel browser deve coincidere con `APP_URL`, incluso `https` e dominio. In locale `localhost` e `127.0.0.1` sono origini diverse.
- **Errore al caricamento dati**: esegui tutte le migrazioni e verifica che le chiavi appartengano allo stesso progetto.
- **Cancellazione non disponibile**: manca la Secret key server oppure è del progetto sbagliato.
- **Anno nuovo senza stime**: inserisci una nuova configurazione fiscale verificata e configura il profilo dell'anno; non riutilizzare aliquote precedenti automaticamente.
