# Correction ajout dynamique des référentiels

Cette version rend les listes **Unité, Devise, Pays, Catégorie et Incoterm** persistantes côté backend.

- GET `/api/reference-options/{kind}` charge les valeurs depuis PostgreSQL.
- POST `/api/reference-options/{kind}` ajoute une valeur absente.
- Les doublons sont détectés sans tenir compte de la casse.
- Après ajout, la valeur est immédiatement ajoutée au select et sélectionnée.
- Les valeurs ajoutées restent disponibles après redémarrage.
- Endpoint de diagnostic : GET `/api/reference-options`.

Test conseillé :
1. Démarrer le backend et vérifier `http://127.0.0.1:8000/api/reference-options`.
2. Créer une annonce, cliquer `+` à côté de l'unité, saisir `Palette`, puis valider avec `✓`.
3. `Palette` doit être sélectionnée immédiatement.
4. Recharger la page : `Palette` doit toujours être présente.
