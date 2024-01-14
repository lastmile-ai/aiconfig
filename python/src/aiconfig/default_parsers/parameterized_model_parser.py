# TODO: plaese improve the file name on this file. This is an abstract class that handles parameterization for a model parser.


import typing
from abc import abstractmethod
from typing import Dict, List, Optional

from aiconfig.model_parser import InferenceOptions, ModelParser
from aiconfig.util.params import get_dependency_graph, resolve_prompt_string

from aiconfig.schema import AIConfig, JSONObject, Output, Prompt, PromptInput

if typing.TYPE_CHECKING:
    from aiconfig import AIConfigRuntime


class ParameterizedModelParser(ModelParser):
    @abstractmethod
    async def deserialize(
        self,
        prompt: Prompt,
        aiconfig: AIConfig,
        params: Optional[Dict] = {},
    ) -> Dict:
        """
        Deserialize and parse a serialized prompt from the .aiconfig file for a specific model,
        and construct the completion parameters required for that model's inference.

        Args:
            prompt (Prompt): Serialized data representing the prompt.
            aiconfig (AIConfig): The AIConfig object containing all prompts and parameters.
            params (dict): A dictionary of parameters to substitute into the prompt.

        Returns:
            dict: Model-specific completion parameters.
        """

    @abstractmethod
    async def run_inference(self) -> List[Output]:
        pass

    async def run(
        self,
        prompt: Prompt,
        aiconfig: AIConfig,
        options: Optional[InferenceOptions] = None,
        parameters: Dict = {},
        run_with_dependencies: Optional[bool] = False,
    ) -> List[Output]:
        if run_with_dependencies:
            return await self.run_with_dependencies(prompt, aiconfig, options, parameters)
        else:
            return await self.run_inference(prompt, aiconfig, options, parameters)

    async def run_with_dependencies(self, prompt: Prompt, aiconfig: AIConfig, options=None, parameters: Dict = {}) -> List[Output]:
        """
        Executes the AI model with the resolved dependencies and prompt references and returns the API response.

        Args:
            prompt: The prompt to be used.
            aiconfig: The AIConfig object containing all prompts and parameters.
            parameters (dict): The resolved parameters to use for inference.

        Returns:
            ExecuteResult: An Object containing the response from the AI model.
        """
        dependency_graph = get_dependency_graph(prompt, aiconfig.prompts, aiconfig.prompt_index)

        # Create a set to keep track of visited prompts
        visited_prompts = set()

        async def execute_recursive(prompt_name):
            """
            Execute the AI model for a given prompt and its dependencies recursively.

            Args:
                prompt_name (str): The name of the prompt to execute.

            Returns:
                Any: The output of the original prompt being executed.
            """

            if prompt_name in visited_prompts:
                return  # Skip already visited prompts
            visited_prompts.add(prompt_name)

            # Iterate through dependencies of the current prompt
            for dependency_prompt_name in dependency_graph[prompt_name]:
                await execute_recursive(dependency_prompt_name)

            outputs = await aiconfig.run(prompt_name, parameters, options)

            # Return the output of the original prompt being executed
            if prompt_name == prompt.name:
                return outputs

        return await execute_recursive(prompt.name)

    def resolve_prompt_template(
        prompt_template: str,
        prompt: Prompt,
        ai_config: "AIConfigRuntime",
        params: Optional[JSONObject] = {},
    ):
        """
        Resolves a templated string with the provided parameters (applied from the AIConfig as well as passed in params).

        Args:
            prompt_template (str): The template string to resolve.
            prompt (Prompt): The prompt object that the template string belongs to (if any).
            ai_config (AIConfigRuntime): The AIConfig that the template string belongs to (if any).
            params (dict): Optional parameters resolve the template string with.

        Returns:
            str: The resolved string.
        """
        return resolve_prompt_string(prompt, params, ai_config, prompt_template)

    def get_prompt_template(self, prompt: Prompt, aiConfig: "AIConfigRuntime") -> str:
        """
        An overrideable method that returns a template for a prompt.
        """
        if isinstance(prompt.input, str):
            return prompt.input
        elif isinstance(prompt.input, PromptInput) and isinstance(prompt.input.data, str):
            return prompt.input.data
        else:
            raise Exception(f"Cannot get prompt template string from prompt input: {prompt.input}")
