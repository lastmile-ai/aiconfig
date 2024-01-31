import copy
import json
from typing import TYPE_CHECKING, Any, Callable, Dict, List, Optional, Union

from aiconfig.callback import CallbackEvent
from aiconfig.default_parsers.parameterized_model_parser import (
    ParameterizedModelParser,
)
from aiconfig.model_parser import InferenceOptions
from aiconfig.schema import ExecuteResult, Output, Prompt, PromptMetadata
from aiconfig.util.params import resolve_prompt
from anthropic_bedrock import AI_PROMPT, HUMAN_PROMPT, AnthropicBedrock, Stream
from anthropic_bedrock.types import Completion

if TYPE_CHECKING:
    from aiconfig.Config import AIConfigRuntime


class ClaudeBedrockModelParser(ParameterizedModelParser):
    """
    A ModelParser for the Claude API on AWS Bedrock.

    Claude on bedrock does not support messages aka turn style completion. It only supports Text completion.
    see https://docs.anthropic.com/claude/reference/claude-on-amazon-bedrock#list-available-models:~:text=Messages%20in%20Amazon%20Bedrock
    """

    def __init__(self):
        super().__init__()
        # Client will be set in the run method. This is to avoid having to set the api key in the constructor
        self.client = None

    def id(self) -> str:
        return "ClaudeBedrockModelParser"

    async def serialize(
        self,
        prompt_name: str,
        data: Dict[Any, Any],
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

        # assume data is completion params for Claude Text Completion
        prompt_input = data["prompt"]

        settings = copy.deepcopy(data)
        # Prompt is handled, remove from settings
        settings.pop("Prompt", None)

        model_metadata = ai_config.get_model_metadata(settings, self.id())

        prompts: list[Prompt] = []

        prompt = Prompt(
            name=prompt_name,
            input=prompt_input,
            metadata=PromptMetadata(
                model=model_metadata, parameters=parameters, **kwargs
            ),
        )

        prompts.append(prompt)

        await ai_config.callback_manager.run_callbacks(
            CallbackEvent(
                "on_serialize_complete", __name__, {"result": prompts}
            )
        )

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
            Update this documentation... serialized_data (str): Serialized data from the .aiconfig.

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

    async def run_inference(
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
            # AWS credentials could either be in the environment or in ~/.aws/credentials
            # Let Anthropic's API handle AWS credentials validation which happens on Api call, not on client construct
            self.client = AnthropicBedrock()

        completion_data = await self.deserialize(prompt, aiconfig, parameters)

        # if stream enabled in runtime options and config, then stream. Otherwise don't stream.
        stream = True  # Default value
        if options is not None and options.stream is not None:
            stream = options.stream
        elif "stream" in completion_data:
            stream = completion_data["stream"]

        completion_data["stream"] = stream

        response = self.client.completions.create(**completion_data)  # type: ignore (pyright doesn't understand response object)

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

        if output.output_type == "execute_result":
            output_data = output.data
            if isinstance(output_data, str):
                return output_data

            # Claude outputs should only ever be string
            # format so shouldn't get here, but just being safe
            return json.dumps(output_data, indent=2)
        return ""


def refine_chat_completion_params(
    model_settings: Dict[Any, Any], aiconfig: "AIConfigRuntime", prompt: Prompt
) -> Dict[Any, Any]:
    # completion parameters to be used for Claude's Text completion api
    # See https://docs.anthropic.com/claude/reference/complete_post
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

    Response contains text-based output.
    See https://github.com/anthropics/anthropic-bedrock-python/blob/728669a89e08b2337c876906a57cbd88d0b7b282/src/anthropic_bedrock/types/completion.py#L9
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
    # Claude Bedrock api doesn't support multiple outputs
    # see for more info https://docs.anthropic.com/claude/reference/complete_post
    index = 0
    metadata = (
        {}
    )  # TODO: extract the completion stop reason from the response and add it to the metadata

    for iteration in response:
        new_text = iteration.completion

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
