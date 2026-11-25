import { useState } from 'react';
import { Tableau, Pastille, euros, date, type Colonne, type Filtre, type Ligne } from './Tableau';

const STATUTS: Record<string, [string, string]> = {
  a_expedier: ['À expédier', '#c77d0a'],
  expediee: ['Expédiée', '#237F2C'],
  annulee: ['Annulée', '#8a8a8a'],
};

const ville = (adresse?: string[]) => adresse?.find((a) => /^\d{4,5}\s/.test(a))?.replace(/^\d{4,5}\s+/, '') ?? '';

const colonnesSite: Colonne[] = [
  { titre: 'N°', valeur: (l) => l.numero },
  { titre: 'Date', valeur: (l) => l.date, rendu: (l) => date(l.date) },
  { titre: 'Client', valeur: (l) => l.client?.nom ?? l.livraison?.nom, largeur: 150 },
  { titre: 'Email', valeur: (l) => l.client?.email, largeur: 190 },
  { titre: 'Ville', valeur: (l) => ville(l.livraison?.adresse) },
  {
    titre: 'Articles',
    valeur: (l) => (l.lignes ?? []).map((a: any) => `${a.description} × ${a.quantite}`).join(', '),
    largeur: 220,
  },
  { titre: 'Livraison', valeur: (l) => l.fraisLivraison ?? 0, rendu: (l) => euros(l.fraisLivraison), droite: true },
  { titre: 'Total', valeur: (l) => l.total ?? 0, rendu: (l) => euros(l.total), droite: true },
  {
    titre: 'Statut',
    valeur: (l) => STATUTS[l.statut]?.[0] ?? l.statut,
    rendu: (l) => (STATUTS[l.statut] ? <Pastille texte={STATUTS[l.statut][0]} couleur={STATUTS[l.statut][1]} /> : l.statut),
  },
  { titre: 'Suivi Colissimo', valeur: (l) => l.numeroSuivi },
  { titre: 'Origine', valeur: (l) => (l.source === 'revendeur' ? 'Revendeur' : 'Client') + (l.modeTest ? ' (TEST)' : '') },
];

const reel = (l: Ligne) => !l.modeTest;
const filtresSite: Filtre[] = [
  { titre: 'À expédier', garder: (l) => reel(l) && l.statut === 'a_expedier' },
  { titre: 'Expédiées', garder: (l) => reel(l) && l.statut === 'expediee' },
  { titre: 'Annulées', garder: (l) => reel(l) && l.statut === 'annulee' },
  { titre: 'Toutes', garder: reel },
  { titre: 'Revendeurs', garder: (l) => reel(l) && l.source === 'revendeur' },
  { titre: 'Test', garder: (l) => Boolean(l.modeTest) },
];

const colonnesWoo: Colonne[] = [
  { titre: 'Date', valeur: (l) => l.date, rendu: (l) => date(l.date) },
  { titre: 'N°', valeur: (l) => l.numero },
  { titre: 'Client', valeur: (l) => l.nom, largeur: 160 },
  { titre: 'Email', valeur: (l) => l.email, largeur: 200 },
  { titre: 'Ville', valeur: (l) => l.ville },
  { titre: 'Total', valeur: (l) => l.total ?? 0, rendu: (l) => euros(l.total), droite: true },
];
const annee = (a: number): Filtre => ({ titre: String(a), garder: (l) => String(l.date ?? '').startsWith(String(a)) });

export function TableauCommandes() {
  const [onglet, setOnglet] = useState<'site' | 'woo'>('site');
  const bouton = (id: 'site' | 'woo', texte: string) => (
    <button
      type="button"
      onClick={() => setOnglet(id)}
      style={{
        font: 'inherit', padding: '8px 14px', border: 0, cursor: 'pointer', background: 'transparent', color: 'inherit',
        borderBottom: onglet === id ? '2px solid #237F2C' : '2px solid transparent', fontWeight: onglet === id ? 600 : 400,
      }}
    >
      {texte}
    </button>
  );
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 24px 0', borderBottom: '1px solid var(--card-border-color, rgba(127,127,127,.25))' }}>
        {bouton('site', 'Nouveau site')}
        {bouton('woo', 'Ancien site (WooCommerce)')}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {onglet === 'site' ? (
          <Tableau
            key="site"
            titre="Tableau des commandes — nouveau site"
            requete={`*[_type == "commande" && !(_id in path("drafts.**"))]{_id, _type, numero, date, client, livraison, lignes, fraisLivraison, total, statut, numeroSuivi, source, modeTest}`}
            colonnes={colonnesSite}
            filtres={filtresSite}
            tri={1}
            recherche={(l) => `${l.numero ?? ''} ${l.client?.nom ?? ''} ${l.client?.email ?? ''} ${(l.livraison?.adresse ?? []).join(' ')} ${l.numeroSuivi ?? ''}`}
            montant={(l) => l.total ?? 0}
            fichier="commandes"
          />
        ) : (
          <Tableau
            key="woo"
            titre="Tableau des commandes — ancien site"
            requete={`*[_type == "client" && !modeTest && count(historiqueWoo) > 0]{_id, nom, email, ville, historiqueWoo[]{date, numero, total}}`}
            colonnes={colonnesWoo}
            filtres={[{ titre: 'Toutes', garder: () => true }, ...[2026, 2025, 2024, 2023, 2022, 2021, 2020].map(annee)]}
            tri={0}
            recherche={(l) => `${l.numero ?? ''} ${l.nom ?? ''} ${l.email ?? ''} ${l.ville ?? ''}`}
            montant={(l) => l.total ?? 0}
            ouvrir={(l) => ({ id: l.clientId, type: 'client' })}
            fichier="commandes-ancien-site"
            aplatir={(c) => (c.historiqueWoo ?? []).map((h: any, i: number) => ({ ...h, _id: `${c._id}-${i}`, _type: 'commandeWoo', clientId: c._id, nom: c.nom, email: c.email, ville: c.ville }))}
          />
        )}
      </div>
    </div>
  );
}
