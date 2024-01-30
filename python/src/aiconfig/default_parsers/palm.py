import json
from typing import TYPE_CHECKING, Dict, List, Optional

import google.generativeai as palm
from aiconfig.callback import CallbackEvent
from aiconfig.default_parsers.parameterized_model_parser import (
    ParameterizedModelParser,
)
from aiconfig.model_parser import InferenceOptions
from aiconfig.util.params import resolve_parameters, resolve_prompt
from google.generativeai.text import Completion
from google.generativeai.types.discuss_types import MessageDict

from aiconfig.schema import (
    ExecuteResult,
    Output,
    OutputDataWithValue,
    Prompt,
    PromptMetadata,
)

if TYPE_CHECKING:
    from aiconfig.Config import AIConfigRuntime


class PaLMTextParser(ParameterizedModelParser):
    def __init__(self):
        super().__init__()

    def id(self) -> str:
        """
        Returns an identifier for the model (e.g. llama-2, gpt-4, etc.).
        """
        return "models/text-bison-001"

    async def serialize(
        self,
        prompt_name: str,
        data: Dict,
        ai_config: "AIConfigRuntime",
        parameters: Optional[Dict],
        **kwargs,
    ) -> List[Prompt]:
        """
        Defines how a prompt and model inference settings get serialized in the .aiconfig.

        Args:
            prompt (str): The prompt to be serialized.
            inference_settings (dict): Model-specific inference settings to be serialized.

        Returns:
            str: Serialized representation of the prompt and inference settings.
        """
        event = CallbackEvent(
            "on_serialize_start",
            __name__,
            {
                "prompt_name": prompt_name,
                "data": data,
                "parameters": parameters,
                "kwargs": kwargs,
            },
        )

        prompt_template = data.get("prompt", "")

        model_metadata = ai_config.get_model_metadata(data, self.id())

        prompts = [
            Prompt(
                name=prompt_name,
                input=prompt_template,
                metadata=PromptMetadata(
                    model=model_metadata,
                    parameters=parameters,
                    **kwargs,
                ),
            )
        ]

        event = CallbackEvent(
            "on_serialize_complete", __name__, {"result": prompts}
        )
        await ai_config.callback_manager.run_callbacks(event)

        return prompts

    async def deserialize(
        self,
        prompt: Prompt,
        aiconfig: "AIConfigRuntime",
        params: Optional[Dict] = {},
    ) -> Dict:
        """
        Defines how to parse a prompt in the .aiconfig for a particular model
        and constructs the completion params for that model.

        Args:
            serialized_data (str): Serialized data from the .aiconfig.

        Returns:
            dict: Model-specific completion parameters.
        """
        await aiconfig.callback_manager.run_callbacks(
            CallbackEvent(
                "on_deserialize_start",
                __name__,
                {"prompt": prompt, "params": params},
            )
        )
        # Build Completion data
        model_settings = self.get_model_settings(prompt, aiconfig)

        completion_data = refine_chat_completion_params(
            model_settings, aiconfig, prompt
        )

        prompt_str = resolve_prompt(prompt, params, aiconfig)

        # pass in the user prompt
        completion_data["prompt"] = prompt_str

        await aiconfig.callback_manager.run_callbacks(
            CallbackEvent(
                "on_deserialize_complete",
                __name__,
                {"output": completion_data},
            )
        )
        return completion_data

    async def run_inference(
        self,
        prompt: Prompt,
        aiconfig: "AIConfigRuntime",
        options: InferenceOptions,
        parameters,
    ) -> List[Output]:
        """
        Invoked to run a prompt in the .aiconfig. This method should perform
        the actual model inference based on the provided prompt and inference settings.

        Output is deconstructed into two parts:
            data: the output text
            metadata: Candidate data from the model

        Args:
            prompt (str): The input prompt.
            inference_settings (dict): Model-specific inference settings.

        Returns:
            ExecuteResult: The response from the model.
        """
        await aiconfig.callback_manager.run_callbacks(
            CallbackEvent(
                "on_run_start",
                __name__,
                {
                    "prompt": prompt,
                    "options": options,
                    "parameters": parameters,
                },
            )
        )

        # TODO: check api key here
        completion_data = await self.deserialize(prompt, aiconfig, parameters)
        # Return Type is of type Completion from Google Library
        completion: Completion = palm.generate_text(**completion_data)

        outputs = []
        # completion.candidates has all outputs. Candidates is an attribute of completion. Candidates is a dict. Taken from Google API impl
        for i, candidate in enumerate(completion.candidates):
            # candidate is a TextCompletion obj (https://shorturl.at/emuG2),
            # but Pydantic TypedDict breaks for Python v<3.12  so using
            # generic Dict type
            candidate: Dict
            output = ExecuteResult(
                output_type="execute_result",
                execution_count=i,
                data=candidate.get("output", ""),
                metadata={"raw_response": candidate},
            )
            outputs.append(output)

        prompt.outputs = outputs
        await aiconfig.callback_manager.run_callbacks(
            CallbackEvent(
                "on_run_complete", __name__, {"result": prompt.outputs}
            )
        )
        return outputs

    def get_output_text(
        self,
        prompt: Prompt,
        aiconfig: "AIConfigRuntime",
        output: Optional[Output] = None,
    ) -> str:
        if output is not None:
            return output.data
        else:
            # Get Last Output
            output = aiconfig.get_latest_output(prompt)
            return output.data


