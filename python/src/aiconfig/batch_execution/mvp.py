from typing import Dict
from aiconfig import AIConfigRuntime


run_options = {
    "run_all": True,
    "run last": False
}

params = {
    "1": {
        'descriptor': "bouncy"
    }
}

def input_interface(aiconfig: AIConfigRuntime, params: Dict, n: int, run_options: Dict):
    """
    User expected to pass in the following items:

    1. aiconfig: AIConfigRuntime
        It would make sense to pass in the loaded AIConfigRuntime rather than a file ref to an aiconfig. 
        Reason being that there could be some intermediate setup (callbacks, registering model parsers, etc) that needs to be done before the AIConfig is ready to be used.

    2. params: dict.
        This is a nested dictionary of parameters that the user would like to pass into the AIConfig.
        The user should be able to provide parameters for each run. They also need to specify which params will be used for each run. Similar to json/csv in AI Workflows

        The structure of the dictionary is as follows:
        {
            run_id: {
                param_name: param_value
                param_name2: param_value
            },
            run_id+1: {
                param_name: param_value
                param_name2: param_value
            },
        }

    3. n: int
        The number of runs that the user would like to execute on the same aiconfig.
        Example:
        config: {
            prompt:
                {
                    name: "generate haiku",
                    input: "Write me a haiku?"
                },
                }
        }
        This config could be run 10 times to generate 10 different haikus. Dependent on a high temp and model producing different results.


    Total number of runs = len(params) * n
    """

    async def run_all(aiconfig: AIConfigRuntime, run_params: Dict):
        """
        Run all prompts in an aiconfig
        """
        try:
            for prompt in aiconfig.prompts:
                await aiconfig.run(prompt.name, params= run_params)

    outputs = {}
    # perform an execution for every run
    for nth_execution in range(n):
        # Perform an execution for every set of params
        for run_id, run_params in params.items():
            if run_options["run_all"]:
                # run the aiconfig with the params
                run_all(aiconfig, run_params)

                aiconfig.save(json_config_filepath= f'{nth_execution}_execution_{run_id}_params',include_outputs=True)

                # store outputs (?) what does this look like, does it get connected to eval or can this just dump into a dict/dataframe
                # Couple options for storing outputs, which is probably linked to eval.
                # 1. Store outputs in some dictionary shape
                # 2. Save aiconfig with outputs to file. This can then be fed into some eval interface
