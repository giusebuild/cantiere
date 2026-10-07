# Conto Cantiere

Stai ristrutturando casa e vuoi sapere una cosa sola: **ce la faccio con i soldi?**

Conto Cantiere te lo dice appena la apri. Poi segni quello che paghi, e il resto si aggiorna da solo. Funziona sul telefono e sul computer, è una pagina sola, i tuoi numeri restano tuoi.

**Provala qui:** [giusebuild.github.io/cantiere](https://giusebuild.github.io/cantiere/)
La pagina è vuota finché non ci metti i tuoi dati. Per vederla con numeri di prova: *Solo su questo dispositivo*, poi Imposta → Esempio.

## Cosa vedi

**Oggi.** In cima il verdetto, a colori: *Lavori coperti*, *Coperti ma stretti*, oppure *Scoperti da febbraio: mancano 8.500 €*. Sotto, quanto costano i lavori, quanto hai già pagato, quanto resta. Poi quanto hai da parte davvero, con una striscia di barre che mostra la previsione mese per mese. In fondo, i pagamenti in arrivo e il risparmio del mese: un tocco su **Fatto** per i pagamenti o **Incassato** per l'entrata. Con la matita puoi correggere importo e data.

**Segna**, il + in basso. Per tutto quello che paghi fuori programma: le piastrelle in più, il fabbro, il trasloco dei mobili. Quanto, per chi, quando. Se è un pagamento che era già previsto, te lo propone e lo aggancia. **Ho incassato** registra rimborsi, regali o altre entrate; se è il risparmio mensile previsto, lo puoi agganciare per non contarlo due volte.

**Cantiere.** *Mesi*: un mese per riga, con una barra e quanto avrai da parte a fine mese. Tocchi un mese e si apre: cosa c'è da pagare, cosa hai già pagato. *Contratti*: la torta di come si dividono i soldi tra impresa, architetto e fornitori, e una scheda per ognuno con totale, pagato, resta, prossimo pagamento.

**Mostra.** Nella scheda di un contratto c'è un tasto che nasconde tutto il resto: rimane solo quella scheda. La fai vedere all'impresa o all'architetto, senza mostrare i tuoi soldi o gli altri contratti. Trasparenza, con misura.

**Imposta.** Tre numeri: quanto hai da parte oggi, quanto riesci a mettere ogni mese finché durano i lavori, sotto quanto non vuoi mai scendere. Più il prestito, se serve: quanto ti manca, entro quando, e la rata.

## Come ragiona

- Il punto fermo è **quanto hai da parte oggi**: il saldo che hai impostato, aggiornato con incassi e pagamenti effettivi successivi. Il cambio mese non aggiunge denaro automaticamente. **Aggiorna** riallinea questo numero alla disponibilità reale.
- **Metto da parte al mese** è una previsione, compreso il mese corrente, fino al mese dell'ultimo pagamento. Il saldo reale aumenta quando confermi **Incassato**. Se confermi una cifra diversa, quella sostituisce tutta la previsione del mese, senza lasciare un residuo ancora atteso.
- Un risparmio passato non confermato non viene trascinato nei mesi successivi: resta consultabile in **Mesi**, ma è escluso dalla previsione. Puoi registrarlo dopo, indicando la data in cui è effettivamente arrivato. I pagamenti ancora da fare, invece, restano da coprire.
- Un pagamento segnato è reale, con la sua data e il suo importo. Il previsto resta accanto, così vedi se stai sforando.
- Un pagamento previsto per un mese passato e non segnato è **in ritardo**: lo tiene davanti agli occhi finché non lo segni o lo sposti.
- Se l'impresa slitta, nel contratto c'è *Sposta i non pagati*: tutti i pagamenti ancora da fare, avanti o indietro di un mese.
- **Verdetto.** Verde: non scendi mai sotto il minimo che hai scelto. Giallo: ci scendi, ma resti sopra zero. Rosso: vai sotto zero. Le barre hanno gli stessi colori.
- **Prestito.** Il più piccolo che ti tiene sopra il minimo, rate comprese. La rata è una stima col solo tasso: per il numero vero c'è la banca.
- Hai sbagliato a segnare? Subito dopo c'è *Annulla*. Più tardi tocchi la riga e correggi, o la rimetti tra le cose da pagare.

## Dove stanno i tuoi numeri

È una pagina statica: nessun server, nessun account, nessuno in mezzo.

1. Nel browser del tuo telefono o computer, sempre. Funziona anche senza rete.
2. In un file dentro un **tuo repo GitHub privato**, se lo colleghi. Così telefono e computer vedono la stessa cosa, e ogni modifica resta nella storia.
3. Nei backup che scarichi quando vuoi.

## Usarla con i tuoi dati

Due strade.

**Fai da te.** Ti serve un account GitHub.
1. Crea un repo privato vuoto, con un README così ha già il branch `main`. Il nome lo scegli tu.
2. Genera un token: Settings → Developer settings → Personal access tokens → *Fine-grained tokens*. Repository access: *Only select repositories* → quel repo. Permissions → *Contents: Read and write*. Scadenza fino a un anno.
3. Apri l'app, scrivi il repo come `nome/repo`, incolla il token, *Entra*. Il browser chiede di salvarlo come una password: dì di sì. Sul telefono, *Aggiungi a Home*.

Quando il token scade l'app segna *Offline* e lo dice: ne generi un altro, tocchi *Esci* in alto a destra, rientri. Nel frattempo tutto resta sul dispositivo.

**Oppure chiedi a me.** Se GitHub non fa per te ma l'app sì, [scrivimi aprendo una issue](https://github.com/giusebuild/cantiere/issues/new): ti aiuto a metterla in piedi, o ti dico come la userei al posto tuo.

## Cosa c'è nel repo

| File | Cos'è |
|---|---|
| `index.html` | Tutta l'app. Zero librerie, nessun dato dentro. |
| `manifest.webmanifest`, `icon.svg`, `icon-180.png` | Per "Aggiungi a Home". |
| `docs/entrate-mensili.md` | Regole delle entrate confermate, compatibilità e casi di accettazione. |
| `tests/entrate-mensili.test.cjs` | Verifica dei calcoli: `node --test tests/entrate-mensili.test.cjs`. |

Per avere una copia tua: fai un fork e accendi GitHub Pages sul branch `main`.

I backup precedenti restano importabili. Nell'aggiornamento alle entrate confermate non vengono inventati incassi per i mesi trascorsi: verifica la disponibilità reale con **Aggiorna**. Per confermare un'entrata già inclusa nell'ultimo saldo, indicane la data effettiva precedente a quel saldo.