class PaLMChatParser(ParameterizedModelParser):
    def __init__(self):
        super().__init__()

    def id(self) -> str:
        """
        Returns an identifier for the model (e.g. llama-2, gpt-4, etc.).
        """
        return "models/chat-bison-001"

    async def serialize(
        self,
        prompt_name: str,
        data: Dict,
        ai_config: "AIConfigRuntime",
        parameters: Optional[Dict],
        **kwargs,
    ) -> List[Prompt]:
        """
        Defines how a prompt and model inference settings get serialized in the .aiconfig.

        Args:
            prompt (str): The prompt to be serialized.
            inference_settings (dict): Model-specific inference settings to be serialized.

        Returns:
            str: Serialized representation of the prompt and inference settings.
        """

        event = CallbackEvent(
            "on_serialize_start",
            __name__,
            {
                "prompt_name": prompt_name,
                "data": data,
                "parameters": parameters,
                "kwargs": kwargs,
            },
        )
        await ai_config.callback_manager.run_callbacks(event)

        prompt_template = data.get("prompt", "")
        data.pop("prompt", None)

        model_metadata = ai_config.get_model_metadata(data, self.id())
        prompts = [
            Prompt(
                name=prompt_name,
                input=prompt_template,
                metadata=PromptMetadata(
                    model=model_metadata,
                    parameters=parameters,
                    **kwargs,
                ),
            )
        ]

        event = CallbackEvent(
            "on_serialize_complete", __name__, {"result": prompts}
        )
        await ai_config.callback_manager.run_callbacks(event)
        return prompts

    async def deserialize(
        self,
        prompt: Prompt,
        aiconfig: "AIConfigRuntime",
        params: Optional[Dict] = {},
    ) -> Dict:
        """
        Defines how to parse a prompt in the .aiconfig for a particular model
        and constructs the completion params for that model.

        Args:
            serialized_data (str): Serialized data from the .aiconfig.

        Returns:
            dict: Model-specific completion parameters.
        """
        await aiconfig.callback_manager.run_callbacks(
            CallbackEvent(
                "on_deserialize_start",
                __name__,
                {"prompt": prompt, "params": params},
            )
        )
        resolved_prompt = resolve_prompt(prompt, params, aiconfig)

        # Build Completion data
        model_settings = self.get_model_settings(prompt, aiconfig)

        completion_data = refine_chat_completion_params(
            model_settings, aiconfig, prompt
        )

        # TODO: handle if user specifies previous messages in settings
        completion_data["messages"] = []

        # Default to always use chat contextjkl;
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
                if aiconfig.get_model_name(previous_prompt) == self.id():
                    # add prompt and its output to completion data
                    # constructing this prompt will take into account available parameters.

                    # check if prompt has an output. PaLM Api requires this
                    if len(previous_prompt.outputs) > 0:
                        resolved_previous_prompt = resolve_parameters(
                            {}, previous_prompt, aiconfig
                        )
                        completion_data["messages"].append(
                            {
                                "content": resolved_previous_prompt,
                                "author": "0",
                            }
                        )

                        completion_data["messages"].append(
                            {
                                "content": aiconfig.get_output_text(
                                    previous_prompt,
                                    aiconfig.get_latest_output(
                                        previous_prompt
                                    ),
                                ),
                                "author": "1",
                            }
                        )

        # pass in the user prompt
        completion_data["messages"].append(
            {"content": resolved_prompt, "author": "0"}
        )
        await aiconfig.callback_manager.run_callbacks(
            CallbackEvent(
                "on_deserialize_complete",
                __name__,
                {"output": completion_data},
            )
        )
        return completion_data

    async def run_inference(
        self,
        prompt: Prompt,
        aiconfig: "AIConfigRuntime",
        options: InferenceOptions,
        parameters,
    ) -> List[Output]:
        """
        Invoked to run a prompt in the .aiconfig. This method should perform
        the actual model inference based on the provided prompt and inference settings.

        Args:
            prompt (str): The input prompt.
            inference_settings (dict): Model-specific inference settings.

        Returns:
            ExecuteResult: The response from the model.
        """
        await aiconfig.callback_manager.run_callbacks(
            CallbackEvent(
                "on_run_start",
                __name__,
                {
                    "prompt": prompt,
                    "options": options,
                    "parameters": parameters,
                },
            )
        )

        # TODO: check and handle api key here
        completion_data = await self.deserialize(prompt, aiconfig, parameters)
        response = palm.chat(**completion_data)
        outputs = []
        for i, candidate in enumerate(response.candidates):
            # candidate is a MessageDict obj (https://shorturl.at/jKY35),
            # but Pydantic TypedDict breaks for Python v<3.12  so using
            # generic Dict type
            candidate: Dict
            output = ExecuteResult(
                **{
                    "output_type": "execute_result",
                    "data": candidate.get("content", ""),
                    "execution_count": i,
                    "metadata": {"raw_response": response},
                }
            )
            outputs.append(output)

        prompt.outputs = outputs
        await aiconfig.callback_manager.run_callbacks(
            CallbackEvent(
                "on_run_complete", __name__, {"result": prompt.outputs}
            )
        )
        return prompt.outputs

    def get_output_text(
        self,
        prompt: Prompt,
        aiconfig: "AIConfigRuntime",
        output: Optional[Output] = None,
    ) -> str:
        if not output:
            output = aiconfig.get_latest_output(prompt)

        if not output:
            return ""

        if output.output_type == "execute_result":
            output_data = output.data
            if isinstance(output_data, str):
                return output_data
            if isinstance(output_data, OutputDataWithValue):
                if isinstance(output_data.value, str):
                    return output_data.value
                # PaLM does not support function calls so shouldn't get here,
                # but just being safe
                return json.dumps(output_data.value, indent=2)

            # Doing this to be backwards-compatible with old output format
            # where we used to save the MessageDict in output.data
            if isinstance(output_data, MessageDict):
                if output_data.get("content"):
                    return output_data("content")
        return ""


