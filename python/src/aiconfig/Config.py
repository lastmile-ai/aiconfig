import json
import os
from typing import Any, Dict, List, Optional, Tuple

import requests
from aiconfig.callback import CallbackEvent, CallbackManager
from aiconfig.default_parsers.openai import DefaultOpenAIParser
from aiconfig.default_parsers.palm import PaLMChatParser, PaLMTextParser
from aiconfig.model_parser import InferenceOptions, ModelParser
from aiconfig.schema import JSONObject

from .default_parsers.dalle import DalleImageGenerationParser
from .default_parsers.hf import HuggingFaceTextGenerationParser
from .registry import (
    ModelParserRegistry,
    update_model_parser_registry_with_config_runtime,
)
from .schema import AIConfig, Prompt

gpt_models = [
    "gpt-4",
    "GPT-4",
    "gpt-4-0314",
    "gpt-4-0613",
    "gpt-4-32k",
    "gpt-4-32k-0314",
    "gpt-4-32k-0613",
    "gpt-3.5-turbo",
    "gpt-3.5-turbo-16k",
    "gpt-3.5-turbo-0301",
    "gpt-3.5-turbo-0613",
    "gpt-3.5-turbo-16k-0613",
]
for model in gpt_models:
    ModelParserRegistry.register_model_parser(DefaultOpenAIParser(model))
ModelParserRegistry.register_model_parser(PaLMChatParser())
ModelParserRegistry.register_model_parser(PaLMTextParser())
ModelParserRegistry.register_model_parser(HuggingFaceTextGenerationParser())
dalle_image_generation_models = [
    "dall-e-2",
    "dall-e-3",
]
for model in dalle_image_generation_models:
    ModelParserRegistry.register_model_parser(DalleImageGenerationParser(model))


