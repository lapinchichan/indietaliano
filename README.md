# Indietaliano 3.7 — Catalogo in revisione

Sono presenti 10 giochi, nell'ordine richiesto. Per tutti lo stato è **In revisione**, con download disattivati.

## Modifiche
- Copertine ufficiali visualizzate tramite URL Steam CDN (richiedono Internet); icona di riserva se non disponibili.
- Dieci schede con link Steam e presentazioni italiane. Nessuna compatibilità della traduzione viene data per scontata.
- Pagine in noindex/nofollow fino al lancio pubblico.
- Pages CMS: nuovo stato `in-revisione`, campo `steamAppId`, ordine e conferma `patchVerified`.
- Una patch diventa scaricabile soltanto con `isDemo=false`, `status=disponibile`, `patchVerified=true`, link HTTPS, versioni valide e istruzioni compilate.
- `netlify.toml` e `netlify-build.js` inclusi, così il repository pubblicato su Netlify si aggiorna quando Pages CMS salva su GitHub.

## Aggiornamento del repository
Estrarre lo ZIP. Caricare **i contenuti** nella radice del repository GitHub `indietaliano`, conservando le cartelle; i file omonimi devono essere sostituiti. Non usare il file ZIP come singolo upload.

Dopo il caricamento, Netlify dovrebbe avviare automaticamente la build. L'eventuale workflow GitHub Pages non è necessario.

Per provare in locale, con Node.js installato: `node netlify-build.js`, poi aprire `_site/index.html`. Alcuni asset remoti sono disponibili solo con accesso Internet.

## Cosa resta da verificare
- Test effettivi delle patch sui giochi aggiornati.
- Versioni esatte dei giochi, compatibilità e istruzioni reali.
- Screenshot in italiano di ciascun gioco.
- Disponibilità e utilizzo delle copertine Steam in produzione.
- Area CMS autenticata da configurare sul repository e indirizzo di donazione.

La homepage e le pagine sono predisposte ma il sito NON è un catalogo di patch già disponibili.
