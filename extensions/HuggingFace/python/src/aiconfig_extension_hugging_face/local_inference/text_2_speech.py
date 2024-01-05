import base64
import copy
import io
import numpy as np
import torch
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Union
from transformers import Pipeline, pipeline
from scipy.io.wavfile import write as write_wav

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
def refine_pipeline_creation_params(model_settings: Dict[str, Any]) -> List[Dict[str, Any]]:
    supported_keys = {
        "torch_dtype",
        "force_download",
        "cache_dir",
        "resume_download",
        "proxies",
        "output_loading_info",
        "local_files_only",
        "use_auth_token",
        "revision",
        "custom_revision",
        "mirror",
        "device_map",
        "max_memory",
        "offload_folder",
        "offload_state_dict",
        "low_cpu_mem_usage",
        "use_safetensors",
        "variant",
    }

    pipeline_creation_params: Dict[str, Any] = {}
    completion_params: Dict[str, Any] = {}
    for key in model_settings:
        if key.lower() in supported_keys:
            pipeline_creation_params[key.lower()] = model_settings[key]
        else:
            if key.lower() == "kwargs" and isinstance(model_settings[key], Dict):
                completion_params.update(model_settings[key])
            else:
                completion_params[key.lower()] = model_settings[key]

    return [pipeline_creation_params, completion_params]


def refine_completion_params(unfiltered_completion_params: Dict[str, Any]) -> Dict[str, Any]:
    supported_keys = {
        # ???
    }

    completion_params: Dict[str, Any] = {}
    for key in unfiltered_completion_params:
        if key.lower() in supported_keys:
            completion_params[key.lower()] = unfiltered_completion_params[key]

    return completion_params


def construct_output(audio, execution_count: int) -> Output:
    def _b64_encode_bytes(byte_array: bytes) -> str:
        return base64.b64encode(byte_array).decode("utf-8")

    def _audio_ndarray_to_wav_bytes(audio: np.ndarray, sampling_rate: int) -> bytes:
        buffered = io.BytesIO()
        write_wav(buffered, sampling_rate, audio)

        # get byte array from the buffer
        byte_array = buffered.getvalue()
        return byte_array

    def _audio_ndarray_to_b64_str(audio: np.ndarray, sampling_rate: int) -> str:
        byte_array = _audio_ndarray_to_wav_bytes(audio, sampling_rate)
        return _b64_encode_bytes(byte_array)

    data = dict(kind="base64", value=_audio_ndarray_to_b64_str(np.squeeze(audio["audio"]), audio["sampling_rate"]))
    output = ExecuteResult(
        **{
            "output_type": "execute_result",
            "data": data,
            "execution_count": execution_count,
            "metadata": {},
            "mime_type": "audio/wav",
        }
    )
    return output


class HuggingFaceText2SpeechTransformer(ParameterizedModelParser):
    def __init__(self):
        super().__init__()
        self.synthesizers: dict[str, Pipeline] = {}

    def id(self) -> str:
        """
        Returns an identifier for the Model Parser
        """
        return "HuggingFaceText2SpeechTransformer"

    async def serialize(
        self,
        prompt_name: str,
        data: Any,
        ai_config: "AIConfigRuntime",
        parameters: Optional[Dict[str, Any]] = None,
        **completion_params,
    ) -> List[Prompt]:
        """
        Defines how a prompt and model inference settings get serialized in the .aiconfig.

        Args:
            prompt (str): The prompt to be serialized.
            inference_settings (dict): Model-specific inference settings to be serialized.

        Returns:
            str: Serialized representation of the prompt and inference settings.
        """
        data = copy.deepcopy(data)

        # assume data is completion params for HF text to image task:
        # https://huggingface.co/docs/diffusers/main/en/api/pipelines/stable_diffusion/text2img#diffusers.StableDiffusionPipeline.__call__
        # TODO (rossdanlm): Figure out how to check for StableDiffusionXLPipeline
        prompt_input = data["prompt"]

        # Prompt is handled, remove from data
        data.pop("prompt", None)

        model_metadata = ai_config.get_model_metadata(data, self.id())
        prompt = Prompt(
            name=prompt_name,
            input=prompt_input,
            metadata=PromptMetadata(model=model_metadata, parameters=parameters, **completion_params),
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
        [_pipeline_creation_params, unfiltered_completion_params] = refine_pipeline_creation_params(model_settings)
        completion_data = refine_completion_params(unfiltered_completion_params)

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
        model_settings = self.get_model_settings(prompt, aiconfig)
        [pipeline_creation_data, _] = refine_pipeline_creation_params(model_settings)
        if not pipeline_creation_data.get("requires_safety_checker", True):
            pipeline_creation_data["safety_checker"] = None

        model_name: str = aiconfig.get_model_name(prompt)
        if isinstance(model_name, str) and model_name not in self.synthesizers:
            self.synthesizers[model_name] = pipeline("text-to-speech", model_name)
        synthesizer = self.synthesizers[model_name]

        completion_data = await self.deserialize(prompt, aiconfig, options, parameters)
        inputs = completion_data.pop("prompt", None)
        response = synthesizer(inputs, **completion_data)

        outputs: List[Output] = []
        assert not isinstance(response, list)
        for count, audio in enumerate([response]):
            output = construct_output(audio, count)
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
            if isinstance(output.data, OutputDataWithValue):
                return output.data.value
            elif isinstance(output.data, str):
                return output.data
        return ""

    def _get_device(self) -> str:
        if torch.cuda.is_available():
            return "cuda"
        elif torch.backends.mps.is_available():
            return "mps"
        return "cpu"
