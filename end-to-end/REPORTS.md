# Configuration des rapports Cypress avec Mochawesome

Ce projet utilise `cypress-mochawesome-reporter` pour générer des rapports HTML détaillés des tests e2e.

## Utilisation en local

### Commandes disponibles

```bash
# Exécuter les tests avec génération de rapport
npm run cy:run:report

# Nettoyer les anciens rapports
npm run clean:reports

# Exécuter les tests normalement
npm run cy:run
```

### Rapports générés

Les rapports sont générés dans `cypress/reports/` et incluent :

- **HTML** : Rapport visuel avec graphiques et captures d'écran
- **JSON** : Données brutes pour intégration CI/CD

### Configuration

Le reporter est configuré dans `cypress.config.ts` avec les options suivantes :

- Captures d'écran intégrées
- Graphiques de résultats
- Assets intégrés pour un rapport autonome
- Horodatage des rapports

## Intégration CI/CD

Dans GitHub Actions, les rapports sont automatiquement :

1. Générés lors de l'exécution des tests
2. Uploadés comme artefacts
3. Analysés par `test-reporter` pour un résumé visuel

### Artefacts disponibles

- `cypress-reports` : Rapports HTML et JSON
- `cypress-video` : Vidéos des tests
- `cypress-screenshots` : Captures d'écran en cas d'échec

## Structure des fichiers

```
cypress/
├── reports/           # Rapports générés (ignorés par git)
├── videos/           # Vidéos des tests
├── screenshots/      # Captures d'écran
└── e2e/             # Tests e2e
```
