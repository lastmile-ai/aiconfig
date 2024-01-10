import { PromptSchema } from "../../utils/promptUtils";

export const HuggingFaceTextGenerationTransformerPromptSchema: PromptSchema = {
  // See https://huggingface.co/docs/transformers/main_classes/text_generation
  // The following supported properties cannot be cleanly modeled in the schema and must be implemented programatically:
  // constraints, exponential_decay_length_penalty, sequence_bias
  // TODO: Add tuple support for exponential_decay_length_penalty and sequence_bias

  input: {
    type: "string",
  },
  model_settings: {
    type: "object",
    properties: {
      max_length: {
        type: "integer",
        description: `The maximum length the generated tokens can have. Corresponds to the length
        of the input prompt + max_new_tokens. Its effect is overridden by max_new_tokens, if also set.`,
      },
      max_new_tokens: {
        type: "integer",
        description: `The maximum numbers of tokens to generate, ignoring the number of tokens in the prompt.`,
      },
      min_length: {
        type: "integer",
        description: `The minimum length of the sequence to be generated.
         Corresponds to the length of the input prompt + min_new_tokens. 
         Its effect is overridden by min_new_tokens, if also set.`,
      },
      min_new_tokens: {
        type: "integer",
        description: `The minimum numbers of tokens to generate, ignoring the number of tokens in the prompt.`,
      },
      early_stopping: {
        // TODO: update to anyOf
        type: "union",
        types: [
          {
            type: "boolean",
          },
          {
            type: "string",
            enum: ["never"],
          },
        ],
        description: `Controls the stopping condition for beam-based methods, like beam-search. 
        It accepts the following values: True, where the generation stops as soon as there are num_beams 
        complete candidates; False, where an heuristic is applied and the generation stops when is it 
        very unlikely to find better candidates; "never", where the beam search procedure only stops when 
        there cannot be better candidates (canonical beam search algorithm).`,
      },
      max_time: {
        type: "number",
        description: `The maximum amount of time you allow the computation to run for in seconds. 
        Generation will still finish the current pass after allocated time has been passed.`,
      },
      do_sample: {
        type: "boolean",
        description: `Whether or not to use sampling ; use greedy decoding otherwise.`,
      },
      num_beams: {
        type: "integer",
        description: `Number of beams for beam search. 1 means no beam search.`,
      },
      num_beam_groups: {
        type: "integer",
        description: `Number of groups to divide num_beams into in order to ensure diversity among different groups of beams.`,
      },
      penality_alpha: {
        type: "number",
        description: `The values balance the model confidence and the degeneration penalty in contrastive search decoding.`,
      },
      use_cache: {
        type: "boolean",
        description: `Whether or not the model should use the past last key/values attentions (if applicable to the model) to speed up decoding.`,
      },
      temperature: {
        type: "float",
        description: `The value used to modulate the next token probabilities.`,
      },
      top_k: {
        type: "integer",
        description: `The number of highest probability vocabulary tokens to keep for top-k-filtering.`,
      },
      top_p: {
        type: "float",
        description: `If set to float < 1, only the most probable tokens with probabilities that add up to top_p or higher are kept for generation.`,
      },
      typical_p: {
        type: "float",
        description: `Local typicality measures how similar the conditional probability of predicting a target token next is to 
        the expected conditional probability of predicting a random token next, given the partial text already generated. 
        If set to float < 1, the smallest set of the most locally typical tokens with probabilities that add up to typical_p 
        or higher are kept for generation.`,
      },
      epsilon_cutoff: {
        type: "float",
        description: ` If set to float strictly between 0 and 1, only tokens with a conditional probability greater than 
        epsilon_cutoff will be sampled. In the paper, suggested values range from 3e-4 to 9e-4, depending on the size of the model.
         See Truncation Sampling as Language Model Desmoothing for more details.`,
      },
      eta_cutoff: {
        type: "float",
        description: `Eta sampling is a hybrid of locally typical sampling and epsilon sampling. If set to float strictly between 0 
        and 1, a token is only considered if it is greater than either 
        eta_cutoff or sqrt(eta_cutoff) * exp(-entropy(softmax(next_token_logits))). The latter term is intuitively the expected 
        next token probability, scaled by sqrt(eta_cutoff). In the paper, suggested values range from 3e-4 to 2e-3, depending 
        on the size of the model. See Truncation Sampling as Language Model Desmoothing for more details.`,
      },
      diveristy_penalty: {
        type: "flow",
        description: `This value is subtracted from a beam’s score if it generates a token same as any beam from other group at a 
        particular time. Note that diversity_penalty is only effective if group beam search is enabled.`,
      },
      repetition_penalty: {
        type: "float",
        description: `The parameter for repetition penalty. 1.0 means no penalty.`,
      },
      encoder_repetition_penalty: {
        type: "float",
        description: `The paramater for encoder_repetition_penalty. An exponential penalty on sequences that are not in the 
        original input. 1.0 means no penalty.`,
      },
      length_penalty: {
        type: "float",
        description: `Exponential penalty to the length that is used with beam-based generation. It is applied as an exponent 
        to the sequence length, which in turn is used to divide the score of the sequence. Since the score is the log likelihood 
        of the sequence (i.e. negative), length_penalty > 0.0 promotes longer sequences, while length_penalty < 0.0 encourages 
        shorter sequences.`,
      },
      no_repeat_ngram_size: {
        type: "integer",
        description: `If set to int > 0, all ngrams of that size can only occur once.`,
      },
      bad_words_ids: {
        type: "array",
        items: {
          type: "array",
          items: {
            type: "integer",
          },
        },
        description: `List of list of token ids that are not allowed to be generated. 
        Check NoBadWordsLogitsProcessor for further documentation and examples.`,
      },
      force_words_ids: {
        type: "union",
        types: [
          {
            type: "array",
            items: {
              type: "array",
              items: {
                type: "integer",
              },
            },
          },
          {
            type: "array",
            items: {
              type: "array",
              items: {
                type: "array",
                items: {
                  type: "integer",
                },
              },
            },
          },
        ],
        description: `List of token ids that must be generated. If given a List[List[int]], this is treated as a simple 
        list of words that must be included, the opposite to bad_words_ids. If given List[List[List[int]]], 
        this triggers a disjunctive constraint, where one can allow different forms of each word.`,
      },
      renormalize_logits: {
        type: "boolean",
        description: `Whether to renormalize the logits after applying all the logits processors or warpers 
        (including the custom ones). It’s highly recommended to set this flag to True as the search algorithms suppose the 
        score logits are normalized but some logit processors or warpers break the normalization.`,
      },
      forced_bos_token_id: {
        type: "integer",
        description: `The id of the token to force as the first generated token after the decoder_start_token_id. 
        Useful for multilingual models like mBART where the first generated token needs to be the target language token.`,
      },
      forced_eos_token_id: {
        type: "union",
        types: [
          {
            type: "integer",
          },
          {
            type: "array",
            items: {
              type: "integer",
            },
          },
        ],
        description: `The id of the token to force as the last generated token when max_length is reached. Optionally, use a list 
        to set multiple end-of-sequence tokens.`,
      },
      remove_invalid_values: {
        type: "boolean",
        description: `Whether to remove possible nan and inf outputs of the model to prevent the generation method to crash. 
        Note that using remove_invalid_values can slow down generation.`,
      },
      suppress_tokens: {
        type: "array",
        items: {
          type: "integer",
        },
        description: `A list of tokens that will be suppressed at generation. The SupressTokens logit processor will set their 
        log probs to -inf so that they are not sampled.`,
      },
      begin_suppress_tokens: {
        type: "array",
        items: {
          type: "integer",
        },
        description: `A list of tokens that will be suppressed at the beginning of the generation. The SupressBeginTokens logit 
        processor will set their log probs to -inf so that they are not sampled.`,
      },
      forced_decover_ids: {
        type: "array",
        items: {
          type: "array",
          items: {
            type: "integer",
          },
        },
        description: `A list of pairs of integers which indicates a mapping from generation indices to token indices that will be 
        forced before sampling. For example, [[1, 123]] means the second generated token will always be a token of index 123.`,
      },
      guidance_scale: {
        type: "float",
        description: `The guidance scale for classifier free guidance (CFG). CFG is enabled by setting guidance_scale > 1. 
        Higher guidance scale encourages the model to generate samples that are more closely linked to the input prompt, usually 
        at the expense of poorer quality.`,
      },
      low_memory: {
        type: "boolean",
        description: `Switch to sequential topk for contrastive search to reduce peak memory. Used with contrastive search.`,
      },
      num_return_sequences: {
        type: "integer",
        description: `The number of independently computed returned sequences for each element in the batch.`,
      },
      output_attentions: {
        type: "boolean",
        description: `Whether or not to return the attentions tensors of all attention layers. See attentions under 
        returned tensors for more details.`,
      },
      output_hidden_states: {
        type: "boolean",
        description: `Whether or not to return the hidden states of all layers. See hidden_states under returned tensors for 
        more details.`,
      },
      output_scores: {
        type: "boolean",
        description: `Whether or not to return the prediction scores. See scores under returned tensors for more details.`,
      },
      return_dict_in_generate: {
        type: "boolean",
        description: `Whether or not to return a ModelOutput instead of a plain tuple.`,
      },
      pad_token_id: {
        type: "integer",
        description: `The id of the padding token.`,
      },
      bos_token_id: {
        type: "integer",
        description: `The id of the beginning-of-sequence token.`,
      },
      eos_token_id: {
        type: "union",
        types: [
          {
            type: "integer",
          },
          {
            type: "array",
            items: {
              type: "integer",
            },
          },
        ],
        description: `The id of the end-of-sequence token. Optionally, use a list to set multiple end-of-sequence tokens.
        `,
      },
      encoder_no_repeat_ngram_size: {
        type: "integer",
        description: `If set to int > 0, all ngrams of that size that occur in the encoder_input_ids cannot occur 
        in the decoder_input_ids.`,
      },
      decoder_start_token_id: {
        type: "integer",
        description: `If an encoder-decoder model starts decoding with a different token than bos, the id of that token.`,
      },
      num_assistant_tokens: {
        type: "integer",
        description: `Defines the number of speculative tokens that shall be generated by the assistant model before being checked 
        by the target model at each iteration. Higher values for num_assistant_tokens make the generation more speculative : 
        If the assistant model is performant larger speed-ups can be reached, if the assistant model requires lots of corrections, 
        lower speed-ups are reached.`,
      },
      num_assistant_tokens_schedule: {
        type: "string",
        description: `Defines the schedule at which max assistant tokens shall be changed during inference.`,
      },
    },
  },
};
