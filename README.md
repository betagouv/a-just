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
npm i
npm run start

accéssible http://localhost:8080/api
```

4. Démarrage du front
```
cd front
npm i
npm run start

accéssible http://localhost:4200
```

## Accès à la BDD
Scalingo CLI
```curl -O https://cli-dl.scalingo.com/install && bash install```

Ajouter la clée SSH via le dashboard

Passer en mode tunnel
```
scalingo --app a-just-staging db-tunnel "DATABASE_URL"
```

## Configuration du DNS
Always Data
https://admin.alwaysdata.com/
francois-xavier.montigny@beta.gouv.fr
Demander le mot de passe à FX

## Visibilité des logs serveur utilisateurs
URL en GET, il faut utiliser Postman pour saisir un mot de passe en Baerer. 
https://a-just.incubateur.net/logs/system
Les mots de passe sont sur le document des mots de passes de Resanna
