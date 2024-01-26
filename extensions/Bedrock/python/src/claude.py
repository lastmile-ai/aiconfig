from typing import TYPE_CHECKING, Any, Callable, Dict, List, Optional, Union

from aiconfig.callback import CallbackEvent
from aiconfig.default_parsers.parameterized_model_parser import \
    ParameterizedModelParser
from aiconfig.model_parser import InferenceOptions
from aiconfig.schema import ExecuteResult, Output, Prompt
from aiconfig.util.config_utils import get_api_key_from_environment
from aiconfig.util.params import resolve_prompt

from anthropic_bedrock import AI_PROMPT, HUMAN_PROMPT, AnthropicBedrock, Stream
from anthropic_bedrock.types import Completion

if TYPE_CHECKING:
    from aiconfig.Config import AIConfigRuntime


class Claude(ParameterizedModelParser):
    def __init__(self):
        super().__init__()
        # Will be set in the run method. This is to avoid having to set the api key in the constructor
        self.client = None

    def id() -> str:
        return "ClaudeModelParser"

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

        raise NotImplementedError()

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
        await aiconfig.callback_manager.run_callbacks(
            CallbackEvent(
                "on_deserialize_start",
                __name__,
                {"prompt": prompt, "params": params},
            )
        )
        # Build Completion params
        model_settings = self.get_model_settings(prompt, aiconfig)

        completion_data = refine_chat_completion_params(
            model_settings, aiconfig, prompt
        )

        resolved_prompt = resolve_prompt(prompt, params, aiconfig)

        # Claude is trained using RLHF, need to add the human prompt to the beginning of the prompt
        # See https://docs.anthropic.com/claude/docs/introduction-to-prompt-design#human--assistant-formatting
        completion_data[
            "prompt"
        ] = f"{HUMAN_PROMPT} {resolved_prompt}{AI_PROMPT}"

        await aiconfig.callback_manager.run_callbacks(
            CallbackEvent(
                "on_deserialize_complete",
                __name__,
                {"output": completion_data},
            )
        )

        return completion_data

    async def run(
        self,
        prompt: Prompt,
        aiconfig: "AIConfigRuntime",
        options: Optional[InferenceOptions] = None,
        parameters: Dict[Any, Any] = {},
    ) -> List[Output]:
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

        if self.client is None:
            openai_api_key = get_api_key_from_environment(
                "OPENAI_API_KEY"
            ).unwrap()
            self.client = AnthropicBedrock()

        completion_data = await self.deserialize(prompt, aiconfig, parameters)

        # if stream enabled in runtime options and config, then stream. Otherwise don't stream.
        # const stream = options?.stream ?? completionParams.stream ?? true;
        stream = True  # Default value

        if options is not None and options.stream is not None:
            stream = options.stream
        elif "stream" in completion_data:
            stream = completion_data["stream"]

        completion_data["stream"] = stream

        response = self.client.completions.create(**completion_data)  # type: ignore

        output = None
        if stream:
            output = construct_stream_output(response, options)  # type: ignore
        else:
            output = construct_output(response)  # type: ignore

        # rewrite or extend list of outputs?
        prompt.outputs = [output]

        await aiconfig.callback_manager.run_callbacks(
            CallbackEvent(
                "on_run_complete", __name__, {"result": prompt.outputs}
            )
        )
        return prompt.outputs


def refine_chat_completion_params(
    model_settings: Dict[Any, Any], aiconfig: "AIConfigRuntime", prompt: Prompt
) -> Dict[Any, Any]:
    # completion parameters to be used for Claude's chat completion api
    # prompt handled separately
    # streaming handled separately.
    supported_keys = {
        "max_tokens_to_sample",
        "metadata",
        "model",
        "stop_sequences",
        "temperature",
        "top_k",
        "top_p",
    }

    completion_data: Dict[str, Any] = {}
    for key in supported_keys:
        if key in model_settings:
            completion_data[key] = model_settings[key]

    # Explicitly set the model to use if not already specified
    if completion_data.get("model") is None:
        model_name = aiconfig.get_model_name(prompt)
        completion_data["model"] = model_name

    return completion_data


def construct_output(response: Completion) -> Output:
    """
    Constructs the output for a non-streaming Text Completion response.
    """
    return ExecuteResult(
        output_type="execute_result",
        data=response.completion,
        execution_count=0,
        metadata=response.model_dump(),
    )


def construct_stream_output(
    response: Stream[Completion], options: Union[InferenceOptions, None]
) -> Output:
    """
    Constructs the output for a stream response.

    Args:
        response: Stream of completions
        options (InferenceOptions): The inference options. Used to determine the stream callback.
    """
    accumulated_message = ""
    output = None
    index = 0  # Claude Bedrock api doesn't support multiple outputs
    metadata = (
        {}
    )  # TODO: extract the completion stop reason from the response and add it to the metadata

    for iteration in response:
        new_text = iteration.completion

        # Reduce
        accumulated_message += new_text

        if options is not None and isinstance(
            options.stream_callback, Callable
        ):
            options.stream_callback(new_text, accumulated_message, index)

    output = ExecuteResult(
        output_type="execute_result",
        data=accumulated_message,
        execution_count=index,
        metadata=metadata,
    )

    return output
