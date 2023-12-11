# Define a Model Parser for LLama-Guard


import copy
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from transformers import AutoTokenizer

from aiconfig.default_parsers.parameterized_model_parser import ParameterizedModelParser
from aiconfig.model_parser import InferenceOptions
from aiconfig.schema import ExecuteResult, Output, Prompt, PromptMetadata
from aiconfig.util.params import resolve_prompt
from aiconfig import CallbackEvent

from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

# Circuluar Dependency Type Hints
if TYPE_CHECKING:
    from aiconfig.Config import AIConfigRuntime




# Step 1: define Helpers
def refine_chat_completion_params(model_settings: Dict[str, Any]) -> Dict[str, Any]:
    """
    Refines the completion params for the HF text generation api. Removes any unsupported params.
    The supported keys were found by looking at the HF text generation api. `huggingface_hub.InferenceClient.text_generation()`
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
    output = ExecuteResult(
        **{
            "output_type": "execute_result",
            "data": result["generated_text"],
            "execution_count": execution_count,
            "metadata": {},
        }
    )
    return output



# This model parser doesn't support streaming. TODO: Implement streaming
# This Model Parser doesn't support n-outputs.
class LLamaGuardParser(ParameterizedModelParser):
    """
    A model parser for HuggingFace models of type text generation task using transformers.
    """

    def __init__(self):
        """
        Returns:
            HuggingFaceTextGenerationTransformer

        Usage:
        1. Create a new model parser object with the model ID of the model to use.
                parser = HuggingFaceTextGenerationTransformer()
        2. Add the model parser to the registry.
                config.register_model_parser(parser)
        """
        super().__init__()
        model_id = "meta-llama/LlamaGuard-7b"
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print("device: ", self.device)
        dtype = torch.bfloat16
        self.tokenizer = AutoTokenizer.from_pretrained(model_id)
        self.model = AutoModelForCausalLM.from_pretrained(
            model_id, torch_dtype=dtype, device_map=self.device
        )

    def id(self) -> str:
        """
        Returns an identifier for the Model Parser
        """
        return "LlamaGuardParser"

    async def serialize(
        self,
        prompt_name: str,
        data: Any,
        ai_config: "AIConfigRuntime",
        parameters: Optional[Dict[str, Any]] = None,
        **kwargs,
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

        model_metadata = ai_config.get_model_metadata(data, self.id())
        prompt = Prompt(
            name=prompt_name,
            input=prompt_input,
            metadata=PromptMetadata(
                model=model_metadata, parameters=parameters, **kwargs
            ),
        )
        return prompt

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

        # Tokenized Prompt
        inputs = self.tokenizer([resolved_prompt], return_tensors="pt").to(self.device)

        deserialize_output = {"tokenized_input": inputs, "gen_params": completion_data}

        await aiconfig.callback_manager.run_callbacks(
            CallbackEvent(
                "on_deserialize_complete", __name__, {"text_prompt": resolved_prompt, "output": deserialize_output}
            )
        )

        return deserialize_output

    async def run_inference(
        self,
        prompt: Prompt,
        aiconfig: "AIConfigRuntime",
        options: InferenceOptions,
        parameters: Dict[str, Any],
    ) -> List[Output]:
        """
        Invoked to run a prompt in the .aiconfig. This method should perform
        the actual model inference based on the provided prompt and inference settings.

        Args:
            prompt (str): The input prompt.
            inference_settings (dict): Model-specific inference settings.

        Returns:
            InferenceResponse: The response from the model.
        """

        resolved_data = await self.deserialize(prompt, aiconfig, options, parameters)
        # Move to GPU if applicable, self.device is set in __init__). Otherwise this is a no-op
        tokenized_input_cuda = resolved_data["tokenized_input"].to(self.device)

        # Merge tokenized input with other generation parameters
        gen_params = resolved_data["gen_params"]
        input_params = {**tokenized_input_cuda, **gen_params}

        response = self.model.generate(**input_params)
        prompt_len = tokenized_input_cuda["input_ids"].shape[-1]
        output_text = self.tokenizer.decode(
            response[0][prompt_len:], skip_special_tokens=True
        )

        Output = ExecuteResult(
            **{
                "output_type": "execute_result",
                "data": output_text,
                "execution_count": 0,
                "metadata": {},
            }
        )

        prompt.outputs = [Output]
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
            if isinstance(output.data, str):
                return output.data
        else:
            return ""
