/**
 * Rédaction d'articles en texte simple → document Sanity « article ».
 *
 * Dans les sections, chaque élément de `blocs` est un paragraphe :
 *   « - texte »    élément de liste à puces
 *   « 1. texte »   élément de liste numérotée
 *   « ### texte »  intertitre (h3)
 *   [mots](/chemin/)  lien (interne « / » ou externe https)
 *   **mots**          gras
 * Les clés (_key) sont dérivées du contenu : réécrire le même texte donne le
 * même document (pas de faux changement dans le Studio).
 */
import { createHash } from 'node:crypto';

const cle = (...p) => createHash('sha1').update(p.join('|')).digest('hex').slice(0, 12);

/** Découpe « texte avec [lien](/x/) et **gras** » en spans Portable Text. */
function spans(texte, graine) {
  const markDefs = [];
  const children = [];
  const motif = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let fin = 0;
  const pousser = (text, marks = []) => {
    if (text) children.push({ _type: 'span', _key: cle(graine, 's', String(children.length), text), text, marks });
  };
  for (const m of texte.matchAll(motif)) {
    pousser(texte.slice(fin, m.index));
    if (m[1]) {
      const k = cle(graine, 'lien', m[2], String(markDefs.length));
      markDefs.push({ _type: 'link', _key: k, href: m[2] });
      pousser(m[1], [k]);
    } else {
      pousser(m[3], ['strong']);
    }
    fin = m.index + m[0].length;
  }
  pousser(texte.slice(fin));
  return { markDefs, children };
}

export function bloc(texte, graine) {
  let t = texte;
  const extra = {};
  let style = 'normal';
  if (t.startsWith('- ')) {
    t = t.slice(2);
    Object.assign(extra, { listItem: 'bullet', level: 1 });
  } else if (/^\d+\. /.test(t)) {
    t = t.replace(/^\d+\. /, '');
    Object.assign(extra, { listItem: 'number', level: 1 });
  } else if (t.startsWith('### ')) {
    t = t.slice(4);
    style = 'h3';
  }
  const { markDefs, children } = spans(t, `${graine}|${t}`);
  return { _type: 'block', _key: cle(graine, t), style, markDefs, children, ...extra };
}

/**
 * @param {object} a
 *   slug, titre, titreCarte, libelleCourt, categorie, tempsLecture, datePublication,
 *   dateMiseAJour, extrait, chapo, reponseCourte, metaTitle, metaDescription,
 *   sections: [{ titre, blocs: string[] }], faq: [{ question, reponse }], sources: [{ titre, editeur, url }]
 */
export function brouillonArticle(a) {
  const id = `article-${a.slug}`;
  const longueurs = { titreCarte: 70, libelleCourt: 40, extrait: 200, reponseCourte: 320, metaTitle: 65 };
  for (const [champ, max] of Object.entries(longueurs)) {
    if ((a[champ] ?? '').length > max) throw new Error(`${a.slug} : ${champ} fait ${a[champ].length} caractères (max ${max})`);
  }
  const d = a.metaDescription.length;
  if (d < 70 || d > 160) throw new Error(`${a.slug} : metaDescription de ${d} caractères (70-160)`);
  return {
    _id: `drafts.${id}`,
    _type: 'article',
    slug: { _type: 'slug', current: a.slug },
    titre: a.titre,
    titreCarte: a.titreCarte,
    libelleCourt: a.libelleCourt,
    categorie: a.categorie,
    tempsLecture: a.tempsLecture,
    datePublication: a.datePublication,
    ...(a.dateMiseAJour ? { dateMiseAJour: a.dateMiseAJour } : {}),
    ...(a.auteur ? { auteur: a.auteur } : {}),
    extrait: a.extrait,
    chapo: a.chapo,
    reponseCourte: a.reponseCourte,
    metaTitle: a.metaTitle,
    metaDescription: a.metaDescription,
    sections: a.sections.map((s, i) => ({
      _type: 'section',
      _key: cle(a.slug, 'section', String(i)),
      titre: s.titre,
      contenu: s.blocs.map((t, j) => bloc(t, `${a.slug}|${i}|${j}`)),
    })),
    faq: a.faq.map((q, i) => ({ _type: 'questionReponse', _key: cle(a.slug, 'faq', String(i)), ...q })),
    sources: a.sources.map((s) => ({ _type: 'source', _key: cle(a.slug, s.url), ...s })),
  };
}

/** Temps de lecture estimé (230 mots/minute), arrondi à la minute supérieure. */
export function tempsDeLecture(a) {
  const texte = [a.chapo, a.reponseCourte, ...a.sections.flatMap((s) => [s.titre, ...s.blocs]), ...a.faq.flatMap((q) => [q.question, q.reponse])].join(' ');
  return Math.max(3, Math.ceil(texte.split(/\s+/).length / 230));
}
