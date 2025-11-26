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

# test 2
