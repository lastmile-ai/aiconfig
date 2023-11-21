## Running Locally

0. Create and activate a conda environment

```
conda create --name aiconfig
conda activate aiconfig
```

1. Navigate to the `aiconfig/python` directory
2. Install required testing dependencies `pip install -r requirements.txt`
3. "install" the aiconfig source package with `pip install -e .` The -e flag links the package to your local src. Any changes made are automatically updated.
4. Set VS Code interpreter to the conda environment. `CMD + Shift + P` > `Python: Select Interpreter` > `Select 'aiconfig'` then restart VS Code to take effect

## Testing

To run the tests in this repo:

1. Navigate to the `aiconfig/python` directory
2. Install additional testing dependencies: `pip install -r requirements-dev.txt`. These aren't included by default when we clone the repo so you need to add these explicitly for the tests to run. See the requirements-dev.txt file to see what packages pip will install.
3. "install" the aiconfig source package with `pip install -e .` The -e flag links the package to your local src. Any changes made are automatically updated.
4. run tests `pytest`
5. run linter `flake8`

feel free to run ` black <path_to_src>` or `black .` , to format code, but this is not required. It is easier to use a vscode extension which will automatically format your code on save.

TODO: build a github action workflow to automatically test and lint code.
