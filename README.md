# Indietaliano 3.9 · Amministrazione integrata

Il sito rimane ospitato su Netlify, i contenuti sono salvati su GitHub. La pagina **`/admin/`** ospita **Sveltia CMS**: non servira piu aprire GitHub per modificare giochi, traduzioni, copertine e donazioni.

## Pubblicazione su GitHub

Non caricare lo ZIP come file singolo. La modifica dei testi homepage e stata aggiunta a questa versione.

1. Caricare i **file principali** nella radice del repository `lapinchichan/indietaliano`, sovrascrivendo quelli esistenti.
2. Aprire la cartella `admin` del repository e caricarvi i **due file** `index.html` e `config.yml` (NON nella radice del repository).
3. Attendere un nuovo deploy **Published** su Netlify.
4. Verificare che `https://indietaliano.netlify.app/admin/config.yml` risponda e che `https://indietaliano.netlify.app/admin/` mostri la schermata di login.

## Attivazione login GitHub tramite Netlify OAuth (una sola volta)

Il pannello sara visibile alla pagina `/admin/`, ma la modifica dei dati richiede l'autenticazione GitHub. Il pannello **non usa password JavaScript** e non memorizza client secret nei file del repository.

1. Su GitHub vai in **Settings (profilo) > Developer settings > OAuth Apps > New OAuth App** (link: https://github.com/settings/applications/new).
2. Imposta **Application name:** `Indietaliano CMS`, **Homepage URL:** `https://indietaliano.netlify.app`, **Authorization callback URL:** `https://api.netlify.com/auth/done`.
3. Registra l'app, copia **Client ID** e genera **Client Secret**. Non condividere il Client Secret in chat, nei file del sito o nel repository.
4. Apri Netlify > progetto `indietaliano` > **Project configuration > Security > OAuth** (puo comparire sotto Access & security) > **Install provider** > **GitHub**. Inserisci li Client ID e Client Secret, poi salva.
5. Visita `https://indietaliano.netlify.app/admin/`, scegli **Sign in with GitHub** e autorizza l'accesso. Devi avere permessi di scrittura sul repository `lapinchichan/indietaliano`.

I nomi delle sezioni Netlify possono cambiare. La procedura e documentata qui: https://sveltiacms.app/en/docs/backends/github . Se l'OAuth di Netlify non fosse disponibile sul tuo piano, la configurazione alternativa richiede un autenticatore OAuth esterno: non incollare mai i segreti nel frontend.

**Nota:** l'indirizzo /admin/ e pubblico in lettura; l'autenticazione protegge le operazioni GitHub, non nasconde la pagina. La privacy del sito di prova va gestita nelle impostazioni Netlify separatamente.

## Cosa puoi fare

- Modificare o creare un videogame in **Videogiochi** (JSON sotto `content/games`).
- Inserire copertine personalizzate e screenshot: vengono caricati sotto `assets/screenshots`.
- Modificare note, stato, versioni, link Steam, istruzioni e link della patch.
- Modificare il titolo e la presentazione della homepage, il testo del sostegno e il link alle donazioni in **Impostazioni del sito**.
- Cliccare **Save** nel pannello: Sveltia crea un commit su GitHub, Netlify esegue automaticamente la build `node netlify-build.js`.

## Sicurezza delle patch

La selezione **Disponibile** NON basta per attivare il download. La build controlla anche `isDemo=false`, `patchVerified=true`, versioni gioco/patch valide, link HTTPS e almeno una istruzione. Con dati non completi la scheda diventa "In test" e il download resta sospeso. Non confermare `patchVerified` prima di testare veramente la patch dopo gli aggiornamenti.

## Limiti e verifiche

- La schermata di login remota non e verificabile finche il GitHub OAuth provider non sara configurato dal proprietario.
- Non caricare nella repository credenziali, token o password.
- Per adesso le 10 patch rimangono **In revisione**, senza link di download.
- `gestione.html` continua a funzionare come reindirizzamento a `/admin/` per vecchi collegamenti.
- `.pages.yml` e il vecchio CMS Pages non sono piu utilizzati per la gestione del sito. Il file puo restare nel repository, ma non servira aprire Pages CMS.

### Fonti tecniche
- https://sveltiacms.app/en/docs/start
- https://sveltiacms.app/en/docs/backends/github
- https://sveltiacms.app/en/docs/collections/entries/formats
- https://sveltiacms.app/en/docs/media
