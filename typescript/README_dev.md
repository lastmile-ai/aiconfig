## Testing Package Before Publishing

Before publishing the package, ensure it works locally within relevant cookbooks.

Note, if a local tarball already exists, remove it before continuing. e.g.:

```
rm aiconfig-v1.0.0.tgz
```

Then create the local package:

```
rm -rf dist && yarn build && yarn pack
```

In the consuming package (e.g. cookbooks/Function-Calling-OpenAI/typescript), update the `package.json` to point to the local package, e.g.:

```
"dependencies": {
  ...
  "aiconfig": "file:/Users/ryanholinshead/Projects/aiconfig/typescript/aiconfig-v1.1.0.tgz"
},
```

and update the `tsconfig.json` in the consuming package to find the type declarations:

```
"compilerOptions": {
  ...
  "paths": {
    "aiconfig": ["./node_modules/aiconfig"]
  }
}
```

Then, in the consuming package, load the local package (ensuring yarn cache is cleared firs):

```
rm -rf node_modules && rm yarn.lock && yarn cache clean && yarn
```
