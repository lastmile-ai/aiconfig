## Running Locally
0. Create a conda environment
1. Navigate to the aiconfig_tools directory
2. Install required testing dependencies `pip install -r requirements.txt`
3. "install" the aiconfig source package with `pip install -e .` The -e flag links the package to your local src. Any changes made are automatically updated.


## Testing

To run the tests in this repo,

1. Navigate to the aiconfig_tools directory
2. Install required testing dependencies `pip install -r requirements_dev.txt`
3. "install" the aiconfig source package with `pip install -e .` The -e flag links the package to your local src. Any changes made are automatically updated.
4. run tests `pytest`
5. run linter `flake8`

feel free to run ` black <path_to_src>` or `black .` , to format code, but this is not required. It is easier to use a vscode extension which will automatically format your code on save.

TODO: build a github action workflow to automatically test and lint code.
