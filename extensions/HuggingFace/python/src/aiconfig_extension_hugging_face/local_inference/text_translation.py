import copy
import json
import threading
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from transformers import (
    AutoTokenizer,
    Pipeline,
    pipeline,
    TextIteratorStreamer,
)

from aiconfig.default_parsers.parameterized_model_parser import ParameterizedModelParser
from aiconfig.model_parser import InferenceOptions
from aiconfig.schema import (
    ExecuteResult,
    Output,
    OutputDataWithValue,
    Prompt,
    PromptMetadata,
)
from aiconfig.util.params import resolve_prompt

# Circuluar Dependency Type Hints
if TYPE_CHECKING:
    from aiconfig.Config import AIConfigRuntime


# Step 1: define Helpers
def refine_chat_completion_params(model_settings: Dict[str, Any]) -> Dict[str, Any]:
    """
    Refines the completion params for the HF text translation api. Removes any unsupported params.
    The supported keys were found by looking at the HF text translation api. `huggingface_hub.InferenceClient.text_translation()`
    """

    supported_keys = {
        "max_length",
        "max_new_tokens",
        "min_length",
        "min_new_tokens",
        "early_stopping",
        "max_time",
        "do_sample",
        "num_beams",
        "num_beam_groups",
        "penalty_alpha",
        "use_cache",
        "temperature",
        "top_k",
        "top_p",
        "typical_p",
        "epsilon_cutoff",
        "eta_cutoff",
        "diversity_penalty",
        "repetition_penalty",
        "encoder_repetition_penalty",
        "length_penalty",
        "no_repeat_ngram_size",
        "bad_words_ids",
        "force_words_ids",
        "renormalize_logits",
        "constraints",
        "forced_bos_token_id",
        "forced_eos_token_id",
        "remove_invalid_values",
        "exponential_decay_length_penalty",
        "suppress_tokens",
        "begin_suppress_tokens",
        "forced_decoder_ids",
        "sequence_bias",
        "guidance_scale",
        "low_memory",
        "num_return_sequences",
        "output_attentions",
        "output_hidden_states",
        "output_scores",
        "return_dict_in_generate",
        "pad_token_id",
        "bos_token_id",
        "eos_token_id",
        "encoder_no_repeat_ngram_size",
        "decoder_start_token_id",
        "num_assistant_tokens",
        "num_assistant_tokens_schedule",
    }

    completion_data = {}
    for key in model_settings:
        if key.lower() in supported_keys:
            completion_data[key.lower()] = model_settings[key]

    return completion_data


def construct_regular_output(result: Dict[str, str], execution_count: int) -> Output:
    """
    Construct regular output per response result, without streaming enabled
    """
    print("result", result)
    output = ExecuteResult(
        **{
            "output_type": "execute_result",
            "data": result["translation_text"],
            "execution_count": execution_count,
            "metadata": {},
        }
    )
    return output


def construct_stream_output(
    streamer: TextIteratorStreamer,
    options: InferenceOptions,
) -> Output:
    """
    Constructs the output for a stream response.

    Args:
        streamer (TextIteratorStreamer): Streams the output. See:
            https://huggingface.co/docs/transformers/v4.35.2/en/internal/translation_utils#transformers.TextIteratorStreamer
        options (InferenceOptions): The inference options. Used to determine
            the stream callback.

    """
    output = ExecuteResult(
        **{
            "output_type": "execute_result",
            "data": "",  # We update this below
            "execution_count": 0,  # Multiple outputs are not supported for streaming
            "metadata": {},
        }
    )
    accumulated_message = ""
    for new_text in streamer:
        if isinstance(new_text, str):
            accumulated_message += new_text
            options.stream_callback(new_text, accumulated_message, 0)
            output.data = accumulated_message
    return output


