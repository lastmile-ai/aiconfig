from abc import abstractmethod
import copy
from typing import Dict, Optional, Union
from typing import TYPE_CHECKING, Any, Dict, Optional
from aiconfig_tools import AIConfigSettings
from aiconfig_tools.AIConfigSettings import (
    AIConfig,
    ExecuteResult,
    InferenceResponse,
    Output,
    Prompt,
    PromptMetadata,
    Stream,
)
from aiconfig_tools.default_parsers.parameterized_model_parser import ParameterizedModelParser
from aiconfig_tools.util.config_utils import get_api_key_from_environment
from aiconfig_tools.util.params import resolve_parameters, resolve_prompt, resolve_system_prompt

import openai

if TYPE_CHECKING:
    from aiconfig_tools.Config import AIConfigRuntime


class OpenAIInference(ParameterizedModelParser):
    def __init__(self):
        super().__init__()

    @abstractmethod
    def id(self) -> str:
        """
        Returns an identifier for the model (e.g. gpt-3.5, gpt-4, etc.).
        """
        return self.id

    def serialize(
        self,
        prompt_name: str,
        data: Any,
        ai_config: "AIConfigRuntime",
        params: Optional[Dict] = {None},
        **kwargs
    ) -> Prompt:
        """
        Defines how a prompt and model inference settings get serialized in the .aiconfig.

        Args:
            prompt_name (str): The name of the prompt.
            data (dict): The prompt data to be serialized.
            ai_config (dict): Model-specific inference settings to be serialized.
            parameters (dict, optional): Additional parameters. Defaults to None.

        Returns:
            Prompt: Serialized representation of the prompt and inference settings.
        """
        # input = data.prompt if isinstance(data.prompt str) else {"data": data.prompt}
        pass

    def serialize(
        self,
        prompt_name: str,
        data: Dict,
        ai_config: "AIConfigRuntime",
        parameters: Optional[Dict],
        **kwargs
    ) -> Prompt:
        """
        Defines how a prompt and model inference settings get serialized in the .aiconfig.

        Args:
            prompt (str): The prompt to be serialized.
            inference_settings (dict): Model-specific inference settings to be serialized.

        Returns:
            str: Serialized representation of the prompt and inference settings.
        """
        # Serialize Prompt input
        prompt_input = (
            data["prompt"] if isinstance(data["prompt"], str) else {"data": data["prompt"]}
        )

        # Cosntruct model settings, does not include prompt
        prompt_model_metadata = {key: value for key, value in data.items() if key != "prompt"}

        # check if config already has model settings in global metadata
        model_name = prompt_model_metadata.get("model", self.id())
        global_model_metadata = ai_config.metadata.models.get(model_name, {})

        if global_model_metadata:
            # Check if the model settings from the input data are the same as the global model settings
            # Compute the difference between the global model settings and the model settings from the input data
            # If there is a difference, then we need to add the different model settings as overrides on the prompt's metadata
            override_keys = set(prompt_model_metadata.keys()) - set(global_model_metadata.keys())

            override_settings = {key: prompt_model_metadata[key] for key in override_keys}

            if override_settings:
                model_metadata = {"name": model_name, "settings": override_settings}
            else:
                model_metadata = model_name
        else:
            model_metadata = {"name": model_name, "settings": prompt_model_metadata}

        return Prompt(
            name=prompt_name,
            input=prompt_input,
            metadata=PromptMetadata(model=PromptMetadata(**model_metadata)),
            parameters=parameters,
            **kwargs
        )

    async def deserialize(
        self, prompt: Prompt, aiconfig: "AIConfigRuntime", options, params: Optional[Dict] = {}
    ) -> Dict:
        """
        Defines how to parse a prompt in the .aiconfig for a particular model
        and constructs the completion params for that model.

        Args:
            serialized_data (str): Serialized data from the .aiconfig.

        Returns:
            dict: Model-specific completion parameters.
        """
        resolved_prompt = resolve_prompt(prompt, params, aiconfig)

        # Build Completion data
        model_settings = aiconfig.get_model_settings(prompt)

        completion_data = refine_chat_completion_params(model_settings)

        completion_data["messages"] = []

        # Handle System Prompt
        if "system_prompt" in model_settings:
            system_prompt = model_settings["system_prompt"]
            resolved_system_prompt = resolve_system_prompt(prompt, system_prompt, params, aiconfig)
            completion_data["messages"].append(
                {"content": resolved_system_prompt, "role": "system"}
            )

        # Handle Streaming
        if options and options.stream:
            completion_data["stream"] = options.stream

        # Default to always use chat context
        if not hasattr(prompt.metadata, "remember_chat_context") or (
            hasattr(prompt.metadata, "remember_chat_context")
            and prompt.metadata.remember_chat_context != False
        ):
            # handle chat history. check previous prompts for the same model. if same model, add prompt and its output to completion data if it has a completed output
            for i, previous_prompt in enumerate(aiconfig.prompts):
                # include prompts upto the current one
                if previous_prompt.name == prompt.name:
                    break

                # check if prompt is of the same model
                if previous_prompt.get_model_name() == self.id():
                    # add prompt and its output to completion data
                    # constructing this prompt will take into account available parameters.
                    resolved_previous_prompt = resolve_parameters({}, previous_prompt, aiconfig)
                    completion_data["messages"].append(
                        {"content": resolved_previous_prompt, "role": "user"}
                    )
                    # check if prompt has an output
                    if len(previous_prompt.outputs) > 0:
                        completion_data["messages"].append(
                            {"content": str(previous_prompt.outputs[-1].data), "role": "assistant"}
                        )

        # pass in the user prompt
        completion_data["messages"].append({"content": resolved_prompt, "role": "user"})
        return completion_data

    async def run_inference(self, prompt: Prompt, aiconfig, options, parameters) -> Output:
        """
        Invoked to run a prompt in the .aiconfig. This method should perform
        the actual model inference based on the provided prompt and inference settings.

        Args:
            prompt (str): The input prompt.
            inference_settings (dict): Model-specific inference settings.

        Returns:
            InferenceResponse: The response from the model.
        """
        if not openai.api_key:
            openai.api_key = get_api_key_from_environment("OPENAI_API_KEY")

        completion_data = await self.deserialize(prompt, aiconfig, options, parameters)
        # if stream enabled in runtime options and config, then stream. Otherwise don't stream.
        stream = (options.stream if options else False) and (
            "stream" in completion_data and completion_data.get("stream") == True
        )

        response = openai.ChatCompletion.create(**completion_data)
        outputs = []

        if not stream:
            response_without_choices = {
                key: copy.deepcopy(value) for key, value in response.items() if key != "choices"
            }
            for i, choice in enumerate(response.get("choices")):
                response_without_choices.update({"finish_reason": choice.get("finish_reason")})
                output = ExecuteResult(
                    **{
                        "output_type": "execute_result",
                        "data": choice["message"],
                        "execution_count": i,
                        "metadata": response_without_choices,
                    }
                )

                outputs.append(output)
        else:
            outputs = {}
            messages = {}
            for chunk in response:
                # streaming only returns one chunk, one choice at a time. The order in which the choices are returned is not guaranteed.
                messages = multi_choice_message_reducer(messages, chunk)

                for i, choice in enumerate(chunk["choices"]):
                    index = choice.get("index")
                    accumulated_message_for_choice = messages.get(index, {})
                    delta = choice.get("delta")
                    options.stream_callback(delta, accumulated_message_for_choice, index)

                    output = ExecuteResult(
                        **{
                            "output_type": "execute_result",
                            "data": copy.deepcopy(accumulated_message_for_choice),
                            "execution_count": index,
                            "metadata": {"finish_reason": choice.get("finish_reason")},
                        }
                    )
                    outputs[index] = output
            outputs = [outputs[i] for i in sorted(list(outputs.keys()))]

        # rewrite or extend list of outputs?
        prompt.outputs = outputs

        return prompt.outputs

    def get_output_text(
        self, prompt: Prompt, aiconfig: "AIConfigRuntime", output: Optional[Output] = None
    ) -> str:
        if not output:
            output = aiconfig.get_latest_output(prompt)

        if not output:
            return ""

        if output.output_type == "execute_result":
            message = output.data
            if message.get("content"):
                return message.get("content")
            elif message.get("function_call"):
                return message.get("function_call")
            else:
                return ""
        else:
            return ""


