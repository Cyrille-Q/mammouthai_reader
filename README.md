# 💬 Lecteur d'Exports mammouth.ai

Lecteur web spécifiquement conçu pour visualiser les exports de conversations de mammouth.ai (format JSON).

## 🚀 Lancement

1. Ouvrez `index.html` dans un navigateur moderne (Chrome, Firefox, Edge, Safari).
2. Cliquez sur **"📂 Choisir un fichier"** et sélectionnez un fichier JSON.
3. Les conversations s'affichent dans le panneau gauche. Cliquez sur une conversation pour voir son contenu.

Aucune dépendance n'est requise. Tout fonctionne en vanilla HTML/CSS/JS.

## 📋 Formats JSON supportés

### Format d'export mammouth.ai (principal)
L'application est optimisée pour le format d'export natif de mammouth.ai :
```json
[
  {
    "type": "customMammoth",
    "chats": [
      {
        "id": 1,
        "title": "Titre de la conversation",
        "createdAt": "2026-07-20T10:00:00Z",
        "messages": [
          { "type": "message", "id": 101, "content": "...", "model": "user" },
          { "type": "message", "id": 102, "content": "...", "model": "gpt-5" }
        ]
      }
    ]
  }
]
```
**Particularités du format mammouth.ai :**
- Les messages alternent automatiquement entre utilisateur (index pair) et assistant (index impair)
- Le champ `model` indique le modèle utilisé pour la conversation entière
- Les blocs de raisonnement sont délimités par les balises `<think>` et `</think>`

### Autres formats compatibles
- **Structure standard** : `{ "chats": [...] }`
- **Tableau direct** : `[ { id, title, messages, ... }, ... ]`
- **Clé `conversations`** : `{ "conversations": [...] }`
- **Structure `document`** (wrapper) : l'application cherche récursivement

### Rôles des messages
Le champ `model` détermine l'affichage du message :
| Valeur de `model` | Rôle affiché |
|---|---|
| `user`, `human`, `me` | 👤 Vous (bulle à droite) |
| `system`, `tool` | ⚙️ Système (bulle centrée) |
| Toute autre valeur | 🤖 Assistant (bulle à gauche, badge modèle) |

## ✨ Fonctionnalités

- **Optimisé pour les exports mammouth.ai** : prise en charge native du format d'export, gestion des blocs de raisonnement (`<think>` et `</think>`), alternance automatique des rôles
- **Lecture de fichiers JSON** depuis le disque local
- **Liste des conversations** avec titre, date et nombre de messages
- **Affichage détaillé** avec bulles différenciées (utilisateur / assistant / système)
- **Recherche** par titre ou contenu de message
- **Formatage** : blocs de code, code inline, horodatage
- **Gestion des erreurs** : fichier invalide, JSON mal formé
- **Design responsive** (desktop et mobile)
- **Accessibilité** : navigation clavier, ARIA labels

## 📂 Structure du projet
```
mammouthai_reader/
├── index.html      # Structure HTML
├── style.css       # Styles CSS
├── script.js       # Logique JavaScript
└── README.md       # Documentation
```

## ⚠️ Limites connues

- L'application ne gère pas les fichiers non-JSON.
- Le rendu du Markdown est limité (blocs de code et code inline uniquement).
- Aucune persistance : les données sont perdues au rechargement de la page.
- Les très gros fichiers (>50 Mo) peuvent ralentir le rendu.