class HuggingFaceTextTranslationTransformer(ParameterizedModelParser):
    """
    A model parser for HuggingFace models of type text translation task using transformers.
    """

    def __init__(self):
        """
        Returns:
            HuggingFaceTextTranslationTransformer

        Usage:
        1. Create a new model parser object with the model ID of the model to use.
                parser = HuggingFaceTextTranslationTransformer()
        2. Add the model parser to the registry.
                config.register_model_parser(parser)
        """
        super().__init__()
        self.translators: dict[str, Pipeline] = {}

    def id(self) -> str:
        """
        Returns an identifier for the Model Parser
        """
        return "HuggingFaceTextTranslationTransformer"

    async def serialize(
        self,
        prompt_name: str,
        data: Any,
        ai_config: "AIConfigRuntime",
        parameters: Optional[Dict[str, Any]] = None,
        **kwargs,
    ) -> List[Prompt]:
        """
        Defines how a prompt and model inference settings get serialized in the .aiconfig.

        Args:
            prompt_name (str): The prompt to be serialized.
            inference_settings (dict): Model-specific inference settings to be serialized.

        Returns:
            List[Prompt]: Serialized representation of the prompt and inference settings.
        """
        data = copy.deepcopy(data)

        # assume data is completion params for HF text translation
        prompt_input = data["prompt"]

        # Prompt is handled, remove from data
        data.pop("prompt", None)

        model_metadata = ai_config.get_model_metadata(data, self.id())
        prompt = Prompt(
            name=prompt_name,
            input=prompt_input,
            metadata=PromptMetadata(model=model_metadata, parameters=parameters, **kwargs),
        )
        return [prompt]

    async def deserialize(
        self,
        prompt: Prompt,
        aiconfig: "AIConfigRuntime",
        _options,
        params: Optional[Dict[str, Any]] = {},
    ) -> Dict[str, Any]:
        """
        Defines how to parse a prompt in the .aiconfig for a particular model
        and constructs the completion params for that model.

        Args:
            serialized_data (str): Serialized data from the .aiconfig.

        Returns:
            dict: Model-specific completion parameters.
        """
        # Build Completion data
        model_settings = self.get_model_settings(prompt, aiconfig)
        completion_data = refine_chat_completion_params(model_settings)

        # Add resolved prompt
        resolved_prompt = resolve_prompt(prompt, params, aiconfig)
        completion_data["prompt"] = resolved_prompt
        return completion_data

    async def run_inference(self, prompt: Prompt, aiconfig: "AIConfigRuntime", options: InferenceOptions, parameters: Dict[str, Any]) -> List[Output]:
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
        inputs = completion_data.pop("prompt", None)

        model_name: str = aiconfig.get_model_name(prompt)
        if isinstance(model_name, str) and model_name not in self.translators:
            self.translators[model_name] = pipeline(model_name)
        translator = self.translators[model_name]

        # if stream enabled in runtime options and config, then stream. Otherwise don't stream.
        streamer = None
        should_stream = (options.stream if options else False) and (not "stream" in completion_data or completion_data.get("stream") != False)
        if should_stream:
            raise NotImplementedError("Streaming is not supported for HuggingFace Text Translation")

        outputs: List[Output] = []
        output = None
        if not should_stream:
            response: List[Any] = translator(inputs, **completion_data)
            for count, result in enumerate(response):
                output = construct_regular_output(result, count)
                outputs.append(output)
        else:
            if completion_data.get("num_return_sequences", 1) > 1:
                raise ValueError("Sorry, TextIteratorStreamer does not support multiple return sequences, please set `num_return_sequences` to 1")
            if not streamer:
                raise ValueError("Stream option is selected but streamer is not initialized")

            # For streaming, cannot call `translator` directly otherwise response will be blocking
            thread = threading.Thread(target=translator, kwargs=completion_data)
            thread.start()
            output = construct_stream_output(streamer, options)
            if output is not None:
                outputs.append(output)

        prompt.outputs = outputs
        return prompt.outputs

    def get_output_text(
        self,
        prompt: Prompt,
        aiconfig: "AIConfigRuntime",
        output: Optional[Output] = None,
    ) -> str:
        if output is None:
            output = aiconfig.get_latest_output(prompt)

        if output is None:
            return ""

        # TODO (rossdanlm): Handle multiple outputs in list
        # https://github.com/lastmile-ai/aiconfig/issues/467
        if output.output_type == "execute_result":
            output_data = output.data
            if isinstance(output_data, str):
                return output_data
            if isinstance(output_data, OutputDataWithValue):
                if isinstance(output_data.value, str):
                    return output_data.value
                # HuggingFace Text translation does not support function
                # calls so shouldn't get here, but just being safe
                return json.dumps(output_data.value, indent=2)
        return ""
