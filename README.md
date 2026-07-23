Voici le fichier README.md rédigé sur-mesure pour ton projet Dev & OSINT Vault, basé sur l'ensemble des fonctionnalités et de la stack développée dans notre échange.⚡ Dev & OSINT Vault (Vault.dev)Le répertoire ultime, ultra-rapide et interactif de ressources gratuites pour Développeurs et Chercheurs OSINT.📖 Sommaire🎯 À propos✨ Fonctionnalités Clés⌨️ Raccourcis Clavier (Power User)🛠️ Stack Technique📁 Arborescence du Projet🚀 Installation et Démarrage📊 Format de la Base de Données (tools.json)🤝 Contribution📄 Licence🎯 À proposDev & OSINT Vault est une application web moderne (PWA) conçue pour centraliser, classifier et explorer en quelques millisecondes des centaines d'outils issus de l'écosystème Free for Dev et Awesome OSINT.L'application est optimisée pour la productivité ("Power User") grâce à des raccourcis clavier, une recherche floue (fuzzy search), un système de fiches détaillées avec Cheat Sheets CLI, ainsi que la possibilité de sauvegarder et d'exporter ses sélections d'outils.✨ Fonctionnalités Clés🔍 Moteur de Recherche Instantané (Fuse.js) : Recherche floue tolérante aux fautes de frappe sur les titres, descriptions et catégories.⌨️ Palette de Commande (Ctrl + K / Cmd + K) : Accès rapide aux actions système et outils depuis n'importe où.🎲 Tirage Aléatoire ("Surprenez-moi") : Découvrez un outil au hasard en appuyant sur la touche R.📖 Fiches Modales Enrichies :Détection du modèle économique (Open Source, Gratuit, Freemium).Badges techniques (nécessite une Clé API, type CLI vs Web App).Commandes d'installation rapides et Cheat Sheets / aide-mémoire intégrés.Suggestions d'outils similaires/alternatifs dans la même catégorie.⭐ Gestion & Export de Favoris (Stack Exporter) :Sauvegarde locale dans le navigateur (localStorage).Exportation Markdown (.md) en un clic pour vos notes Obsidian/Notion ou README GitHub.Partage de Stack via URL (?favs=1,4,12) pour transmettre votre sélection d'outils à des collègues.📊 Visualisation & Statistiques : Barres de répartition dynamique et compteurs en temps réel par catégorie/source.🖥️ Affichage Personnalisable : Basculez entre la Vue Grille et la Vue Liste Compacte.📲 Support PWA & Mode Hors-ligne : Installable sur PC/Mac/Mobile grâce au Service Worker embarqué.💡 Formulaire de Suggestion : Proposez facilement de nouveaux outils à intégrer.⌨️ Raccourcis Clavier (Power User)RaccourciActionCtrl + K / Cmd + KOuvrir la Palette de commandes/Placer le curseur dans la Barre de rechercheRLancer un Tirage aléatoire d'outilEscFermer toutes les modales ouvertes🛠️ Stack TechniqueFramework : Astro (Static Site Generation / Performance maximale)Styling : Tailwind CSS (Design Sombre / Slate moderne)Search Engine : Fuse.js (Fuzzy Search côté client)PWA : Service Worker natif & Manifest WebPolice : Inter & Fira Code (Google Fonts)📁 Arborescence du ProjetPlaintextvault-dev/
├── public/
│   ├── manifest.json       # Configuration PWA
│   └── sw.js               # Service Worker pour le cache Hors-Ligne
├── src/
│   ├── data/
│   │   └── tools.json      # Base de données JSON des outils OSINT & Dev
│   ├── pages/
│   │   └── index.astro     # Page principale de l'application
│   └── styles/
│       └── global.css      # Directives Tailwind CSS & styles globaux
├── package.json
├── astro.config.mjs
└── README.md
🚀 Installation et DémarragePrérequisNode.js >= 18.xnpm, pnpm ou yarn1. Cloner le dépôtBashgit clone https://github.com/votre-compte/vault-dev.git
cd vault-dev
2. Installer les dépendancesBashnpm install
3. Lancer en mode DéveloppementBashnpm run dev
Ouvrez http://localhost:4321 dans votre navigateur.4. Build pour la ProductionBashnpm run build
Les fichiers statiques prêts pour le déploiement (Netlify, Vercel, GitHub Pages) seront générés dans le dossier ./dist/.📊 Format de la Base de Données (tools.json)Chaque outil stocké dans src/data/tools.json suit cette structure :JSON[
  {
    "title": "Sherlock",
    "url": "https://github.com/sherlock-project/sherlock",
    "description": "Recherchez des comptes sur les réseaux sociaux par nom d'utilisateur sur plus de 300 sites.",
    "category": "SOCMINT / Username Lookup",
    "source": "awesome_osint"
  },
  {
    "title": "JSONPlaceholder",
    "url": "https://jsonplaceholder.typicode.com/",
    "description": "API REST factice gratuite pour le test et le prototypage.",
    "category": "Development / Mock APIs",
    "source": "free_for_dev"
  }
]
🤝 ContributionLes contributions sont les bienvenues ! Pour ajouter un outil ou améliorer le code :Forkez le projet.Créez votre branche de fonctionnalité (git checkout -b feature/NouvelOutil).Ajoutez votre outil dans src/data/tools.json.Committez vos changements (git commit -m 'feat: ajout de l'outil XYZ').Pushez sur votre branche (git push origin feature/NouvelOutil).Ouvre une Pull Request.📄 LicenceCe projet est sous licence MIT. Vous êtes libre de le réutiliser, le modifier et le distribuer.