class AIConfigRuntime(AIConfig):
    # A mapping of model names to their respective parsers

    # TODO: Define a default constructor that will construct with default values. This seems a little complicated because of the way pydantic works. Pydantic creates its own constructors.
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.file_path = None
        # AIConfigRuntime will always have a callback manager. Ae default one is be created when initialized.
        self.callback_manager = CallbackManager.create_default_manager()

    @classmethod
    def create(
        cls,
        name: str = "",
        description: str = "",
        schema_version: str = "latest",
        metadata={},
        prompts=[],
    ) -> "AIConfigRuntime":
        """
        Creates a new AIConfigRuntime and returns it.

        Args:
            name (str): The name of the AI configuration.
            description (str): A description of the AI configuration.
            schema_version (str): The schema version to use for the configuration.

        This method creates a new AI configuration with the provided parameters and sets it as the current AI configuration.
        """
        return cls(
            **{
                "name": name,
                "description": description,
                "schema_version": schema_version,
                "metadata": metadata,
                "prompts": prompts,
            }
        )

    @classmethod
    def load(cls, json_config_filepath) -> "AIConfigRuntime":
        """
        Constructs AIConfigRuntime from a JSON file given its file path and returns it.

        Args:
            json_config_filepath (str): The file path to the JSON configuration file.
        """
        # open file
        with open(json_config_filepath) as file:
            # load the file as bytes and let pydantic handle the parsing
            # validated_data =  AIConfig.model_validate_json(file.read())
            aiconfigruntime = cls.model_validate_json(file.read())
            update_model_parser_registry_with_config_runtime(aiconfigruntime)

            # set the file path. This is used when saving the config
            aiconfigruntime.file_path = json_config_filepath
            return aiconfigruntime

    @classmethod
    def load_from_workbook(cls, workbook_id: str) -> "AIConfigRuntime":
        """
        Loads a workbook from https://lastmileai.dev/api/workbooks/aiconfig and constructs an AIConfigRuntime.

        Args:
            workbook_id (str): The ID of the workbook to load.

        Raises:
            Exception: If the request to the API is not successful.
        """
        if workbook_id:
            API_ENDPOINT = "http://lastmileai.dev/api"

            # Make sure to set the API key
            lastmileapi_token = os.environ.get("LASTMILE_API_TOKEN")

            if not lastmileapi_token:
                raise ValueError("LASTMILE_API_TOKEN environment variable is not set.")

            headers = {"Authorization": "Bearer " + lastmileapi_token}
            url = f"{API_ENDPOINT}/workbooks/aiconfig?id={workbook_id}"
            resp = requests.get(url, headers=headers)

            if resp.status_code != 200:
                raise Exception(f"Failed to load workbook. Status code: {resp.status_code}")

            data = resp.json()

            aiconfigruntime = cls.model_validate_json(data)
            update_model_parser_registry_with_config_runtime(aiconfigruntime)
            return aiconfigruntime

    async def serialize(
        self,
        model_name: str,
        data: Dict,
        prompt_name: str,
        params: Optional[dict] = None,
    ) -> List[Prompt]:
        """
        Serializes the completion params into a Prompt object. Inverse of the 'resolve' function.

        args:
            model_name (str): The model name to create a Prompt object for
            data (dict): The data to save as a Prompt Object
            params (dict, optional): Optional parameters to save alongside the prompt

        returns:
            Prompt | List[Prompt]: A prompt or list of prompts representing the input data
        """
        event = CallbackEvent(
            "on_serialize_start",
            __name__,
            {
                model_name: model_name,
                "data": data,
                "prompt_name": prompt_name,
                "params": params,
            },
        )
        await self.callback_manager.run_callbacks(event)

        if not params:
            params = {}

        model_parser = ModelParserRegistry.get_model_parser(model_name)
        if not model_parser:
            raise ValueError(f"Unable to serialize data: `{data}`\n Model Parser for model {model_name} does not exist.")

        prompts = await model_parser.serialize(prompt_name, data, self, params)

        event = CallbackEvent("on_serialize_complete", __name__, {"result": prompts})
        await self.callback_manager.run_callbacks(event)
        return prompts

    async def resolve(
        self,
        prompt_name: str,
        params: Optional[dict] = None,
        **kwargs,
    ):
        """
        Resolves a prompt with the given parameters.

        Args:
            prompt_name (str): The identifier of the prompt to be resolved.
            params (dict, optional): The parameters to use for resolving the prompt.

        Returns:
            str: The resolved prompt.
        """
        event = CallbackEvent("on_resolve_start", __file__, {"prompt_name": prompt_name, "params": params})
        await self.callback_manager.run_callbacks(event)

        if not params:
            params = {}

        if prompt_name not in self.prompt_index:
            raise IndexError(f"Prompt '{prompt_name}' not found in config, available prompts are:\n {list(self.prompt_index.keys())}")

        prompt_data = self.prompt_index[prompt_name]
        model_name = self.get_model_name(prompt_data)
        model_provider = AIConfigRuntime.get_model_parser(model_name)

        response = await model_provider.deserialize(prompt_data, self, params)

        event = CallbackEvent("on_resolve_complete", __name__, {"result": response})
        await self.callback_manager.run_callbacks(event)
        return response

    async def run(
        self,
        prompt_name: str,
        params: Optional[dict] = None,
        options: Optional[InferenceOptions] = None,
        **kwargs,
    ):
        """
        Executes the AI model with the resolved parameters and returns the API response.

        Args:
            parameters (dict): The resolved parameters to use for inference.
            prompt_name (str): The identifier of the prompt to be used.

        Returns:
            object: The response object returned by the AI-model's API.
        """
        event = CallbackEvent(
            "on_run_start",
            __name__,
            {
                "prompt_name": prompt_name,
                "params": params,
                "options": options,
                "kwargs": kwargs,
            },
        )
        await self.callback_manager.run_callbacks(event)

        if not params:
            params = {}

        if prompt_name not in self.prompt_index:
            raise IndexError(f"Prompt '{prompt_name}' not found in config, available prompts are:\n {list(self.prompt_index.keys())}")

        prompt_data = self.prompt_index[prompt_name]
        model_name = self.get_model_name(prompt_data)
        model_provider = AIConfigRuntime.get_model_parser(model_name)

        # Clear previous run outputs if they exist
        self.delete_output(prompt_name)

        response = await model_provider.run(
            prompt_data,
            self,
            options,
            params,
            callback_manager=self.callback_manager,
            **kwargs,
        )

        event = CallbackEvent("on_run_complete", __name__, {"result": response})
        await self.callback_manager.run_callbacks(event)
        return response

    async def run_batch(
        self,
        prompt_name: str,
        parameters_list: list[dict[str, Any]],
        options: Optional[InferenceOptions] = None,
        **kwargs,
    ) -> list[Tuple["ExecuteResult", JSONObject | Any, Dict[str, Any]]]:
        """
        Executes a specified Prompt in batch mode using provided parameters. This method returns a list of tuples.
        Each tuple consists of the inference result, the corresponding resolved completion parameters, and the parameters dict used.
        The resolved completion parameters are derived by calling the resolve() method on the resultant AIConfigRuntimes.


        Args:
            prompt_name (str): Identifier of the Prompt to be used. The identifier must be valid & present in available prompts.
            parameters_list (list[dict]): A list of parameter sets for running the inference multiple times.
                                        Each dictionary represent a set of parameters.
            options (Optional[InferenceOptions]): Optional parameters for tuning the inference execution.
            kwargs (Any): Other optional parameters.

        Raises:
            IndexError: If the identifier for the prompt doesn't exist in the list of available prompts.

        Returns:
            list[Tuple["ExecuteResult", JSONObject | Any, Dict[str, Any]]]: A list of tuples, each tuple consisting of the inference result, the corresponding resolved completion parameters, and the parameters dict used.

        Example:
            >>> aiconfig.run_batch("some_prompt", [{"param1": 1, "param2": 2}, {"param1": 3, "param2": 4}])
        """
        event = CallbackEvent(
            "on_run_batch_start",
            __name__,
            {
                "prompt_name": prompt_name,
                "params_list": parameters_list,
                "kwargs": kwargs,
            },
        )
        await self.callback_manager.run_callbacks(event)

        # Check if the provided prompt name is available in the list of prompts
        if prompt_name not in self.prompt_index:
            raise IndexError(f"Prompt '{prompt_name}' not found in config, available prompts are:\n {list(self.prompt_index.keys())}")

        # Retrieve model and respective provider
        prompt_data = self.prompt_index[prompt_name]
        model_name = self.get_model_name(prompt_data)
        model_provider = AIConfigRuntime.get_model_parser(model_name)

        # Run the batch and store results
        batch_results_aiconfigruntimes = await model_provider.run_batch(
            prompt_data,
            self,
            parameters_list,
            options,
            callback_manager=self.callback_manager,
            **kwargs,
        )

        # Extract the prompt outputs and the resolved completion params from the result
        batch_results_formatted = []
        # TODO: Refactor this implementation or model parser's run_batch() for improved maintainability and clarity.
        # Currently, it returns a list of AIConfigRuntimes, with outputs corresponding to the params in parameters_list. If it gets overriden, order is not guaranteed.
        for i, aiconfig in enumerate(batch_results_aiconfigruntimes):
            parameters_dict_used = parameters_list[i]

            aiconfig_execute_results = aiconfig.get_prompt(prompt_name).outputs
            prompt_data_resolved = await aiconfig.resolve(prompt_name, parameters_dict_used)

            batch_results_formatted.append(tuple([aiconfig_execute_results, prompt_data_resolved, parameters_dict_used]))

        event = CallbackEvent("on_run_batch_complete", __name__, {"result": batch_results_formatted})

        await self.callback_manager.run_callbacks(event)
        return batch_results_formatted

    async def run_and_get_output_text(
        self,
        prompt_name: str,
        params: dict[Any, Any] | None = None,
        options: Optional[InferenceOptions] = None,
        **kwargs,
    ) -> str:
        result: Any = await self.run(prompt_name, params, options=options, **kwargs)
        return self.get_output_text(prompt_name, result[0])

    #
    #     Saves this AIConfig to a file.
    #     @param filePath The path to the file to save to.
    #    @param saveOptions Options that determine how to save the AIConfig to the file.
    #    */

    def save(self, json_config_filepath: str | None = None, include_outputs: bool = True):
        """
        Save the AI Configuration to a JSON file.

        Args:
            json_config_filepath (str, optional): The file path to the JSON configuration file.
                Defaults to "aiconfig.json".
        """
        # AIConfig json should only contain the core data fields. These are auxiliary fields that should not be persisted
        exclude_options = {
            "prompt_index": True,
            "file_path": True,
            "callback_manager": True,
        }

        if not include_outputs:
            exclude_options["prompts"] = {"__all__": {"outputs"}}

        if not json_config_filepath:
            json_config_filepath = self.file_path or "aiconfig.json"

        with open(json_config_filepath, "w") as file:
            # Serialize the AI Configuration to JSON and save it to the file
            json.dump(
                self.model_dump(
                    mode="json",
                    exclude=exclude_options,
                    exclude_none=True,
                ),
                file,
                indent=2,
            )

    def get_output_text(self, prompt: str | Prompt, output: Optional[dict] = None) -> str:
        """
        Get the string representing the output from a prompt (if any)

        Args:
            prompt (str | Prompt): The prompt to get the output text from.
            output (dict, optional): The output to get the output text from.

        Returns:
            str: The output text from the prompt.
        """
        if isinstance(prompt, str):
            prompt = self.get_prompt(prompt)
        model_parser = ModelParserRegistry.get_model_parser_for_prompt(prompt, self)
        return model_parser.get_output_text(prompt, self, output)

    @staticmethod
    def register_model_parser(model_parser: ModelParser, model_name: str):
        """
        Registers a model parser to the registry.

        Args:
            model_parser (ModelParser): The model parser to be registered.
        """
        ModelParserRegistry.register_model_parser(model_parser, [model_name])

    @staticmethod
    def get_model_parser(model_id: str) -> ModelParser:
        """
        Retrieves a model parser from the registry.

        Args:
            model_id (str): The identifier of the model parser to be retrieved.

        Returns:
            ModelParser: The model parser corresponding to the given identifier.
        """
        if model_id not in ModelParserRegistry.parser_ids():
            raise IndexError(f"Model parser '{model_id}' not found in registry, available model parsers are:\n {ModelParserRegistry.parser_ids()}")
        return ModelParserRegistry.get_model_parser(model_id)

    def set_callback_manager(self, callback_manager: CallbackManager):
        if callback_manager is None:
            raise ValueError("callback_manager cannot be None. Create a new CallbackManager with No callbacks instead.")
        self.callback_manager = callback_manager
