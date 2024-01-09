import { PromptSchema } from "../../utils/promptUtils";

export const HuggingFaceText2ImageDiffusorPromptSchema: PromptSchema = {
  // See /Users/ryanholinshead/Projects/aiconfig/extensions/HuggingFace/python/src/aiconfig_extension_hugging_face/local_inference/text_2_image.py
  // for supported settings.
  // See https://huggingface.co/docs/diffusers/main/en/api/pipelines/stable_diffusion/text2img#diffusers.StableDiffusionPipeline.__call__
  // for descriptions.

  // This is currently for Kandinsky 2.2

  // The following supported properties cannot be cleanly modeled in the schema and must be implemented programatically:
  // generator, latents, prompt_embeds, negative_prompt_embeds, callback

  input: {
    type: "string",
  },
  model_settings: {
    type: "object",
    properties: {
      height: {
        type: "integer",
        description: `The height in pixels of the generated image.`,
      },
      width: {
        type: "integer",
        description: `The width in pixels of the generated image.`,
      },
      num_inference_steps: {
        type: "integer",
        description: `The number of denoising steps. More denoising steps usually lead to a higher 
        quality image at the expense of slower inference.`,
      },
      guidance_scale: {
        type: "number",
        description: `A higher guidance scale value encourages the model to generate images closely linked 
        to the text prompt at the expense of lower image quality. Guidance scale is enabled when guidance_scale > 1.`,
      },
      // TODO: Convert to anyOf once renderer supports it
      negative_prompt: {
        type: "union",
        types: [
          {
            type: "string",
          },
          {
            type: "array",
            items: {
              type: "string",
            },
          },
        ],
      },
      num_images_per_prompt: {
        type: "integer",
        description: `The number of images to generate per prompt.`,
      },
      eta: {
        type: "number",
        description: `Corresponds to parameter eta (η) from the DDIM paper. 
        Only applies to the DDIMScheduler, and is ignored in other schedulers.`,
      },
      output_type: {
        type: "string",
        enum: ["pil", "array"],
        description: `The output format of the generated image. Choose between PIL.Image or np.array.`,
      },
      return_dict: {
        type: "boolean",
        description: `Whether or not to return a StableDiffusionPipelineOutput instead of a plain tuple.`,
      },
      cross_attention_kwargs: {
        type: "map",
        keys: {
          type: "string",
        },
        items: {
          type: "string",
        },
        description: `A kwargs dictionary that if specified is passed along to the AttentionProcessor as defined in self.processor.`,
      },
      guidance_rescale: {
        type: "number",
        description: `Guidance rescale factor from Common Diffusion Noise Schedules and Sample Steps are Flawed.
         Guidance rescale factor should fix overexposure when using zero terminal SNR.`,
      },
      clip_skip: {
        type: "integer",
        description: `Number of layers to be skipped from CLIP while computing the prompt embeddings. 
        A value of 1 means that the output of the pre-final layer will be used for computing the prompt embeddings.`,
      },
      requires_safety_checker: {
        type: "boolean",
        description: `Whether or not the model requires a safety checker to be used.`,
      },
      callback_steps: {
        type: "integer",
        description: `The frequency at which the callback function will be called. 
        If not specified, the callback will be called at every step.`,
      },
    },
  },
};
