-- Central rules only. Demo data never enters real accounts.
insert into public.tax_configurations(tax_year,version,valid_from,valid_to,parameters,sources,verified_at,notes)
values(2026,'2026.1','2026-01-01','2026-12-31',
'{"threshold":85000,"exit_threshold":100000,"tax_rate":0.15,"minimum_income":18808,"ceiling":122295,"legacy_ceiling":93707,"extra_threshold":56224,"extra_rate":0.01,"fixed_fee":7.44,"separata":{"rate":0.2607},"artigiani":{"rate":0.24},"commercianti":{"rate":0.2448}}',
'["https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.02.gestione-separata-le-aliquote-contributive-per-il-2026.html","https://www.inps.it/content/dam/inps-site/it/scorporati/circolari-e-messaggi/2026/02/Circolare_15162/Allegati/16561_Circolare-numero-14-del-09-02-2026.pdf","https://www.normattiva.it/eli/stato/LEGGE/2022/12/29/197/CONSOLIDATED"]',
'2026-09-29','Verificare parametri per la posizione individuale. Massimale post 1995; ante 1996 usare legacy_ceiling. Coefficiente ATECO e riduzioni richiedono conferma. Nessuna scadenza ufficiale inserita automaticamente.')
on conflict(tax_year,version) do nothing;
