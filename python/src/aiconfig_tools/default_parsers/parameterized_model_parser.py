# TODO: plaese improve the file name on this file. This is an abstract class that handles parameterization for a model parser.


from abc import abstractmethod
from typing import Dict, Optional
from aiconfig_tools.AIConfigSettings import AIConfig, InferenceResponse, Prompt

from aiconfig_tools.model_parser import InferenceOptions, ModelParser
from aiconfig_tools.util.params import resolve_parameters, resolve_parametrized_prompt
from aiconfig_tools.util.params import get_dependency_graph, resolve_parametrized_prompt
from aiconfig_tools.registry import ModelParserRegistry


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
        pass

    @abstractmethod
    async def run_inference(self):
        pass

    async def run(
        self,
        prompt: Prompt,
        aiconfig: AIConfig,
        options: Optional[InferenceOptions] = None,
        parameters: Dict = {},
        **kwargs
    ) -> InferenceResponse:
        # maybe use prompt metadata instead of kwargs?
        if kwargs.get("run_with_dependencies", False):
            return await self.run_with_dependencies(prompt, aiconfig, options, parameters)
        else:
            return await self.run_inference(prompt, aiconfig, options, parameters)

    async def run_with_dependencies(
        self, prompt: Prompt, aiconfig: AIConfig, options=None, parameters: Dict = {}
    ) -> InferenceResponse:
        """
        Executes the AI model with the resolved dependencies and prompt references and returns the API response.

        Args:
            prompt: The prompt to be used.
            aiconfig: The AIConfig object containing all prompts and parameters.
            parameters (dict): The resolved parameters to use for inference.

        Returns:
            InferenceResponse: An Object containing the response from the AI model.
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

            # Get prompt data and model parser
            prompt_data = aiconfig.prompt_index[prompt_name]
            model_parser = ModelParserRegistry.get_model_parser(prompt_data.metadata.model.name)

            # Execute the model parser with parameters and the current prompt name
            prompt_to_execute = aiconfig.get_prompt(prompt_name)
            output = await aiconfig.run(prompt_name, parameters, options)

            # Return the output of the original prompt being executed
            if prompt_name == prompt.name:
                return output

        return await execute_recursive(prompt.name)
