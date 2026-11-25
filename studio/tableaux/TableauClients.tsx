import { Tableau, Pastille, euros, date, type Colonne, type Filtre, type Ligne } from './Tableau';

const EMAILS: Record<string, [string, string]> = {
  client_existant: ['Autorisés', '#237F2C'],
  hors_delai: ['Hors délai', '#8a8a8a'],
  desinscrit: ['Désinscrit', '#b03a2e'],
};

const colonnes: Colonne[] = [
  { titre: '★', valeur: (l) => ((l.nbCommandes ?? 0) >= 2 ? '★' : ''), largeur: 24 },
  { titre: 'Nom', valeur: (l) => l.nom, largeur: 160 },
  { titre: 'Email', valeur: (l) => l.email, largeur: 200 },
  { titre: 'Ville', valeur: (l) => l.ville },
  { titre: 'Code postal', valeur: (l) => l.codePostal },
  { titre: 'Commandes', valeur: (l) => l.nbCommandes ?? 0, droite: true },
  { titre: 'Dépense', valeur: (l) => l.depense ?? 0, rendu: (l) => euros(l.depense), droite: true },
  { titre: '1re commande', valeur: (l) => l.premiereCommande, rendu: (l) => date(l.premiereCommande) },
  { titre: 'Dernière commande', valeur: (l) => l.derniereCommande, rendu: (l) => date(l.derniereCommande) },
  { titre: 'Origine', valeur: (l) => (l.origine === 'site' ? 'Nouveau site' : 'Ancien site') },
  {
    titre: 'Emails',
    valeur: (l) => EMAILS[l.emails]?.[0] ?? l.emails,
    rendu: (l) => (EMAILS[l.emails] ? <Pastille texte={EMAILS[l.emails][0]} couleur={EMAILS[l.emails][1]} /> : l.emails),
  },
];

const vrai = (l: Ligne) => !l.modeTest;
const filtres: Filtre[] = [
  { titre: 'Tous', garder: vrai },
  { titre: 'Fidèles (2 commandes et +)', garder: (l) => vrai(l) && (l.nbCommandes ?? 0) >= 2 },
  { titre: 'Emails autorisés', garder: (l) => vrai(l) && l.emails === 'client_existant' },
  { titre: 'Hors délai', garder: (l) => vrai(l) && l.emails === 'hors_delai' },
  { titre: 'Désinscrits', garder: (l) => l.emails === 'desinscrit' },
  { titre: 'Test', garder: (l) => Boolean(l.modeTest) },
];

export function TableauClients() {
  return (
    <Tableau
      titre="Tableau des clients"
      requete={`*[_type == "client" && !(_id in path("drafts.**"))]{_id, _type, nom, email, ville, codePostal, nbCommandes, depense, premiereCommande, derniereCommande, origine, emails, modeTest}`}
      colonnes={colonnes}
      filtres={filtres}
      tri={8}
      recherche={(l) => `${l.nom ?? ''} ${l.email ?? ''} ${l.ville ?? ''} ${l.codePostal ?? ''}`}
      montant={(l) => l.depense ?? 0}
      fichier="clients"
    />
  );
}
