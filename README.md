# episto

## Installation

### Database

For development, just fill out the correct information for `adapters_local_mongo` under `config/local.js`. In a production environment, set the `MONGO_HOST`, `MONGO_PORT`, `MONGO_USER`, `MONGO_PWD`, and `MONGO_DB` environment variables instead.

If you haven't set up MongoDB before, it's fairly simple:

1. Follow the [MongoDB Installation Guide](http://docs.mongodb.org/manual/tutorial/install-mongodb-on-windows/) to create a service.
2. Connect to the database by running `mongo` (you may have to cd into the mongodb directory to do this) and create a new admin user:

```js
use admin
db.createUser({
    user: "admin", pwd: "password",
    roles: [{ role: "userAdminAnyDatabase", db: "admin" }]
})
```

3. From the same console, create an episto user as well:

```js
db.createUser({
 		user:"episto", pwd:"password", 
 		roles: [{role:"readWrite", db:"episto"}]
})
```

4. This should allow Episto to run like a charm on any dev environment.

## Testing

Run `npm test` or `grunt test`.

## Troubleshooting

* Run `$Env:GYP_MSVS_VERSION=2013` before running `npm i` on Windows if npm is returning errors that mention ` The build tools for Visual Studio 2010 (Platform Toolset = 'v100') cannot be found.`.

## Proofs of Concept

Before any one part of Episto was implemented, we made sure the underlying technology was viable using proofs of concept. When lifting Sails, check them out by navigating to `localhost:3000/concepts`.