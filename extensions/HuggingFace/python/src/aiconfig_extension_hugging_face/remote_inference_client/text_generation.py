import copy
import json
from typing import TYPE_CHECKING, Any, Iterable, List, Optional, Union

# HuggingFace API imports
from huggingface_hub import InferenceClient
from huggingface_hub.inference._text_generation import (
    TextGenerationResponse,
    TextGenerationStreamResponse,
)

from aiconfig import CallbackEvent
from aiconfig.default_parsers.parameterized_model_parser import ParameterizedModelParser
from aiconfig.model_parser import InferenceOptions
from aiconfig.schema import (
    ExecuteResult,
    Output,
    OutputDataWithValue,
    Prompt,
    PromptMetadata,
)
from aiconfig.util.config_utils import get_api_key_from_environment
from aiconfig.util.params import resolve_prompt


# Circuluar Dependency Type Hints
if TYPE_CHECKING:
    from aiconfig.Config import AIConfigRuntime


# Step 1: define Helpers


def refine_chat_completion_params(model_settings: dict[Any, Any]) -> dict[str, Any]:
    """
    Refines the completion params for the HF text generation api. Removes any unsupported params.
    The supported keys were found by looking at the HF text generation api. `huggingface_hub.InferenceClient.text_generation()`
    """

    supported_keys = {
        "details",
        "stream",
        "model",
        "do_sample",
        "max_new_tokens",
        "best_of",
        "repetition_penalty",
        "return_full_text",
        "seed",
        "stop_sequences",
        "stream" "temperature",
        "top_k",
        "top_p",
        "truncate",
        "typical_p",
        "watermark",
        "decoder_input_details",
    }

    completion_data = {}
    for key in model_settings:
        if key.lower() in supported_keys:
            completion_data[key.lower()] = model_settings[key]

    return completion_data


def construct_stream_output(
    response: Union[Iterable[TextGenerationStreamResponse], Iterable[str]],
    response_includes_details: bool,
    options: InferenceOptions,
) -> Output:
    """
    Constructs the output for a stream response.

    Args:
        response (TextGenerationStreamResponse): The response from the model.
        response_includes_details (bool): Whether or not the response includes details.
        options (InferenceOptions): The inference options. Used to determine the stream callback.

    """
    accumulated_message = ""
    for iteration in response:
        metadata = {}
        # If response_includes_details is false, `iteration` will be a string,
        # otherwise, `iteration` is a TextGenerationStreamResponse
        new_text = iteration
        if response_includes_details:
            iteration: TextGenerationStreamResponse
            new_text = iteration.token.text
            metadata = {"token": iteration.token, "details": iteration.details}

        # Reduce
        accumulated_message += new_text

        index = 0  # HF Text Generation api doesn't support multiple outputs
        if options and options.stream_callback:
            options.stream_callback(new_text, accumulated_message, index)
        output = ExecuteResult(
            **{
                "output_type": "execute_result",
                "data": accumulated_message,
                "execution_count": index,
                "metadata": metadata,
            }
        )

    return output


def construct_regular_output(response: TextGenerationResponse, response_includes_details: bool) -> Output:
    metadata = {"raw_response": response}
    if response_includes_details:
        metadata["details"] = response.details

    output = ExecuteResult(
        **{
            "output_type": "execute_result",
            "data": response.generated_text,
            "execution_count": 0,
            "metadata": metadata,
        }
    )
    return output


