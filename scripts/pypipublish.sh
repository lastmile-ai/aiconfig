#! /bin/zsh
# pypipublish.sh
# Usage: Run ./scripts/pypipublish.sh path/to/project/root conda-env-name
# path/to/project/root is anywhere with a pyproject.toml.

# NOTE: This assumes you have the aiconfig conda environment created.
# You will be prompted for a username and password. For the username, use __token__. 
# For the password, use the token value, including the pypi- prefix.
# To get a PyPi token, go here: 
# Need to get a token from here (scroll down to API Tokens): https://pypi.org/manage/account/ 
# If you have issues, read the docs: https://packaging.python.org/en/latest/tutorials/packaging-projects/ 

# If you want to upload to testpypi, run pypipublish-test.sh.

if [ -z "$2" ]
then
  echo "Usage: pypipublish.sh path/to/project/root conda-env-name"
  exit 1
fi


cd "$1"
if [ ! -f "pyproject.toml" ]
then
    echo "File pyproject.toml does not exist in the current directory"
    exit 1
fi

rm -rf ./dist

source /opt/homebrew/Caskroom/miniconda/base/etc/profile.d/conda.sh && conda activate "$2"\
    && python3 -m pip install --upgrade build \
    && python3 -m build \
    && python3 -m pip install --upgrade twine \
    && python3 -m twine upload dist/*

cd -