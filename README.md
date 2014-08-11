# episto

Episto intends to change the way users interact with audio recordings. Instead of wasting time scrubbing through a recording for the parts that matter, using Episto, important information is extracted and pinpointed, allowing the user to reference meetings much more effectively.

### Why?

Episto is the natural next step for virtual assistants. This application of technology could allow virtual assistants to act on their own without inalienating the user. At the same time, virtual assistants can take a greater role in the user's lifestyle, prioritizing information for them in a clear and reliable manner.

## Installation

The following commands are enough to get the server ready to run, assuming a a proper environment.

```bash
$ npm install -g grunt-cli
$ npm install
$ grunt install
```

## Testing

Run `npm test` or `grunt test`.

## Troubleshooting

* Run `$Env:GYP_MSVS_VERSION=2013` before running `npm i` on Windows if npm is returning errors that mention ` The build tools for Visual Studio 2010 (Platform Toolset = 'v100') cannot be found.`.

## Proofs of Concept

Before any one part of Episto was implemented, we made sure the underlying technology was viable using proofs of concept. When lifting Sails, check them out by navigating to `localhost:3000/concepts`.

## Useful Documentation

* [EJS Locals](https://github.com/RandomEtc/ejs-locals)