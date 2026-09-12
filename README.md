# 💬 Lecteur d'Exports mammouth.ai

Lecteur web pensé pour visualiser les exports de conversations de mammouth.ai (format JSON), et plus largement tout fichier de conversations structuré.

C'est une application 100 % statique : on ouvre `index.html` dans un navigateur, pas de serveur, pas de build, pas d'installation. Les bibliothèques externes (`marked`, `DOMPurify`) sont incluses localement dans `vendor/`.

## 🚀 Lancement

1. Ouvrez `index.html` dans un navigateur moderne (Chrome, Firefox, Edge, Safari).
2. Cliquez sur **"📂 Choisir un fichier"** et sélectionnez un fichier JSON (un export mammouth.ai, par exemple).
3. Les conversations apparaissent dans le panneau gauche, avec leur titre, leur date et leur nombre de messages.
4. Cliquez sur une conversation pour afficher son contenu dans le panneau de droite.

## 📋 Formats JSON supportés

L'extraction des conversations gère plusieurs structures, détectées automatiquement :

```
[ { "chats": [...] }, ... ]      →  export mammouth.ai (principal)
{ "chats": [...] }               →  structure standard
{ "conversations": [...] }       →  clé conversations
[ { id, title, messages }, ... ] →  tableau direct de conversations
{ "document": { ... } }          →  wrapper document (recherche récursive)
```

Exemple de structure d'un export mammouth.ai :

```json
[
  {
    "type": "customMammoth",
    "chats": [
      {
        "id": 18865234,
        "title": "Structure JSON",
        "createdAt": "2026-07-26T10:29:04.896Z",
        "updatedAt": "2026-07-26T10:36:03.862Z",
        "messages": [
          { "type": "message", "id": 149569859, "content": "...", "model": "mistral-small-2603-reasoning" },
          { "type": "message", "id": 149569860, "content": "...", "model": "mistral-small-2603-reasoning" }
        ]
      }
    ]
  }
]
```

### Rôles des messages

Le rôle d'un message est déterminé en priorité par son champ `model`, puis (pour les exports mammouth) par la position dans la conversation — index pair = utilisateur, index impair = assistant.

| Valeur de `model` | Rôle affiché |
|---|---|
| `user`, `human`, `me` | 👤 Utilisateur |
| `system`, `tool` | ⚙️ Système |
| Toute autre valeur | 🤖 Assistant |

> ℹ️ Dans un export mammouth, le champ `model` porte le **nom du modèle** (ex. `mistral-small-2603-reasoning`) et sert de **badge d'affichage** sur les réponses de l'assistant ; il n'indique pas l'expéditeur du message.

### Blocs de raisonnement

Les réponses de l'assistant peuvent commencer par un bloc de réflexion délimité par les balises ` thinking` et ` response`. L'application détecte ce bloc et l'affiche dans un encart dépliable **« 💭 Raisonnement »**, séparé du contenu final.

## ✨ Fonctionnalités

- **Export Markdown** : chaque conversation a un bouton **⬇** qui génère un document Markdown propre (métadonnées, un titre par rôle, le modèle et l'horodatage, le bloc « Raisonnement » en citation, les liens détectés en liste). La sauvegarde passe par la boîte de dialogue native (File System Access API, Chromium) avec repli automatique sur un simple téléchargement.
- **Markdown complet** : rendu GitHub Flavored Markdown via `marked` (GFM, retours à la ligne automatiques).
- **Contenu sécurisé** : l'HTML est assaini avec `DOMPurify` — les images sont supprimées, les liens s'ouvrent dans un nouvel onglet (`target="_blank"` + `rel="noopener noreferrer"`).
- **Recherche** par titre ou contenu de message (insensible à la casse).
- **Liste des conversations** avec titre, date, et nombre de messages.
- **Rendu détaillé** : bulles différenciées (utilisateur / assistant / système), badge du modèle, horodatage.
- **Gestion des erreurs** : fichier illisible ou JSON mal formé → bannière d'erreur.
- **Design responsive** (desktop et mobile).
- **Accessibilité** : navigation clavier (Entrée/Espace), labels et rôles ARIA en français.

## 🧰 Dépendances

Aucune installation ni réseau requis pour fonctionner : `marked` (rendu Markdown) et `DOMPurify` (assainissement HTML) sont chargés depuis `vendor/`.

## 🧪 Tests

Les fonctions pures de `script.js` (extraction des conversations, rôles, rendu Markdown, export, utilitaires) sont couvertes par des tests unitaires utilisant le test runner intégré de Node.js (`node:test`), sans dépendance externe :

```
node --test "tests/*.test.js"
```

Nécessite Node.js 18+. Les tests chargent `script.js` via `module.exports` et simulent un environnement minimal (`document`, `marked`, `DOMPurify`) dans `tests/setup.js` pour s'exécuter sans navigateur.

## 📂 Structure du projet

```
mammouthai_reader/
├── index.html          # Structure HTML
├── style.css           # Styles CSS (variables de couleur, thème)
├── script.js           # Logique JavaScript (vanilla ES6)
├── logo.svg            # Logo mammouth.ai (header + footer)
├── vendor/             # Bibliothèques locales (marked, DOMPurify)
├── tests/              # Tests unitaires (node:test)
└── README.md           # Ce fichier
```

## ⚠️ Limites connues

- L'application ne gère que les fichiers JSON.
- Les images présentes dans le contenu sont volontairement supprimées au rendu (sécurité).
- La coloration syntaxique des blocs de code (highlight.js) est prévue pour une future passe.
- Aucune persistance : les données sont perdues au rechargement de la page.
- Les très gros fichiers peuvent ralentir le rendu.