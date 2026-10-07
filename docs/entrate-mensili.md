# Entrate mensili confermate

## Obiettivo

Mantenere l'interfaccia di Conto Cantiere e distinguere la liquidità disponibile oggi dal risparmio previsto. Il cambio mese non deve creare incassi reali.

## Regole

1. **Disponibile oggi** = ultimo saldo impostato + incassi effettivi successivi a quel saldo − pagamenti effettivi successivi a quel saldo. Nessun risparmio mensile automatico. I movimenti con data futura non fanno parte del saldo odierno.
2. **Metto da parte al mese** genera una previsione per ogni mese, compreso quello corrente, fino all'ultimo pagamento del cantiere. È una quota destinata ai lavori, non l'intero stipendio.
3. In **Oggi → Da segnare** compare solo il risparmio del mese corrente non ancora confermato. **Incassato** registra l'importo previsto con data odierna; la matita apre il dettaglio già usato per le entrate, per correggere importo e data.
4. Un incasso confermato sostituisce l'intera previsione di quel mese, anche se ha importo diverso: 800 € effettivi contro 1.000 € previsti non lasciano 200 € ancora attesi. Una seconda conferma non crea un altro incasso.
5. Al cambio mese, un risparmio non confermato resta nel mese passato, dove si può registrare tardivamente. Non aumenta il saldo e non viene trascinato nella previsione corrente.
6. In **Cantiere → Mesi**, i risparmi attesi e confermati compaiono accanto ai movimenti già presenti. Nei mesi passati, i risparmi non confermati sono indicati come esclusi dalla previsione.
7. **+ → Ho incassato** resta per le entrate aggiuntive. Se è il risparmio del mese, si può agganciare alla relativa previsione con lo stesso modello di scelta “Era previsto?” già usato per i pagamenti. Gli altri incassi non sostituiscono il risparmio previsto.
8. Modificare l'importo mensile aggiorna i mesi correnti/futuri non confermati; le previsioni dei mesi passati e gli incassi già registrati restano conservati. Impostare zero sospende le nuove previsioni.
9. **Aggiorna disponibilità** stabilisce un nuovo saldo di riferimento. I movimenti già inclusi in quel saldo non vengono sommati o sottratti di nuovo; le conferme mensili già registrate restano tali.
10. La previsione riparte dalla data odierna a ogni apertura e quando la pagina torna visibile. Le uscite passate non pagate continuano a pesare sul mese corrente, come prima.

## Interfaccia

Nessuna nuova scheda, nessuna nuova sezione, nessun campo per il giorno dello stipendio. Si riusano lista, bottoni, matita e dettaglio degli incassi. La descrizione sotto la disponibilità esplicita che il risparmio mensile è previsto. Il controllo rimane mensile, senza attribuire un ordine giornaliero a entrate e uscite previste nello stesso mese.

## Dati e compatibilità

Schema v4: le previsioni mensili vengono conservate in `savings` (`month`, `amount`), mentre gli incassi effettivi restano in `extras` con un collegamento opzionale `savingMonth`. `money.monthlySince` identifica il primo mese della nuova gestione.

I backup v1/v2/v3 e i dati locali o GitHub vengono importati mantenendo saldo esplicito, contratti e movimenti reali. Nessun incasso storico viene inventato dai vecchi aumenti automatici. La nuova pianificazione inizia nel mese dell'aggiornamento; un messaggio invita a verificare la disponibilità con **Aggiorna**. Gli importi prima aggiunti solo per il trascorrere dei mesi cessano di essere considerati liquidità reale.

## Casi di accettazione

| Scenario | Risultato |
|---|---|
| Ottobre: saldo 10.000 €, risparmio previsto 1.000 €, nessun movimento | Disponibile 10.000 €, fine ottobre previsto 11.000 € |
| Conferma ottobre di 1.000 € | Disponibile 11.000 €, fine ottobre previsto sempre 11.000 € |
| Conferma ottobre di 800 € | Disponibile e fine ottobre previsto 10.800 € |
| Ottobre e novembre non confermati; apertura il 1° dicembre | Disponibile 10.000 €, ottobre/novembre esclusi, dicembre ancora previsto |
| Incasso extra di 300 € | Disponibile +300 €; risparmio mensile previsto invariato |
| Secondo tocco su una conferma già effettuata | Un solo incasso registrato |
| Incasso tardivo relativo a un mese passato | Conta una sola volta, con la data reale scelta; nessun recupero automatico di altri mesi |
| Allineamento del saldo dopo incassi e pagamenti | Nessun doppio conteggio dei movimenti già inclusi |
| Cambio dell'importo mensile | Si aggiornano solo previsioni correnti/future non confermate |
| Pagamento passato ancora da fare | Resta sottratto dalla previsione corrente |

## Verifica

Eseguire `node --test tests/entrate-mensili.test.cjs`. Verificare inoltre il percorso completo su viewport telefono e computer: conferma, correzione, annullamento, cambio mese, ricaricamento, backup/importazione e allineamento del saldo. Pubblicazione tramite revisione della pull request.
