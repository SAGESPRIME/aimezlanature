/**
 * Tableau en colonnes pour le Studio (clients, commandes) : titres de colonnes,
 * tri par clic, recherche, filtres, total, pagination, export Excel (CSV).
 * Lit avec la session de l'éditeur connecté : les documents privés
 * (clients.*, commandes.*) sont visibles comme dans les listes du Studio.
 * L'export est fabriqué dans le navigateur : rien n'est envoyé ailleurs.
 */
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useClient } from 'sanity';
import { useRouter } from 'sanity/router';

export type Ligne = { _id: string; _type: string } & Record<string, any>;

export interface Colonne {
  titre: string;
  valeur: (l: Ligne) => string | number | null | undefined;
  /** Affichage (par défaut : la valeur). */
  rendu?: (l: Ligne) => ReactNode;
  droite?: boolean;
  largeur?: number;
}

export interface Filtre {
  titre: string;
  garder: (l: Ligne) => boolean;
}

export const euros = (n: unknown) =>
  n == null || n === '' ? '' : `${Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
export const date = (d: unknown) => (d ? new Date(String(d)).toLocaleDateString('fr-FR') : '');

const PAR_PAGE = 100;

export function Tableau(props: {
  titre: string;
  requete: string;
  colonnes: Colonne[];
  filtres: Filtre[];
  /** Index de la colonne de tri par défaut (décroissant). */
  tri: number;
  /** Champs parcourus par la recherche. */
  recherche: (l: Ligne) => string;
  /** Colonne sommée dans le total. */
  montant?: (l: Ligne) => number;
  /** Document ouvert au clic (par défaut : la ligne elle-même). */
  ouvrir?: (l: Ligne) => { id: string; type: string } | null;
  fichier: string;
  /** Transforme chaque document lu en zéro, une ou plusieurs lignes. */
  aplatir?: (doc: Ligne) => Ligne[];
}) {
  const client = useClient({ apiVersion: '2025-02-19' });
  const router = useRouter();
  const [lignes, setLignes] = useState<Ligne[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [filtre, setFiltre] = useState(0);
  const [texte, setTexte] = useState('');
  const [tri, setTri] = useState<{ col: number; desc: boolean }>({ col: props.tri, desc: true });
  const [page, setPage] = useState(0);

  useEffect(() => {
    let actif = true;
    setLignes(null);
    client
      .fetch<Ligne[]>(props.requete)
      .then((r) => actif && setLignes(props.aplatir ? r.flatMap(props.aplatir) : r))
      .catch((e) => actif && setErreur(String(e?.message ?? e)));
    return () => {
      actif = false;
    };
  }, [client, props.requete]);

  const visibles = useMemo(() => {
    if (!lignes) return [];
    const t = texte.trim().toLowerCase();
    const col = props.colonnes[tri.col];
    return lignes
      .filter(props.filtres[filtre]?.garder ?? (() => true))
      .filter((l) => !t || props.recherche(l).toLowerCase().includes(t))
      .sort((a, b) => {
        const va = col.valeur(a);
        const vb = col.valeur(b);
        if (va == null || va === '') return 1;
        if (vb == null || vb === '') return -1;
        const c = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'fr');
        return tri.desc ? -c : c;
      });
  }, [lignes, filtre, texte, tri, props]);

  useEffect(() => setPage(0), [filtre, texte, tri]);
  const pages = Math.max(1, Math.ceil(visibles.length / PAR_PAGE));
  const affichees = visibles.slice(page * PAR_PAGE, (page + 1) * PAR_PAGE);
  const somme = props.montant ? visibles.reduce((s, l) => s + (props.montant!(l) || 0), 0) : null;

  const exporter = () => {
    const cellule = (v: unknown) => {
      const s = v == null ? '' : typeof v === 'number' ? String(v).replace('.', ',') : String(v);
      return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [props.colonnes.map((c) => cellule(c.titre)).join(';')]
      .concat(visibles.map((l) => props.colonnes.map((c) => cellule(c.valeur(l))).join(';')))
      .join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${props.fichier}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={S.page}>
      <h1 style={S.h1}>{props.titre}</h1>

      <div style={S.barre}>
        {props.filtres.map((f, i) => (
          <button key={f.titre} type="button" onClick={() => setFiltre(i)} style={i === filtre ? S.filtreActif : S.filtre}>
            {f.titre}
            {lignes ? ` (${lignes.filter(f.garder).length})` : ''}
          </button>
        ))}
      </div>

      <div style={S.barre}>
        <input
          type="search"
          placeholder="Rechercher (nom, email, ville, numéro…)"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          style={S.recherche}
        />
        <button type="button" onClick={exporter} disabled={!visibles.length} style={S.filtre}>
          Exporter (Excel)
        </button>
      </div>

      {erreur && <p style={S.erreur}>Lecture impossible : {erreur}</p>}
      {!lignes && !erreur && <p style={S.discret}>Chargement…</p>}

      {lignes && (
        <>
          <p style={S.total}>
            <strong>{visibles.length.toLocaleString('fr-FR')}</strong> ligne{visibles.length > 1 ? 's' : ''}
            {somme != null && (
              <>
                {' · total '}
                <strong>{euros(somme)}</strong>
              </>
            )}
          </p>
          <div style={S.cadre}>
            <table style={S.table}>
              <thead>
                <tr>
                  {props.colonnes.map((c, i) => (
                    <th
                      key={c.titre}
                      scope="col"
                      onClick={() => setTri((t) => ({ col: i, desc: t.col === i ? !t.desc : true }))}
                      style={{ ...S.th, textAlign: c.droite ? 'right' : 'left', minWidth: c.largeur }}
                      title="Trier"
                    >
                      {c.titre}
                      {tri.col === i ? (tri.desc ? ' ▼' : ' ▲') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {affichees.map((l, n) => {
                  const cible = props.ouvrir ? props.ouvrir(l) : { id: l._id, type: l._type };
                  return (
                    <tr
                      key={`${l._id}-${n}`}
                      onClick={() => cible && router.navigateIntent('edit', cible)}
                      style={{ ...S.tr, background: n % 2 ? 'var(--card-muted-bg-color, rgba(127,127,127,.06))' : 'transparent' }}
                    >
                      {props.colonnes.map((c) => (
                        <td key={c.titre} style={{ ...S.td, textAlign: c.droite ? 'right' : 'left' }}>
                          {c.rendu ? c.rendu(l) : c.valeur(l)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div style={S.barre}>
              <button type="button" style={S.filtre} disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                ← Précédent
              </button>
              <span style={S.discret}>
                Page {page + 1} / {pages}
              </span>
              <button type="button" style={S.filtre} disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
                Suivant →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Pastille colorée (statuts). */
export function Pastille({ texte, couleur }: { texte: string; couleur: string }) {
  return <span style={{ ...S.pastille, background: couleur }}>{texte}</span>;
}

const bordure = '1px solid var(--card-border-color, rgba(127,127,127,.25))';
const S: Record<string, CSSProperties> = {
  page: { padding: '20px 24px', height: '100%', overflow: 'auto', boxSizing: 'border-box', fontSize: 13, color: 'var(--card-fg-color)' },
  h1: { fontSize: 20, fontWeight: 600, margin: '0 0 14px' },
  barre: { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', margin: '0 0 10px' },
  filtre: { font: 'inherit', padding: '6px 12px', borderRadius: 4, border: bordure, background: 'transparent', color: 'inherit', cursor: 'pointer' },
  filtreActif: { font: 'inherit', padding: '6px 12px', borderRadius: 4, border: '1px solid #237F2C', background: '#237F2C', color: '#fff', cursor: 'pointer' },
  recherche: { font: 'inherit', padding: '7px 10px', borderRadius: 4, border: bordure, background: 'transparent', color: 'inherit', minWidth: 300, flex: '0 1 420px' },
  total: { margin: '4px 0 8px' },
  discret: { color: 'var(--card-muted-fg-color, #777)' },
  erreur: { color: '#c0392b' },
  cadre: { overflowX: 'auto', border: bordure, borderRadius: 6 },
  table: { borderCollapse: 'collapse', width: '100%', fontVariantNumeric: 'tabular-nums' },
  th: {
    position: 'sticky', top: 0, background: 'var(--card-bg-color, #fff)', padding: '9px 10px', borderBottom: bordure,
    fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
  },
  tr: { cursor: 'pointer' },
  td: { padding: '7px 10px', borderBottom: bordure, whiteSpace: 'nowrap', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis' },
  pastille: { display: 'inline-block', padding: '2px 8px', borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 600 },
};
