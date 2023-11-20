import copy
from typing import TYPE_CHECKING, Any, Dict, Optional
# Type hint imports
from aiconfig import (
    ExecuteResult,
    Output,
    Prompt,
    PromptMetadata,
)
# ModelParser Utils
from aiconfig import ParameterizedModelParser
from aiconfig import get_api_key_from_environment
from aiconfig import resolve_prompt
from aiconfig import InferenceOptions
# HuggingFace API imports
from huggingface_hub import InferenceClient
from huggingface_hub.inference._text_generation import (
    TextGenerationResponse,
    TextGenerationStreamResponse,
)

# Circuluar Dependency Type Hints
if TYPE_CHECKING:
    from aiconfig.Config import AIConfigRuntime


# Step 1: define Helpers

def refine_chat_completion_params(model_settings):
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
        "stream"
        "temperature",
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
    response: TextGenerationStreamResponse, response_includes_details: bool, options: InferenceOptions
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
        data = iteration
        if response_includes_details:
            iteration: TextGenerationStreamResponse
            data = iteration.token.text
            metadata = {"token": iteration.token, "details": iteration.details}
        else:
            data: str

        # Reduce
        accumulated_message += data

        index = 0  # HF Text Generation api doesn't support multiple outputs
        delta = data
        options.stream_callback(delta, accumulated_message, index)

        output = ExecuteResult(
            **{
                "output_type": "execute_result",
                "data": copy.deepcopy(accumulated_message),
                "execution_count": index,
                "metadata": metadata,
            }
        )

    return output


def construct_regular_output(response, response_includes_details: bool) -> Output:
    metadata = {}
    data = response
    if response_includes_details:
        response: TextGenerationResponse  # Expect response to be of type TextGenerationResponse
        data = response.generated_text
        metadata = {"details": response.details}

    output = ExecuteResult(
        **{
            "output_type": "execute_result",
            "data": data,
            "execution_count": 0,
            "metadata": metadata,
        }
    )
    return output


class HuggingFaceTextParser(ParameterizedModelParser):
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
        return "HuggingFaceTextParser"

    def serialize(
        self,
        prompt_name: str,
        data: Any,
        ai_config: "AIConfigRuntime",
        parameters: Optional[Dict] = None,
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
        data = copy.deepcopy(data)

        # assume data is completion params for HF text generation
        prompt_input = data["prompt"]

        # Prompt is handled, remove from data
        data.pop("prompt", None)

        model_metadata = ai_config.generate_model_metadata(data, self.id())
        prompt = Prompt(
            name=prompt_name,
            input=prompt_input,
            metadata=PromptMetadata(model=model_metadata, parameters=parameters, **kwargs),
        )
        return [prompt]

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
        model_settings = self.get_model_settings(prompt, aiconfig)

        completion_data = refine_chat_completion_params(model_settings)

        completion_data["prompt"] = resolved_prompt

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
        completion_data = await self.deserialize(prompt, aiconfig, options, parameters)

        # if stream enabled in runtime options and config, then stream. Otherwise don't stream.
        stream = (options.stream if options else False) and (
            not "stream" in completion_data or completion_data.get("stream") != False
        )

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
        return prompt.outputs

    def get_output_text(
        self, prompt: Prompt, aiconfig: "AIConfigRuntime", output: Optional[Output] = None
    ) -> str:
        if not output:
            output = aiconfig.get_latest_output(prompt)

        if not output:
            return ""

        if output.output_type == "execute_result":
            if isinstance(output.data, str):
                return output.data
        else:
            return ""