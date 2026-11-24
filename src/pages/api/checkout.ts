import type { APIRoute } from 'astro';
// Route à la demande (prerender = false), servie par server.mjs : les secrets
// sont lus dans process.env (variables d'environnement Coolify).
import { products, SITE } from '../../data/products';
import { unitPriceFor } from '../../lib/pricing';
import { verifierLimite, reponseTropDAppels, PLAFONDS } from '../../lib/rateLimit';
import { MARQUE_SESSION } from '../../lib/marque-stripe';
import { origineSite } from '../../lib/origine';
import { fraisLivraison } from '../../data/livraison.mjs';

// Route exécutée à la demande : le reste du site reste statique.
export const prerender = false;

const MAX_QTY = 20;
/** Lignes de panier au plus (le catalogue en compte moins ; Stripe plafonne à 100). */
const MAX_LIGNES = 20;
const PAYS_LIVRAISON = ['FR'] as const;

/**
 * Crée une session Stripe Checkout et renvoie son URL.
 *
 * ⚠️ Règle de sécurité : le navigateur n'envoie que des couples
 * { slug, quantité }. Les prix sont TOUJOURS relus dans products.ts et
 * recalculés ici. Un panier modifié dans la console ne peut donc pas changer
 * le montant débité — ne jamais accepter de prix venant du client.
 *
 * La clé secrète est lue dans l'environnement (STRIPE_SECRET_KEY, Coolify)
 * et n'apparaît jamais dans le code ni dans le HTML envoyé au navigateur.
 */
export const POST: APIRoute = async ({ request }) => {
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  // Limite anti-abus AVANT tout travail : cette route est appelable par
  // n'importe qui (un POST JSON n'est pas couvert par le contrôle d'origine
  // d'Astro) et chaque appel crée une session chez Stripe.
  const limite = verifierLimite(request, 'checkout', PLAFONDS.checkout.max, PLAFONDS.checkout.fenetreS);
  if (!limite.autorise) return reponseTropDAppels(limite.attendreS);

  const key: string | undefined = process.env.STRIPE_SECRET_KEY;

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

  // `null` ou une valeur simple sont du JSON valide : ne pas planter dessus (500).
  const items = body && typeof body === 'object' && Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) return json({ error: 'Votre panier est vide.' }, 400);
  // Le panier du site envoie une ligne par produit. Des lignes en double ou en
  // nombre déraisonnable ne viennent pas de lui : elles contourneraient le
  // plafond de quantité par produit (audit du 2026-11-24).
  if (items.length > MAX_LIGNES) return json({ error: 'Panier trop volumineux.' }, 400);
  if (new Set(items.map((i) => i?.slug)).size !== items.length) {
    return json({ error: 'Panier invalide.' }, 400);
  }

  const lines: { name: string; short: string; unitAmount: number; qty: number }[] = [];
  const colis: { poids: number; qty: number; offerte: boolean }[] = [];
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
    colis.push({ poids: product.poids, qty, offerte: product.livraisonOfferte });
  }

  // Livraison au poids (règle du Studio, src/data/livraison.mjs) — même calcul
  // que le panier, mais c'est CELUI-CI qui fixe le montant débité.
  const livraison = fraisLivraison(colis, SITE.livraison);
  if (livraison.frais === null) {
    return json({ error: 'Colis trop lourd pour un envoi en ligne : contactez-nous pour cette commande.' }, 400);
  }
  const shipping = livraison.frais;

  const form = new URLSearchParams();
  form.set('mode', 'payment');
  // Marque relue par /api/stripe-webhook : « cette session vient du site ».
  form.set('metadata[source]', MARQUE_SESSION);
  form.set('locale', 'fr');
  // Prix TOUJOURS en euros (CGV et frais de livraison en euros). Sans ce
  // paramètre, l'« Adaptive Pricing » de Stripe convertissait le panier dans la
  // devise du visiteur étranger (constaté en test : dollars US). Désactivé ici,
  // session par session : rien à régler dans le tableau de bord, et impossible
  // de l'oublier au passage en clés réelles.
  form.set('adaptive_pricing[enabled]', 'false');
  // Adresse de retour tirée de la configuration, jamais de la requête : voir
  // src/lib/origine.ts (url.origin valait http://localhost:4321).
  const origine = origineSite();
  form.set('success_url', `${origine}/commande-confirmee/?session_id={CHECKOUT_SESSION_ID}`);
  form.set('cancel_url', `${origine}/panier/`);
  form.set('billing_address_collection', 'required');
  // Pays de livraison = ceux que couvrent les CGV (article 4 : France
  // métropolitaine). Le tunnel acceptait aussi BE, LU et CH alors que les CGV
  // ne prévoient ni ces livraisons ni leurs frais (douane pour la Suisse) :
  // une commande aurait été passée hors de tout cadre contractuel. Pour
  // ouvrir un pays, l'ajouter ici ET dans les CGV, avec ses frais réels.
  PAYS_LIVRAISON.forEach((pays, i) => form.set(`shipping_address_collection[allowed_countries][${i}]`, pays));
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
    shipping === 0 ? 'Livraison offerte (2-5 jours)' : livraison.poids > SITE.livraison.poidsMaxForfait ? 'Colissimo à domicile (2-5 jours)' : 'Livraison standard (2-5 jours)'
  );

  try {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      signal: AbortSignal.timeout(15_000),
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
    // `montant` sert UNIQUEMENT à valoriser la conversion Google Ads sur la page
    // de confirmation. Il est renvoyé par le serveur, qui vient de le calculer,
    // plutôt que recalculé côté navigateur : la valeur envoyée à Google est donc
    // exactement celle facturée, frais de port compris.
    return json({ url: data.url, montant: Number((subtotal + shipping).toFixed(2)) });
  } catch (e) {
    console.error('Stripe injoignable:', e);
    return json({ error: 'Le paiement est momentanément indisponible.' }, 502);
  }
};