def refine_chat_completion_params(model_settings, aiconfig, prompt):
    # completion parameters to be used for Palm's chat completion api
    # messages handled seperately
    supported_keys = {
        "candidate_count",
        "examples",
        "model",
        "temperature",
        "top_k",
        "top_p",
        "context",
    }

    completion_data = {}
    for key in model_settings:
        if key.lower() in supported_keys:
            completion_data[key.lower()] = model_settings[key]

    # Explicitly set the model to use if not already specified
    if completion_data.get("model") is None:
        model_name = aiconfig.get_model_name(prompt)
        completion_data["model"] = model_name

    return completion_data


def refine_completion_params(model_settings):
    # completion parameters to be used for Palm's text-generation completion api
    # messages handled seperately
    supported_keys = {
        "candidate_count",
        "examples",
        "model",
        "temperature",
        "top_k",
        "top_p",
        "context",
    }

    # python and node have different apis. Standardizing across both sdks, so we can use the same .aiconfig for both sdks
    # Left is node, right is python.
    key_converter_map = {
        "topK": "top_k",
        "topP": "top_p",
    }

    for key in model_settings:
        if key in key_converter_map:
            model_settings[key_converter_map[key]] = model_settings[key]
            del model_settings[key]

    completion_data = {}
    for key in model_settings:
        if key.lower() in supported_keys:
            completion_data[key.lower()] = model_settings[key]

    return completion_data