class HuggingFaceTextGenerationParser(ParameterizedModelParser):
    """
    A model parser for HuggingFace text generation models.
    """

    def __init__(self, model_id: str = None, use_api_token=False):
        """
        Args:
            model_id (str): The model ID of the model to use.
            no_token (bool): Whether or not to require an API token. Set to False if you don't have an api key.

        Returns:
            HuggingFaceTextParser: The HuggingFaceTextParser object.

        Usage:

        1. Create a new model parser object with the model ID of the model to use.
                parser = HuggingFaceTextParser("mistralai/Mistral-7B-Instruct-v0.1", use_api_token=False)
        2. Add the model parser to the registry.
                config.register_model_parser(parser)

        If use_api_token is set to True, then the model parser will require an API token to be set in the environment variable HUGGING_FACE_API_TOKEN.


        """
        super().__init__()

        token = None

        if use_api_token:
            token = get_api_key_from_environment("HUGGING_FACE_API_TOKEN")

        self.client = InferenceClient(model_id, token=token)

    def id(self) -> str:
        """
        Returns an identifier for the Model Parser
        """
        return "HuggingFaceTextGenerationClient"

    async def serialize(
        self,
        prompt_name: str,
        data: Any,
        ai_config: "AIConfigRuntime",
        parameters: Optional[dict[Any, Any]] = None,
        **kwargs,
    ) -> list[Prompt]:
        """
        Defines how a prompt and model inference settings get serialized in the .aiconfig.

        Args:
            prompt (str): The prompt to be serialized.
            inference_settings (dict): Model-specific inference settings to be serialized.

        Returns:
            str: Serialized representation of the prompt and inference settings.
        """
        await ai_config.callback_manager.run_callbacks(
            CallbackEvent(
                "on_serialize_start",
                __name__,
                {
                    "prompt_name": prompt_name,
                    "data": data,
                    "parameters": parameters,
                    "kwargs": kwargs,
                },
            )
        )

        data = copy.deepcopy(data)

        # assume data is completion params for HF text generation
        prompt_input = data["prompt"]

        # Prompt is handled, remove from data
        data.pop("prompt", None)

        prompts = []

        model_metadata = ai_config.get_model_metadata(data, self.id())
        prompt = Prompt(
            name=prompt_name,
            input=prompt_input,
            metadata=PromptMetadata(model=model_metadata, parameters=parameters, **kwargs),
        )

        prompts.append(prompt)

        await ai_config.callback_manager.run_callbacks(CallbackEvent("on_serialize_complete", __name__, {"result": prompts}))

        return prompts

    async def deserialize(
        self,
        prompt: Prompt,
        aiconfig: "AIConfigRuntime",
        params: Optional[dict[Any, Any]] = {},
    ) -> dict[Any, Any]:
        """
        Defines how to parse a prompt in the .aiconfig for a particular model
        and constructs the completion params for that model.

        Args:
            serialized_data (str): Serialized data from the .aiconfig.

        Returns:
            dict: Model-specific completion parameters.
        """
        await aiconfig.callback_manager.run_callbacks(CallbackEvent("on_deserialize_start", __name__, {"prompt": prompt, "params": params}))

        resolved_prompt = resolve_prompt(prompt, params, aiconfig)

        # Build Completion data
        model_settings = self.get_model_settings(prompt, aiconfig)

        completion_data = refine_chat_completion_params(model_settings)

        completion_data["prompt"] = resolved_prompt

        await aiconfig.callback_manager.run_callbacks(CallbackEvent("on_deserialize_complete", __name__, {"output": completion_data}))

        return completion_data

    async def run_inference(self, prompt: Prompt, aiconfig: "AIConfigRuntime", options: InferenceOptions, parameters: dict[Any, Any]) -> List[Output]:
        """
        Invoked to run a prompt in the .aiconfig. This method should perform
        the actual model inference based on the provided prompt and inference settings.

        Args:
            prompt (str): The input prompt.
            inference_settings (dict): Model-specific inference settings.

        Returns:
            InferenceResponse: The response from the model.
        """
        await aiconfig.callback_manager.run_callbacks(
            CallbackEvent(
                "on_run_start",
                __name__,
                {"prompt": prompt, "options": options, "parameters": parameters},
            )
        )

        completion_data = await self.deserialize(prompt, aiconfig, parameters)

        # if stream enabled in runtime options and config, then stream. Otherwise don't stream.
        stream = True  # Default value
        if options is not None and options.stream is not None:
            stream = options.stream
        elif "stream" in completion_data:
            stream = completion_data["stream"]

        completion_data["stream"] = stream

        response = self.client.text_generation(**completion_data)
        response_is_detailed = completion_data.get("details", False)
        outputs = []

        # HF Text Generation api doesn't support multiple outputs. Expect only one output.
        # Output spec: .data to to the actual string, and metadata to the details and any other info present.
        if not stream:
            output = construct_regular_output(response, response_is_detailed)
            outputs.append(output)
        else:
            # Handles stream callback
            output = construct_stream_output(response, response_is_detailed, options)
            outputs.append(output)

        prompt.outputs = outputs

        await aiconfig.callback_manager.run_callbacks(CallbackEvent("on_run_complete", __name__, {"result": outputs}))

        return outputs

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
                # HuggingFace Text generation does not support function
                # calls so shouldn't get here, but just being safe
                return json.dumps(output_data.value, indent=2)
        return ""
