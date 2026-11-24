import type { APIRoute } from 'astro';
import { products, SITE } from '../../../data/products';
import { calculerCommandePro } from '../../../data/commande-pro.mjs';
import { verifierLimite, reponseTropDAppels, PLAFONDS } from '../../../lib/rateLimit';
import { MARQUE_SESSION } from '../../../lib/marque-stripe';
import { origineSite } from '../../../lib/origine';
import { sessionPro } from '../../../lib/pro';

export const prerender = false;

/**
 * Paiement d'une commande REVENDEUR (/pro/).
 *
 * Réservé à un revendeur connecté ET validé à l'instant (statut relu dans
 * Sanity) ; prix, minimum et livraison recalculés ici à partir des données du
 * build (src/data/commande-pro.mjs) — rien de ce que le navigateur envoie
 * d'autre que slugs et quantités n'est cru.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

  const limite = verifierLimite(request, 'pro-checkout', PLAFONDS.checkout.max, PLAFONDS.checkout.fenetreS);
  if (!limite.autorise) return reponseTropDAppels(limite.attendreS);

  const pro = await sessionPro(cookies).catch(() => null);
  if (!pro) return json({ error: 'Votre session revendeur a expiré : reconnectez-vous.' }, 401);

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return json({ error: "Le paiement en ligne n'est pas encore activé." }, 503);

  let body: { items?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Requête invalide.' }, 400);
  }

  const commande = calculerCommandePro(body?.items, products, SITE.livraison);
  if (!commande.ok) return json({ error: commande.erreur }, 400);

  const origine = origineSite();
  const form = new URLSearchParams();
  form.set('mode', 'payment');
  form.set('metadata[source]', MARQUE_SESSION);
  form.set('metadata[revendeur]', pro._id);
  form.set('locale', 'fr');
  form.set('adaptive_pricing[enabled]', 'false');
  form.set('success_url', `${origine}/commande-confirmee/?session_id={CHECKOUT_SESSION_ID}`);
  form.set('cancel_url', `${origine}/pro/`);
  form.set('billing_address_collection', 'required');
  form.set('shipping_address_collection[allowed_countries][0]', 'FR');
  form.set('phone_number_collection[enabled]', 'true');
  if (pro.email) form.set('customer_email', pro.email);
  const resume = commande.lignes!.map((l) => `${l.nomCourt} ×${l.qty}`).join(', ');
  form.set('payment_intent_data[description]', `REVENDEUR ${pro.boutique ?? ''} — ${resume}`.slice(0, 500));

  commande.lignes!.forEach((l, i) => {
    form.set(`line_items[${i}][quantity]`, String(l.qty));
    form.set(`line_items[${i}][price_data][currency]`, 'eur');
    form.set(`line_items[${i}][price_data][unit_amount]`, String(Math.round(l.unit * 100)));
    form.set(`line_items[${i}][price_data][product_data][name]`, `${l.nom} — tarif revendeur`);
  });
  form.set('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
  form.set('shipping_options[0][shipping_rate_data][fixed_amount][amount]', String(Math.round(commande.livraison! * 100)));
  form.set('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'eur');
  form.set('shipping_options[0][shipping_rate_data][display_name]', 'Colissimo à domicile (2-5 jours)');

  try {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      signal: AbortSignal.timeout(15_000),
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    const data: any = await res.json();
    if (!res.ok) {
      console.error('Stripe (pro):', data?.error?.message);
      return json({ error: 'Le paiement est momentanément indisponible.' }, 502);
    }
    return json({ url: data.url, montant: commande.total });
  } catch (e) {
    console.error('Stripe injoignable (pro):', e);
    return json({ error: 'Le paiement est momentanément indisponible.' }, 502);
  }
};
