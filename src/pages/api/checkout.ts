import type { APIRoute } from 'astro';
// Accès aux variables d'environnement Cloudflare. `Astro.locals.runtime.env`
// a été supprimé depuis Astro v6 : c'est désormais ce module qui fait foi.
import { env } from 'cloudflare:workers';
import { products, SITE } from '../../data/products';
import { unitPriceFor } from '../../lib/pricing';

// Route exécutée à la demande : le reste du site reste statique.
export const prerender = false;

const SHIPPING_FEE = 4.9;
const MAX_QTY = 20;

/**
 * Crée une session Stripe Checkout et renvoie son URL.
 *
 * ⚠️ Règle de sécurité : le navigateur n'envoie que des couples
 * { slug, quantité }. Les prix sont TOUJOURS relus dans products.ts et
 * recalculés ici. Un panier modifié dans la console ne peut donc pas changer
 * le montant débité — ne jamais accepter de prix venant du client.
 *
 * La clé secrète est lue dans l'environnement Cloudflare (STRIPE_SECRET_KEY)
 * et n'apparaît jamais dans le code ni dans le HTML envoyé au navigateur.
 */
export const POST: APIRoute = async ({ request, url }) => {
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  const key: string | undefined =
    (env as Record<string, string | undefined>)?.STRIPE_SECRET_KEY;

  if (!key) {
    return json(
      { error: 'Le paiement en ligne n\'est pas encore activé.' },
      503
    );
  }

  let body: { items?: { slug?: string; qty?: number }[] };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Requête invalide.' }, 400);
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) return json({ error: 'Votre panier est vide.' }, 400);

  const lines: { name: string; short: string; unitAmount: number; qty: number }[] = [];
  let subtotal = 0;

  for (const item of items) {
    const product = products.find((p) => p.slug === item.slug);
    if (!product) return json({ error: 'Produit inconnu dans le panier.' }, 400);
    if (!product.inStock) {
      return json({ error: `${product.shortName} est en rupture de stock.` }, 409);
    }

    const qty = Math.floor(Number(item.qty));
    if (!Number.isFinite(qty) || qty < 1 || qty > MAX_QTY) {
      return json({ error: 'Quantité invalide.' }, 400);
    }

    // Prix serveur, jamais celui envoyé par le navigateur.
    const unit = unitPriceFor(product, qty);
    subtotal += unit * qty;
    lines.push({
      name: product.name,
      short: product.shortName,
      unitAmount: Math.round(unit * 100),
      qty,
    });
  }

  const shipping = subtotal >= SITE.freeShippingThreshold ? 0 : SHIPPING_FEE;

  const form = new URLSearchParams();
  form.set('mode', 'payment');
  form.set('locale', 'fr');
  form.set('success_url', `${url.origin}/commande-confirmee/?session_id={CHECKOUT_SESSION_ID}`);
  form.set('cancel_url', `${url.origin}/panier/`);
  form.set('billing_address_collection', 'required');
  form.set('shipping_address_collection[allowed_countries][0]', 'FR');
  form.set('shipping_address_collection[allowed_countries][1]', 'BE');
  form.set('shipping_address_collection[allowed_countries][2]', 'LU');
  form.set('shipping_address_collection[allowed_countries][3]', 'CH');
  form.set('phone_number_collection[enabled]', 'true');

  // Récapitulatif lisible des articles, ex. « Pack 100 Perles ×2, Gourde ×1 ».
  // Stripe le reprend à deux endroits : sur le reçu de paiement envoyé au client
  // (si « Paiements réussis » est activé dans Emails clients) et sur la ligne de
  // paiement du dashboard, qui sert alors de bon de préparation au marchand.
  // Limite Stripe : 1 000 caractères sur `description` — on coupe bien avant.
  const summary = lines.map((l) => `${l.short} ×${l.qty}`).join(', ');
  form.set(
    'payment_intent_data[description]',
    summary.length > 500 ? `${summary.slice(0, 499)}…` : summary
  );

  lines.forEach((l, i) => {
    form.set(`line_items[${i}][quantity]`, String(l.qty));
    form.set(`line_items[${i}][price_data][currency]`, 'eur');
    form.set(`line_items[${i}][price_data][unit_amount]`, String(l.unitAmount));
    form.set(`line_items[${i}][price_data][product_data][name]`, l.name);
  });

  form.set('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
  form.set('shipping_options[0][shipping_rate_data][fixed_amount][amount]', String(Math.round(shipping * 100)));
  form.set('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'eur');
  form.set(
    'shipping_options[0][shipping_rate_data][display_name]',
    shipping === 0 ? 'Livraison offerte (2-5 jours)' : 'Livraison standard (2-5 jours)'
  );

  try {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });

    const data: any = await res.json();
    if (!res.ok) {
      // Le message brut de Stripe n'est pas renvoyé au client : il peut
      // contenir des détails de configuration du compte.
      console.error('Stripe:', data?.error?.message);
      return json({ error: 'Le paiement est momentanément indisponible.' }, 502);
    }
    return json({ url: data.url });
  } catch (e) {
    console.error('Stripe injoignable:', e);
    return json({ error: 'Le paiement est momentanément indisponible.' }, 502);
  }
};
