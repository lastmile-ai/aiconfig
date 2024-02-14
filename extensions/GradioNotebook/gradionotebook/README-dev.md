## If running for the FIRST TIME and building on this

Otherwise, go directly to [dev instructions](https://github.com/lastmile-ai/gradio-workbook/blob/main/gradioworkbook/README-dev.md#follow-these-steps-if-you-are-developing-locally)

Alright yo, this is kind of cumbersome, but follow this process
if you have never gotten this to run before.

### Environment Setup

1. Install node.js & yarn
   - Latest Node version from [website](https://nodejs.org/en/download/current) using the package installer
   - After installing Node, open a new terminal to install [yarn](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable): `sudo npm install --global yarn`
2. Gradio uses `pip` and `python` for executing commands so you must symlink `python` and `pip` (aliasing is not enough) to `python3` and `pip3`:
   - `python3 -m pip install --upgrade --force pip` ([source](https://stackoverflow.com/a/55494352))
   - force `python` to be symlinked to `python3` ([instructions](https://stackoverflow.com/a/71957847))
3. Install Gradio itself: `pip install gradio`

### Setting up Gradio repo

Note: These instructions for this section may be outdated now, so just follow the next section if it breaks
TODO (rossdanlm): Fix these

1. Go to the project where this is defined. Ex: `~/Projects`
2. Delete this entire repo! `rm -rf GradioNotebook`
3. Gradio uses `pip` and `python` for executing commands so you must symlink `python` and `pip` (aliasing is not enough) to `python3` and `pip3`:
   - `python3 -m pip install --upgrade --force pip` ([source](https://stackoverflow.com/a/55494352))
   - force `python` to be symlinked to `python3` ([instructions](https://stackoverflow.com/a/71957847))
4. Run the command `gradio cc create Notebook --overwrite`. This will install the necessary setups and dependencies
5. `cd .. && rm -rf gradio-notebook`
6. Clone the repo again: `git clone https://github.com/lastmile-ai/gradio-workbook.git` (with Sapling: `sl clone https://github.com/lastmile-ai/gradio-workbook.git`)
7. `cd gradio-workbook` and follow the steps below!

## Follow these steps if you are developing locally!

```bash
cd GradioNotebook
pip install -r requirements.txt
cd frontend && yarn dev
```

## Publishing package

There can be up to 5 packages needed to fully publish updates to Gradio, and must be done in this order (if changes needed):

1. `AIConfig Editor` client: https://github.com/lastmile-ai/aiconfig/pull/830
2. HuggingFace extension: `aiconfig/extensions/HuggingFace`
3. main python package: `python-aiconfig`
4. GradioNotebook client: cd `GradioNotebook/frontend`
   - update `frontend/package` for `@lasmile/aiconfig-editor`
5. GradioNotebook pypi: cd `GradioNotebook`
   - update `requirements.txt` for `aiconfig-extension-hugging-face` & `python-aiconfig`
   - update `pyproject.toml`
