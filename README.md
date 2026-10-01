# Cantiere

I soldi di una ristrutturazione, mese per mese. Un'app in un solo file, per PC e telefono.

Appena entri sai se i lavori sono coperti. Segni quello che paghi, e il resto si aggiorna da solo.

**Provala**: [giusebuild.github.io/cantiere](https://giusebuild.github.io/cantiere/). La pagina è vuota finché non la colleghi ai tuoi dati. Per guardarla senza collegare niente: *Solo su questo dispositivo*, poi Imposta → Esempio.

## Come funziona

**Oggi.** Il verdetto: *Lavori coperti*, *Coperti ma stretti*, o *Scoperti da febbraio: mancano 8.500 €*. Sotto, quanto costano i lavori, quanto hai pagato, quanto resta. Poi quanto hai da parte e come cambia mese per mese. In fondo, i pagamenti da segnare: **Fatto** li segna con l'importo previsto e la data di oggi, la matita per cambiarli.

**Il +.** Per quello che non era previsto: ho pagato o ho incassato, quanto, per cosa, quando. Se scegli un contratto che ha pagamenti in attesa, te li propone.

**Cantiere.** *Mesi*: il grafico di quanto hai da parte a fine mese, con la fascia dei lavori, dal primo all'ultimo pagamento dei contratti. Sotto, un mese alla volta con le frecce. *Contratti*: una scheda per ognuno, impresa, architetto, ogni fornitore, con totale, pagato, resta, prossimo pagamento. **Mostra** nasconde tutto il resto: resta solo quella scheda, da far vedere a chi di dovere.

**Correggere.** Dopo *Fatto* c'è *Annulla*. Più tardi tocchi la riga, in un mese o nella scheda del contratto: cambi importo e data, oppure *Non l'ho pagato*.

**Imposta.** Da parte oggi, quanto metti al mese, sotto quanto non vuoi scendere, inizio dei lavori. Il prestito: quanto ti serve e la rata. Backup, collegamento, Esci.

## Come ragiona

- Parte da quanto hai **da parte oggi**. Ogni mese aggiunge quello che riesci a mettere e toglie i pagamenti previsti non ancora fatti.
- Un pagamento segnato è reale: ha data e importo veri e sparisce dal futuro. Il previsto resta accanto, così vedi se stai sforando.
- Un pagamento previsto con mese passato e non segnato è **in ritardo**: conta nel mese corrente finché non lo segni o lo sposti.
- I pagamenti "rispetto ai lavori" (inizio lavori, inizio +3) si spostano da soli se cambi il mese di inizio.
- **Verdetto**: verde se non scendi mai sotto il minimo che hai scelto, giallo se ci scendi ma resti sopra zero, rosso se vai sotto zero. Le barre hanno gli stessi colori. Il prestito consigliato è il più piccolo, a scatti di 500, che ti tiene sopra quel minimo, rate comprese.
- **Rata**: ammortamento alla francese col solo TAN. Una stima, non un preventivo.

## Dove stanno i dati

L'app è una pagina statica: nessun server, nessun account, niente che passi da terzi.

1. Nel browser del dispositivo, sempre. Funziona anche senza rete.
2. In un file `finanze.json` dentro un **tuo repo GitHub privato**, se lo colleghi da Imposta. Ogni modifica è un commit: la storia è tutta lì e il file lo apri anche a mano. PC e telefono vedono la stessa cosa; vince la modifica più recente.
3. Nei backup che scarichi.

## Usarla con i tuoi dati

1. Crea un repo privato vuoto, con un README così ha già il branch `main`. Il nome lo scegli tu.
2. GitHub → Settings → Developer settings → Personal access tokens → *Fine-grained tokens*. Repository access: *Only select repositories* → quel repo. Permissions → *Contents: Read and write*. Scadenza fino a un anno.
3. Apri l'app, scrivi il repo come `nome/repo`, incolla il token, *Entra*. Il browser chiede di salvarlo come una password: dì di sì. Le volte dopo, su Android e Chrome entra da solo; su iPhone tocchi la chiave sopra la tastiera. Sul telefono: *Aggiungi a Home*. *Esci* toglie token e dati dal dispositivo: i dati restano nel repo.

Quando il token scade l'app segna *Offline* e lo dice: ne generi un altro, Imposta → Esci, rientri. Nel frattempo i dati restano sul dispositivo.

Per avere una copia tua dell'app: fai un fork e accendi GitHub Pages sul branch `main`.

## Cosa c'è nel repo

| File | Cos'è |
|---|---|
| `index.html` | Tutta l'app. Zero librerie, nessun dato dentro. |
| `manifest.webmanifest`, `icon.svg`, `icon-180.png` | Per "Aggiungi a Home". |
