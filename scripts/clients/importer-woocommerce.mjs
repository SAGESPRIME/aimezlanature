#!/usr/bin/env node
/**
 * Import UNIQUE des clients de l'ancien site WooCommerce dans le Studio.
 *
 *   node scripts/clients/importer-woocommerce.mjs <rapport-clients.csv> <export-wordpress.xml>            # simulation
 *   node scripts/clients/importer-woocommerce.mjs <rapport-clients.csv> <export-wordpress.xml> --sanity   # écriture
 *
 * Les deux fichiers contiennent des données personnelles : ils restent HORS du
 * dépôt (jamais commités) et ne sont envoyés qu'à Sanity. La simulation
 * n'affiche que des chiffres, jamais un nom ni un email.
 *
 * Importés : tout email qui a PAYÉ au moins une commande (commandes
 * « terminée » ou « en cours » de l'export WordPress, ou « Commandes » > 0
 * dans le rapport clients). Comptes sans achat et commandes non payées
 * (« en attente de paiement », échouées, annulées, remboursées) : ignorés.
 * Téléphones et adresses complètes : non importés (seulement ville, code
 * postal, pays — minimisation des données).
 *
 * createIfNotExists : ré-exécutable sans doublon, et une fiche déjà complétée
 * par une commande du nouveau site n'est jamais écrasée.
 */
import { readFileSync } from 'node:fs';
import { agregerCommandes, agregerRapportClients, fichesImport } from '../../src/data/client-doc.mjs';

const [csvChemin, xmlChemin] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const ecrire = process.argv.includes('--sanity');
if (!csvChemin || !xmlChemin) {
  console.error('Usage : importer-woocommerce.mjs <rapport-clients.csv> <export-wordpress.xml> [--sanity]');
  process.exit(1);
}

/** CSV (RFC 4180 : guillemets, virgules et retours à la ligne dans les champs). */
export function lireCsv(texte) {
  const lignes = [];
  let champ = '';
  let ligne = [];
  let guillemets = false;
  const t = texte.replace(/^﻿/, '');
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (guillemets) {
      if (c === '"' && t[i + 1] === '"') (champ += '"'), i++;
      else if (c === '"') guillemets = false;
      else champ += c;
    } else if (c === '"') guillemets = true;
    else if (c === ',') ligne.push(champ), (champ = '');
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      ligne.push(champ), lignes.push(ligne), (ligne = []), (champ = '');
    } else champ += c;
  }
  if (champ || ligne.length) ligne.push(champ), lignes.push(ligne);
  const [entete, ...donnees] = lignes.filter((l) => l.some((v) => v !== ''));
  return donnees.map((l) => Object.fromEntries(entete.map((k, i) => [k.trim(), l[i] ?? ''])));
}

const cdata = (bloc, balise) => new RegExp(`<${balise}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${balise}>`).exec(bloc)?.[1] ?? '';
const balise = (bloc, nom) => new RegExp(`<${nom}>([^<]*)</${nom}>`).exec(bloc)?.[1] ?? cdata(bloc, nom);
const meta = (bloc, cle) =>
  new RegExp(`<wp:meta_key><!\\[CDATA\\[${cle}\\]\\]></wp:meta_key>\\s*<wp:meta_value><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></wp:meta_value>`).exec(bloc)?.[1]?.trim() ?? '';
const iso = (d) => (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(d) && !d.startsWith('0000') ? `${d.replace(' ', 'T')}Z` : null);

