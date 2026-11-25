import type { APIRoute } from 'astro';
import { verifierLimite, PLAFONDS } from '../../../lib/rateLimit';
import { envoyerLien, espaceProConfigure, revendeurValideParEmail } from '../../../lib/pro';

export const prerender = false;

/**
 * « Recevoir un nouveau lien de connexion » (/pro/connexion/).
 *
 * Réponse IDENTIQUE que l'email soit celui d'un revendeur validé ou non (et
 * envoi fait en arrière-plan, pour un temps de réponse identique aussi) :
 * personne ne peut se servir de ce formulaire pour savoir qui est revendeur.
 */
export const POST: APIRoute = async ({ request }) => {
  const suite = new Response(null, { status: 303, headers: { Location: '/pro/connexion/?envoye=1' } });
  const limite = verifierLimite(request, 'pro-lien', PLAFONDS.formulaire.max, PLAFONDS.formulaire.fenetreS);
  if (!limite.autorise) return new Response(null, { status: 303, headers: { Location: '/pro/connexion/?attendre=1' } });

  let email = '';
  try {
    const form = await request.formData();
    const brut = form.get('email');
    email = typeof brut === 'string' ? brut.trim().slice(0, 120) : '';
  } catch {
    return suite;
  }
  if (!espaceProConfigure() || !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) return suite;

  void revendeurValideParEmail(email)
    .then((r) => (r ? envoyerLien(r) : false))
    .catch((e) => console.error('[pro] demande de lien :', e?.message ?? e));
  return suite;
};
