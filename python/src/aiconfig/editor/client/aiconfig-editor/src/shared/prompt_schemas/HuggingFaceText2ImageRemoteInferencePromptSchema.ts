import { PromptSchema } from "../../utils/promptUtils";

export const HuggingFaceText2ImageRemoteInferencePromptSchema: PromptSchema = {
  // See https://github.com/huggingface/huggingface_hub/blob/main/src/huggingface_hub/inference/_client.py#L1544 for supported params.
  // The settings below are supported settings specified in the HuggingFaceText2ImageRemoteInference refine_completion_params implementation.
  input: {
    type: "string",
  },
  model_settings: {
    type: "object",
    properties: {
      model: {
        type: "string",
        description: `Hugging Face model to use. Can be a model ID hosted on the Hugging Face Hub or a URL 
        to a deployed Inference Endpoint`,
        default: "CompVis/stable-diffusion-v1-4",
      },
      negative_prompt: {
        type: "string",
        description: `Describe content that should be avoided in the generated image.`,
      },
      height: {
        type: "number",
        description: `The height in pixels of the image to generate.`,
      },
      width: {
        type: "number",
        description: `The width in pixels of the image to generate.`,
      },
      num_inference_steps: {
        type: "integer",
        description: `The number of denoising steps. More denoising steps usually lead to a 
        higher quality image at the expense of slower inference.`,
      },
      guidance_scale: {
        type: "number",
        description: `Higher guidance scale encourages to generate images that are closely linked to the text 'prompt',
        usually at the expense of lower image quality.`,
      },
    },
  },
};