/** Commandes PAYÉES de l'export WordPress (WooCommerce). */
export function lireCommandes(xml) {
  const commandes = [];
  for (const [, bloc] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    if (balise(bloc, 'wp:post_type') !== 'shop_order') continue;
    if (!['wc-completed', 'wc-processing'].includes(balise(bloc, 'wp:status'))) continue;
    const date = iso(balise(bloc, 'wp:post_date_gmt')) ?? iso(balise(bloc, 'wp:post_date'));
    const email = meta(bloc, '_billing_email');
    if (!date || !email) continue;
    const prenom = meta(bloc, '_billing_first_name') || meta(bloc, '_shipping_first_name');
    const nomFamille = meta(bloc, '_billing_last_name') || meta(bloc, '_shipping_last_name');
    commandes.push({
      email,
      date,
      total: Number.parseFloat(meta(bloc, '_order_total')) || 0,
      numero: meta(bloc, '_order_number') || balise(bloc, 'wp:post_id'),
      nom: [prenom, nomFamille].filter(Boolean).join(' ') || undefined,
      ville: meta(bloc, '_shipping_city') || meta(bloc, '_billing_city') || undefined,
      codePostal: meta(bloc, '_shipping_postcode') || meta(bloc, '_billing_postcode') || undefined,
      pays: meta(bloc, '_shipping_country') || meta(bloc, '_billing_country') || undefined,
    });
  }
  return commandes;
}

// Dates du rapport clients (« 2025-03-14T10:22:05 », heure locale) → ISO.
const rapport = agregerRapportClients(lireCsv(readFileSync(csvChemin, 'utf8')));
for (const r of rapport.values()) {
  r.derniereActivite = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(r.derniereActivite ?? '') ? `${r.derniereActivite}Z` : undefined;
}
const commandes = lireCommandes(readFileSync(xmlChemin, 'utf8'));
const fiches = fichesImport(rapport, agregerCommandes(commandes));

// ── Rapport (chiffres seulement) ─────────────────────────────────────────
const compter = (f) => fiches.filter(f).length;
const total = fiches.reduce((s, f) => s + f.depense, 0);
console.log(`Rapport clients : ${rapport.size} emails uniques, dont ${[...rapport.values()].filter((r) => r.nbCommandes > 0).length} avec commande`);
console.log(`Export WordPress : ${commandes.length} commandes payées`);
console.log(`Fiches à importer : ${fiches.length}`);
console.log(`  dont fidèles (2 commandes et plus) : ${compter((f) => f.nbCommandes >= 2)}`);
console.log(`  emails autorisés (achat < 3 ans) : ${compter((f) => f.emails === 'client_existant')}`);
console.log(`  hors délai (achat > 3 ans) : ${compter((f) => f.emails === 'hors_delai')}`);
console.log(`  sans date de commande : ${compter((f) => !f.premiereCommande)}`);
console.log(`  sans nom : ${compter((f) => !f.nom)} · sans ville : ${compter((f) => !f.ville)} · sans pays : ${compter((f) => !f.pays)}`);
console.log(`Dépense totale : ${total.toFixed(2)} € · commandes comptées : ${fiches.reduce((s, f) => s + f.nbCommandes, 0)}`);

if (!ecrire) {
  console.log('\nSimulation : rien n’a été écrit. Ajouter --sanity pour importer.');
  process.exit(0);
}

const projet = process.env.SANITY_PROJECT_ID || '0lgh06ly';
const dataset = process.env.SANITY_DATASET || 'production';
const entetes = {
  'Content-Type': 'application/json',
  ...(process.env.SANITY_WRITE_TOKEN ? { Authorization: `Bearer ${process.env.SANITY_WRITE_TOKEN}` } : {}),
};
const LOT = 200;
for (let i = 0; i < fiches.length; i += LOT) {
  const mutations = fiches.slice(i, i + LOT).map((f) => ({ createIfNotExists: f }));
  const r = await fetch(`https://${projet}.api.sanity.io/v2025-02-19/data/mutate/${dataset}`, {
    method: 'POST',
    headers: entetes,
    body: JSON.stringify({ mutations }),
  });
  if (!r.ok) {
    console.error(`Lot ${i / LOT + 1} refusé : HTTP ${r.status}`);
    process.exit(1);
  }
  console.log(`Lot ${i / LOT + 1} : ${Math.min(i + LOT, fiches.length)}/${fiches.length}`);
}
console.log('Import terminé.');