class DefaultOpenAIParser(OpenAIInference):
    def __init__(self, model_id: str):
        super().__init__()
        self.model_id = model_id

    def id(self) -> str:
        return self.model_id


class GPT4Parser(DefaultOpenAIParser):
    def __init__(self):
        model_id = "gpt-4"
        super().__init__(model_id)


class GPT3TurboParser(DefaultOpenAIParser):
    def __init__(self):
        model_id = "gpt-3.5-turbo"
        super().__init__(model_id)


class ChatGPTParser(DefaultOpenAIParser):
    def __init__(self):
        model_id = "ChatGPT"
        super().__init__(model_id)


def reduce(acc, delta):
    acc = copy.deepcopy(acc)

    for key, value in delta.items():
        if key not in acc:
            # If the key doesn't exist in 'acc', add it with the 'value'
            acc[key] = value
        elif isinstance(acc[key], str) and isinstance(value, str):
            # If both 'acc[key]' and 'value' are strings, concatenate them
            acc[key] += value
        elif isinstance(acc[key], dict) and not isinstance(acc[key], list):
            # If 'acc[key]' is a dictionary (not a list), recursively merge it with 'value'
            acc[key] = reduce(acc[key], value)

    return acc


def multi_choice_message_reducer(
    messages: Union[Dict[int, dict], None], chunk: dict
) -> Dict[int, dict]:
    if messages is None:
        messages = {}

    # elif len(messages) != len(chunk["choices"]):
    #     raise ValueError("Invalid number of previous choices -- it should match the incoming number of choices")

    for choice in chunk["choices"]:
        index = choice["index"]
        previous_message = messages.get(index, {})
        updated_message = reduce(previous_message, choice["delta"])
        messages[index] = updated_message

    return messages


def refine_chat_completion_params(model_settings):
    # completion parameters to be used for openai's chat completion api
    # system prompt handled separately
    # streaming handled seperatly.
    supported_keys = {
        "frequency_penalty",
        "functions",
        "function_call",
        "logit_bias",
        "max_tokens",
        "model",
        "n",
        "presence_penalty",
        "stop",
        "temperature",
        "top_p",
        "user",
    }

    completion_data = {}
    for key in supported_keys:
        if key in model_settings:
            completion_data[key] = model_settings[key]

    return completion_data
