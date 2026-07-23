/**
 * Amélioration progressive du formulaire revendeur.
 *
 * Le formulaire fonctionne déjà sans ce fichier : c'est un `<form method="post">`
 * natif qui poste sur /api/revendeur. Ce script ajoute seulement :
 *   - l'horodatage d'ouverture (filtre anti-robot côté serveur) ;
 *   - l'envoi sans rechargement, pour qu'une erreur ne vide pas les champs
 *     déjà saisis ;
 *   - l'affichage du message d'erreur sous le bouton.
 *
 * Fichier externe et non `<script>` en ligne : la CSP du site n'autorise que
 * les scripts servis depuis notre domaine (`script-src 'self'`).
 */
(function () {
  'use strict';

  var form = document.querySelector('[data-formulaire-revendeur]');
  if (!form) return;

  var horodatage = form.querySelector('[data-horodatage]');
  if (horodatage) horodatage.value = String(Date.now());

  var statut = form.querySelector('[data-statut-formulaire]');
  var bouton = form.querySelector('button[type="submit"]');

  function afficherErreur(message) {
    if (!statut) return;
    statut.textContent = message;
    statut.hidden = false;
    statut.classList.remove('hidden');
  }

  function masquerErreur() {
    if (!statut) return;
    statut.textContent = '';
    statut.classList.add('hidden');
  }

  form.addEventListener('submit', function (evenement) {
    // Laisse le navigateur signaler lui-même les champs obligatoires vides.
    if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;

    evenement.preventDefault();
    masquerErreur();

    if (bouton) {
      bouton.disabled = true;
      bouton.textContent = 'Envoi…';
    }

    fetch(form.action, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form),
    })
      .then(function (reponse) {
        return reponse
          .json()
          .catch(function () {
            return {};
          })
          .then(function (donnees) {
            if (reponse.ok) {
              window.location.assign('/revendeurs/merci/');
              return;
            }
            throw new Error(donnees.error || "L'envoi a échoué.");
          });
      })
      .catch(function (erreur) {
        afficherErreur(
          erreur.message +
            ' Vous pouvez aussi nous écrire directement à contact@aimezlanature.fr.'
        );
        if (bouton) {
          bouton.disabled = false;
          bouton.textContent = 'Envoyer ma demande';
        }
      });
  });
})();
