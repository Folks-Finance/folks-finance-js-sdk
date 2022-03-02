# folks-finance-js-sdk
The official JavaScript SDK for the Folks Finance Protocol

## Installation
Using [Node.js](https://nodejs.org/en/download/):
```
git clone git@github.com:Folks-Finance/folks-finance-js-sdk.git
cd folks-finance-js-sdk
npm install
```

## Documentation
Documentation for this SDK is available at https://folks-finance.github.io/folks-finance-js-sdk/. 

## Running examples
Portions of the codebase are written in TypeScript, so running examples requires ts-node, an npm package that runs TypeScript files directly. To make this easier for the user, we've included an example alias for ts-node in the project's package.json scripts:
```
$ npm run example examples/liquidate.ts 
```
Make sure to set your desired configuration in `examples/config.ts` first.
