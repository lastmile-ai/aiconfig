# Add extensions for AIConfig

We use extensions to add features which we don't want to put into the core library (`aiconfig/python` or `aiconfig/typescript`). For example, a feature may require extra dependencies which we don't want to add to core.

## Steps for adding a dependency

1. Create a new folder under `aiconfig/extentions`
2. Add a `README.md` explaining what your dependency does
3. Add subfolders for `python` and/or `typescript`, depending on which language(s) you choose to support!
