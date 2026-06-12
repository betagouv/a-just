# a-just

Dépôt de code du projet A-JUST du Ministère de la Justice

# Documentation

Il faut avoir un mail beta.gouv pour accéder à la documentation.
https://app.gitbook.com/o/ERPUa4pw8EhQDGz6MqrT/home

# Mode dev

1. Initialisation des variables d'environnements

2. Initialisation de la BDD

```
// copie des fichiers d'environement
cp .env.exemple .env
cp api/.env.example api/.env // Il faut changer les variables d'exemples

// démarrage du docker postgress
npm run db:build
npm run db:start
```

3. Démarrage du serveur

```
cd api
npm ci
npm run start

accéssible http://localhost:8080/api
```

4. Démarrage du front

```
cd front
npm ci
npm run start

accéssible http://localhost:4200
```

## Accès à la BDD

Scalingo CLI
`curl -O https://cli-dl.scalingo.com/install && bash install`

Ajouter la clée SSH via le dashboard

Passer en mode tunnel

```
scalingo --app a-just-staging db-tunnel "DATABASE_URL"
```

## Creation de clée SHA1 pour le SSO

openssl req -new -newkey rsa:2048 -nodes -out sso-recette.csr -keyout sso-recette.key -sha1 -> key => (SSO_PRIVATE_KEY)
openssl x509 -req -days 3650 -in sso-recette.csr -signkey sso-recette.key -out sso-recette.crt
openssl x509 -pubkey -noout -in sso-recette.crt > sso-recette.pem -> pem => (SSO_PUBLIC_KEY)

## Kubernetis

// Attention, la ligne ne fonctionnera pas du premier coup. Vérifier le nom des images dockers lors du premier test.
npm run deploy:production

## Synchronisation des origines Git

Le script `scripts/sync-remotes.sh` permet de synchroniser toutes les branches d'une origine git vers une autre (par exemple GitHub vers un miroir).

```bash
# Ajouter la seconde origine
git remote add miroir git@github.com:mon-org/a-just-miroir.git

# Simuler la synchronisation
./scripts/sync-remotes.sh origin miroir --dry-run

# Synchroniser toutes les branches
./scripts/sync-remotes.sh origin miroir

# Synchroniser les branches et les tags, en excluant dependabot
./scripts/sync-remotes.sh origin miroir --tags --exclude 'dependabot/*'
```

Options disponibles :

| Option | Description |
|--------|-------------|
| `--dry-run` | Affiche les opérations sans pousser |
| `--tags` | Synchronise aussi les tags |
| `--force` | Force le push (`--force-with-lease`) |
| `--exclude PATTERN` | Exclut certaines branches (répétable) |
| `--include PATTERN` | Ne synchronise que certaines branches (répétable) |

La synchronisation est unidirectionnelle (source → destination). Les branches présentes uniquement sur la destination ne sont pas supprimées. Pour synchroniser dans l'autre sens, relancer le script en inversant les origines.

# test 2
