# Indietaliano 3.6 · Area gestione collegata a Pages CMS

## Cosa cambia

- Homepage, catalogo e grafica Retro Editorial invariati (crema, blu notte e rosso arcade; Fraunces e DM Sans).
- **Area gestione** raggiungibile dal menu su desktop e dalla pagina `gestione.html`. La pagina collega a https://app.pagescms.org; l'editor non è incorporato nel sito statico.
- I videogiochi sono gestiti con file JSON separati in `content/games/`, uno per titolo.
- La configurazione `.pages.yml` genera i campi del pannello Pages CMS.
- Ogni salvataggio nel repository `main` attiva il workflow `.github/workflows/deploy.yml`: rigenera automaticamente la homepage, le schede e le impostazioni.
- I file di contenuto originali non vengono pubblicati nell'artefatto GitHub Pages; restano nel repository GitHub (che può essere pubblico).

## Prima configurazione online (necessaria una volta sola)

1. Crea un account GitHub, se non ce l'hai.
2. Crea un repository chiamato `indietaliano` (o un altro nome) con ramo predefinito `main`.
3. **Carica tutti i file di questa cartella, inclusi `.pages.yml` e `.github/workflows/deploy.yml`.** Attiva la visualizzazione dei file nascosti quando necessario. Il workflow deve essere nella cartella `.github/workflows/` e `.pages.yml` nella radice.
4. Su GitHub apri **Settings → Pages → Build and deployment → Source: GitHub Actions**. Il ramo deve essere `main`. Se la sezione Pages non è disponibile, controlla visibilità del repository e condizioni del tuo piano.
5. Apri **Actions** e verifica che il workflow “Pubblica Indietaliano” sia riuscito. Se non è partito, usa “Run workflow”.
6. Apri l'indirizzo che GitHub Pages mostra in Settings → Pages. Non c'è bisogno di comprare un dominio.
7. Visita https://app.pagescms.org, accedi con GitHub e **installa/autorizza la GitHub App di Pages CMS** sul repository Indietaliano.
8. Seleziona il repository e il ramo `main` dentro Pages CMS. Saranno disponibili “Videogiochi” e “Impostazioni del sito”. Il pannello salva direttamente su GitHub e attiva la nuova pubblicazione.
9. Da Indietaliano, seleziona **Gestione** (desktop) oppure apri `gestione.html`: è il collegamento al pannello autenticato di Pages CMS.

**Sicurezza:** Gestione è una pagina pubblica di ingresso; NON è un login. La protezione reale è assicurata da GitHub e dall'autorizzazione di Pages CMS. Non aggiungere password a codice HTML, CSS, JavaScript o nei file JSON.

## Come modificare un gioco

1. Apri Pages CMS → Videogiochi → scegli una scheda, oppure “Nuovo”.
2. Per un nuovo titolo inserisci lo **slug** in minuscolo, per esempio `nuovo-gioco` (corrisponderà a `giochi/nuovo-gioco.html`). Non modificarlo in seguito; per cambiare slug occorre rinominare anche il file JSON nel repository.
3. Aggiorna descrizione, link Steam, genere, stato e note. Puoi caricare gli screenshot nel campo dedicato; Pages CMS li salva in `assets/screenshots/`.
4. **Lascia attiva** la spunta “Scheda ancora in preparazione” finché non hai completato i test.
5. Prima di rendere la patch scaricabile sono necessari tutti questi elementi: stato `disponibile`, spunta “preparazione” disattivata, link HTTPS, versione del gioco effettiva, versione patch, almeno un passo di installazione. Il generatore ribalta a `in-test` gli stati disponibili incompleti.
6. Premi Salva: una volta completato il workflow, la pagina pubblica si aggiornerà.

I giochi attualmente inclusi sono solo esempi in preparazione, senza download. Non dichiarare una traduzione pronta senza testare patch, compatibilità e diritti di distribuzione.

## Come impostare le donazioni

Pages CMS → Impostazioni del sito → inserisci un indirizzo HTTPS valido in `donationUrl` (per esempio la tua pagina Ko-fi) → Salva. Non inserire informazioni di conto, password o token. Le traduzioni restano gratuite.

## Test e sviluppo locale

È richiesto **Node.js 22 o compatibile** per generare i file dal contenuto JSON:

```bash
node build-games.js
```

Poi apri `index.html` nel browser, oppure avvia `python -m http.server 8000` ed entra in `http://localhost:8000` per testare i collegamenti. `games.js`, `site-config.js` e le pagine HTML di `giochi/` sono **file generati**: modifica sempre `content/games/*.json` o `content/site.json`, non questi output.

## Limiti e trasparenza

- L'editor vero e proprio è ospitato su Pages CMS, non dentro Indietaliano. L'integrazione consiste nell'area d'ingresso, nella configurazione e nella pubblicazione automatica.
- La prima pubblicazione e l'autorizzazione a GitHub richiedono azioni manuali del proprietario; non sono state eseguite da questa chat.
- Pages CMS è un servizio terzo. Le sue funzionalità e condizioni possono cambiare.
- Il repository può essere pubblico: non memorizzarvi token, credenziali, informazioni riservate o file di gioco protetti.
- Le immagini di gioco e le patch devono essere distribuibili nel rispetto delle autorizzazioni e delle licenze.
