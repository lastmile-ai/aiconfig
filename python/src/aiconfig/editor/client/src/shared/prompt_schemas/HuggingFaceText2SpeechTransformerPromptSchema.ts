import { PromptSchema } from "../../utils/promptUtils";

export const HuggingFaceText2SpeechTransformerPromptSchema: PromptSchema = {
  // See https://huggingface.co/transformers/v4.11.3/main_classes/model.html and
  // https://github.com/huggingface/transformers/blob/main/src/transformers/modeling_utils.py

  input: {
    type: "string",
  },
  model_settings: {
    type: "object",
    properties: {
      torch_dtype: {
        type: "string",
        description: `Override the default torch.dtype and load the model under this dtype. 
        If "auto" is passed the dtype will be automatically derived from the model’s weights.`,
      },
      force_download: {
        type: "boolean",
        description: `Whether or not to force the (re-)download of the model weights and configuration files, 
        overriding the cached versions if they exist.`,
      },
      cache_dir: {
        type: "string",
        description: ` Path to a directory in which a downloaded pretrained model configuration should be cached 
        if the standard cache should not be used.`,
      },
      resume_download: {
        type: "boolean",
        description: `Whether or not to delete incompletely received files. 
        Will attempt to resume the download if such a file exists.`,
      },
      proxies: {
        type: "map",
        keys: {
          type: "string",
        },
        items: {
          type: "string",
        },
        description: `A dictionary of proxy servers to use by protocol or endpoint, 
        e.g., {'http': 'foo.bar:3128', 'http://hostname': 'foo.bar:4012'}. 
        The proxies are used on each request.`,
      },
      output_loading_info: {
        type: "boolean",
        description: `Whether ot not to also return a dictionary containing missing keys, unexpected keys and error messages.`,
      },
      local_files_only: {
        type: "boolean",
        description: `Whether or not to only look at local files (i.e., do not try to download the model).`,
      },
      use_auth_token: {
        type: "boolean",
        description: `The token to use as HTTP bearer authorization for remote files. 
        If True, will use the token generated when running transformers-cli login (stored in huggingface).`,
      },
      revision: {
        type: "string",
        description: `The specific model version to use. It can be a branch name, a tag name, or a commit id,
         since we use a git-based system for storing models and other artifacts on huggingface.co, so revision 
         can be any identifier allowed by git.`,
      },
      mirror: {
        type: "string",
        description: `Mirror source to accelerate downloads in China. If you are from China and have an accessibility 
        problem, you can set this option to resolve it. Note that we do not guarantee the timeliness or safety. 
        Please refer to the mirror site for more information.`,
      },
      low_cpu_mem_usage: {
        type: "boolean",
        description: `Tries to not use more than 1x model size in CPU memory (including peak memory) while loading 
        the model. This is an experimental feature and a subject to change at any moment.`,
      },
      max_memory: {
        type: "map",
        keys: {
          type: "string",
        },
        items: {
          type: "number",
        },
        description: `A dictionary device identifier to maximum memory. Will default to the maximum memory available for each
        GPU and the available CPU RAM if unset.`,
      },
      offload_folder: {
        type: "string",
        description: `If the 'device_map' contains any value "disk", the folder where we will offload weights.`,
      },
      offload_state_dict: {
        type: "boolean",
        description: `If True, will temporarily offload the CPU state dict to the hard drive to avoid getting out of CPU
        RAM if the weight of the CPU state dict + the biggest shard of the checkpoint does not fit. Defaults to
        True when there is some disk offload.`,
      },
      use_safetensors: {
        type: "boolean",
        description: `Whether or not to use safetensors checkpoints. Defaults to None. If not specified and safetensors
        is not installed, it will be set to False.`,
      },
      variant: {
        type: "string",
        description: `If specified load weights from 'variant' filename, *e.g.* pytorch_model.<variant>.bin. 'variant' is
        ignored when using 'from_tf' or 'from_flax'`,
      },
    },
  },
};
