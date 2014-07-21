# episto

## Installation

### Database

For development, just fill out the correct information for `adapters_local_mongo` under `config/local.js`. In a production environment, set the `MONGO_HOST`, `MONGO_PORT`, `MONGO_USER`, `MONGO_PWD`, and `MONGO_DB` environment variables instead.

## Testing

Run `npm test` or `grunt test`.

## Troubleshooting

* Run `$Env:GYP_MSVS_VERSION=2013` before running `npm i` on Windows if npm is returning errors that mention ` The build tools for Visual Studio 2010 (Platform Toolset = 'v100') cannot be found.`.

## Proofs of Concept

Before any one part of Episto was implemented, we made sure the underlying technology was viable using proofs of concept. When lifting Sails, check them out by navigating to `localhost:3000/concepts`.