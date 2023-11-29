from typing import Any, Dict, List, Literal, Optional, Union

from aiconfig.util.config_utils import extract_override_settings
from pydantic import BaseModel

# Pydantic doesn't handle circular type references very well, TODO: handle this better than defining as type Any
# JSONObject represents a JSON object as a dictionary with string keys and JSONValue values
JSONObject = Dict[str, Any]
# InferenceSettings represents settings for model inference as a JSON object
InferenceSettings = JSONObject


class ExecuteResult(BaseModel):
    # Type of output
    output_type: Literal["execute_result"]
    # nth choice.
    execution_count: Union[int, None] = None
    # The result of the executing prompt.
    data: Any
    # The MIME type of the result. If not specified, the MIME type will be assumed to be plain text.
    mime_type: Optional[str] = None
    # Output metadata
    metadata: Dict[str, Any]


class Error(BaseModel):
    # Type of output
    output_type: Literal["error"]
    # The name of the error
    ename: str
    # The value, or message, of the error
    evalue: str
    # The error's traceback, represented as an array of strings
    traceback: List[str]


# Output can be one of ExecuteResult, ExecuteResult, DisplayData, Stream, or Error
Output = Union[ExecuteResult, Error]


class ModelMetadata(BaseModel):
    # The ID of the model to use.
    name: str
    # Model Inference settings that apply to this prompt.
    settings: Optional[InferenceSettings] = {}


class PromptMetadata(BaseModel):
    # Model name/settings that apply to this prompt
    # These settings override any global model settings that may have been defined in the AIConfig metadata.
    # If this is a string, it is assumed to be the model name.
    # Ift this is undefined, the default model specified in the default_model_property will be used for this Prompt.
    model: Optional[Union[ModelMetadata, str]] = None
    # Tags for this prompt. Tags must be unique, and must not contain commas.
    tags: Optional[List[str]] = None
    # Parameter definitions that are accessible to this prompt
    parameters: Optional[JSONObject] = {}

    class Config:
        extra = "allow"

class Attachment(BaseModel):
    '''
    Attachment used to pass data in PromptInput for non-text inputs (ex: image, audio)
    '''
    # index of the attachment
    input_count: Union[int, None] = None
    # The data representing the attachment
    data: Any
    # The MIME type of the result. If not specified, the MIME type will be assumed to be plain text.
    mime_type: Optional[str] = None
    # Output metadata
    metadata: Dict[str, Any]

class PromptInput(BaseModel):
    # Attachements can be used to pass in non-text inputs (ex: image, audio)
    attachments: List[Attachment] = []

    # Freeform data for the overall prompt input (ex: document answering question 
    # requires both images (attachments) and question (data))
    data: Optional[Any] = None

    class Config:
        extra = "allow"


class Prompt(BaseModel):
    # A unique identifier for the prompt. This is used to reference the prompt in other parts of the AIConfig (such as other prompts)
    name: str
    # The prompt string, or a more complex prompt object
    input: Union[str, PromptInput]
    # Metadata for the prompt
    metadata: Optional[PromptMetadata] = None
    # Execution, display, or stream outputs (currently a work-in-progress)
    outputs: Optional[List[Output]] = []

    class Config:
        extra = "allow"

    def add_output(self, output: Output):
        self.outputs.append(output)

    def get_raw_prompt_from_config(self):
        """Gets raw prompt from config"""
        if isinstance(self.input, str):
            return self.input
        else:
            return self.input.prompt


class SchemaVersion(BaseModel):
    major: int
    minor: int


class ConfigMetadata(BaseModel):
    # Parameter definitions that are accessible to all prompts in this AIConfig.
    # These parameters can be referenced in the prompts using handlebars syntax.
    # For more information, see https://handlebarsjs.com/guide/#basic-usage.
    parameters: Optional[JSONObject] = {}
    # Globally defined model settings. Any prompts that use these models will have these settings applied by default,
    # unless they override them with their own model settings.
    models: Optional[Dict[str, InferenceSettings]] = {}
    # Default model to use for prompts that do not specify a model.
    default_model: Optional[str] = None
    # Model ID to ModelParser ID mapping.
    # This is useful if you want to use a custom ModelParser for a model, or if a single ModelParser can handle multiple models.
    # Key is Model ID , Value is ModelParserID
    model_parsers: Optional[Dict[str, str]] = None

    class Config:
        extra = "allow"


class AIConfig(BaseModel):
    """
    AIConfig schema, latest version. For older versions, see AIConfigV*
    """

    # Friendly name descriptor for the AIConfig. Could default to the filename if not specified.
    name: str
    # The version of the AIConfig schema
    schema_version: Union[SchemaVersion, Literal["v1", "latest"]] = "latest"
    # Root-level metadata that applies to the entire AIConfig
    metadata: ConfigMetadata
    # Description of the AIConfig. If you have a collection of different AIConfigs, this may be used for dynamic prompt routing.
    description: Optional[str] = ""
    # An Array of prompts that make up the AIConfig
    prompts: List[Prompt] = []
    # An index of prompts by name, constructed during post-initialization.
    prompt_index: Dict[str, Prompt] = {}

    class Config:
        extra = "allow"

    def model_post_init(self, __context):
        """Post init hook for model"""
        self.prompt_index = {prompt.name: prompt for prompt in self.prompts}

    def set_name(self, name: str):
        """
        Sets the name of the AIConfig

        Args:
            name (str): The name of the AIConfig
        """
        self.name = name

    def set_description(self, description: str):
        """
        Sets the description of the AIConfig

        Args:
            description (str): The description of the AIConfig
        """
        self.description = description

    def add_model(self, model_name: str, model_settings: InferenceSettings):
        """
        Adds model settings to config level metadata
        """
        if model_name in self.metadata.models:
            raise Exception(
                f"Model '{model_name}' already exists. Use `update_model()`."
            )
        self.metadata.models[model_name] = model_settings

    def delete_model(self, model_name: str):
        """
        Deletes model settings from config level metadata
        """
        if model_name not in self.metadata.models:
            raise Exception(f"Model '{model_name}' does not exist.")
        del self.metadata.models[model_name]

    def get_model_name(self, prompt: Union[str, Prompt]):
        """
        Extracts the model ID from the prompt.

        Args:
            prompt: Either the name of the prompt or a prompt object.

        Returns:
            str: Name of the model used by the prompt.
        """
        if isinstance(prompt, str):
            prompt = self.prompt_index[prompt]
        if not prompt:
            raise Exception(f"Prompt '{prompt}' not found in config.")

        if not prompt.metadata:
            # If the prompt doesn't have a model, use the default model
            default_model = self.metadata.default_model
            if not default_model:
                raise Exception(
                    f"No model specified in AIConfig metadata, prompt {prompt.name} does not specify a model."
                )
            return default_model
        if isinstance(prompt.metadata.model, str):
            return prompt.metadata.model
        else:
            # Expect a ModelMetadata object
            return prompt.metadata.model.name

    def set_default_model(self, model_name: Union[str, None]):
        """
        Sets the model to use for all prompts by default in the AIConfig. Set to None to delete the default model.

        Args:
            model_name (str): The name of the default model.
        """
        self.metadata.default_model = model_name

    def get_default_model(self) -> Union[str, None]:
        """
        Returns the default model for the AIConfig.
        """
        return self.metadata.default_model

    def set_model_parser(self, model_name: str, model_parser_id: Union[str, None]):
        """
        Adds a model name : model parser ID mapping to the AIConfig metadata. This model parser will be used to parse Promps in the AIConfig that use the given model.

        Args:
            model_name (str): The name of the model to set the parser.
            model_parser_id (str): The ID of the model parser to use for the mode. If None, the model parser for the model will be removed.
        """
        if not self.metadata.model_parsers:
            self.metadata.model_parsers = {}

        self.metadata.model_parsers[model_name] = model_parser_id

    def get_metadata(self, prompt_name: Optional[str] = None):
        """
        Gets the metadata for a prompt. If no prompt is specified, gets the global metadata.

        Args:
            prompt_name (str, optional): The name of the prompt. Defaults to None.

        Returns:
            PromptMetadata: The metadata for the prompt.
        """
        if prompt_name:
            if prompt_name not in self.prompt_index:
                raise IndexError(f"Prompt '{prompt_name}' not found in config.")
            return self.prompt_index[prompt_name].metadata
        else:
            return self.metadata

    def set_parameter(
        self, parameter_name: str, parameter_value, prompt_name: Optional[str] = None
    ):
        """
        Sets a parameter in the AI configuration metadata. If a prompt_name is specified, it adds the parameter to
        a specific prompt's metadata in the AI configuration. Otherwise, it adds the parameter to the global metadata.

        Args:
            parameter_name (str): The name of the parameter.
            parameter_value: The value of the parameter. It can be more than just a string. It can be a string or a JSON object. For example:
                {
                person: {
                    firstname: "john",
                    lastname: "smith",
                    },
                }
                Using the parameter in a prompt with handlebars syntax would look like this:
                "{{person.firstname}} {{person.lastname}}"
            prompt_name (str, optional): The name of the prompt to add the parameter to. Defaults to None.
        """
        target_metadata = self.get_metadata(prompt_name)
        target_metadata.parameters[parameter_name] = parameter_value

    def update_parameter(
        self,
        parameter_name: str,
        parameter_value: str,
        prompt_name: Optional[str] = None,
    ):
        """
        Updates a parameter in the AI configuration metadata. If a prompt_name is specified, it updates the parameter
        in a specific prompt's metadata in the AI configuration. Otherwise, it updates the parameter in the global
        metadata. If the parameter doesn't exist, it adds the parameter.

        Args:
            parameter_name (str): The name of the parameter.
            parameter_value (str): The value of the parameter.
            prompt_name (str, optional): The name of the prompt (if applicable). Defaults to None.
        """
        target_metadata = self.get_metadata(prompt_name)
        target_metadata.parameters[parameter_name] = parameter_value

    def delete_parameter(self, parameter_name, prompt_name: Optional[str] = None):
        """
        Removes a parameter from the AI configuration metadata. If a prompt_name is specified, it removes the parameter
        from a particular prompt's metadata in the AI configuration. Else, it removes the parameter from the global
        metadata. If the parameter doesn't exist, do nothing.

        Args:
            parameter_name (str): The name of the parameter.
            prompt_name (str, optional): The name of the prompt to remove the parameter from. Defaults to None.
        """
        target_metadata = self.get_metadata(prompt_name)

        # Remove the parameter if it exists
        if parameter_name in target_metadata.parameters:
            del target_metadata.parameters[parameter_name]
        else:
            raise KeyError(f"Parameter '{parameter_name}' does not exist.")

    def get_prompt(self, prompt_name: str) -> Prompt:
        """
        Gets a prompt byname from the aiconfig.

        Args:
            prompt_name (str): The name of the prompt to get.

        Returns:
            Prompt: The prompt object.
        """
        if prompt_name not in self.prompt_index:
            raise IndexError(
                "Prompt '{}' not found in config, available prompts are:\n {}".format(
                    prompt_name, list(self.prompt_index.keys())
                )
            )
        return self.prompt_index[prompt_name]

    def add_prompt(self, prompt_name: str, prompt_data: Prompt):
        """
        Adds a prompt to the .aiconfig.

        Args:
            prompt_name (str): The name of the prompt to add.
            prompt_data (Prompt): The prompt object containing the prompt data.
        """
        if prompt_name is None:
            prompt_name = prompt_data.name
        if prompt_name in self.prompt_index:
            raise Exception(
                "Prompt with name {} already exists. Use`update_prompt()`".format(
                    prompt_name
                )
            )

        prompt_data.name = prompt_name
        self.prompt_index[prompt_name] = prompt_data
        self.prompts.append(prompt_data)

    def update_prompt(self, prompt_name: str, prompt_data: Prompt):
        """
        Given a prompt name and a prompt object, updates the prompt in the .aiconfig.

        Args:
            prompt_name (str): The name of the prompt to update.
            prompt_data (Prompt): The prompt object containing the updated prompt data.
        """
        if prompt_name not in self.prompt_index:
            raise IndexError(
                "Prompt not found in config, available prompts are:\n {}".format(
                    list(self.prompt_index.keys())
                )
            )

        self.prompt_index[prompt_name] = prompt_data
        # update prompt list
        for i, prompt in enumerate(self.prompts):
            if prompt.name == prompt_name:
                self.prompts[i] = prompt_data
                break

    def delete_prompt(self, prompt_name: str):
        """
        Given a prompt name, deletes the prompt from the .aiconfig.

        Args:
            prompt_name (str): The name of the prompt to delete.
        """
        if prompt_name not in self.prompt_index:
            raise IndexError(
                "Prompt not found in config, available prompts are:\n {}".format(
                    list(self.prompt_index.keys())
                )
            )

        del self.prompt_index[prompt_name]
        # remove from prompt list
        self.prompts = [prompt for prompt in self.prompts if prompt.name != prompt_name]

    def get_model_metadata(
        self, inference_settings: InferenceSettings, model_id: str
    ) -> ModelMetadata:
        """
        Generate a model metadata object based on the provided inference settings

        This function takes the inference settings and the model ID and generates a ModelMetadata object.

        Args:
            inference_settings (InferenceSettings): The inference settings.
            model_id (str): The model id.

        Returns:
            ModelMetadata: The model metadata.
        """

        overriden_settings = extract_override_settings(
            self, inference_settings, model_id
        )

        if not overriden_settings:
            model_metadata = ModelMetadata(**{"name": model_id})
        else:
            model_metadata = ModelMetadata(
                **{"name": model_id, "settings": overriden_settings}
            )
        return model_metadata

    def update_model(
        self, model_metadata: Dict | ModelMetadata, prompt_name: Optional[str] = None
    ):
        """
        Updates model settings in AIconfig-level metadata

        Args:
            model_metadata (dict): The model metadata to update.
            prompt_name (str, optional): If specified, the model settings will only be applied to the prompt with the given prompt_name.
        """
        if isinstance(model_metadata, dict):
            if "name" not in model_metadata:
                raise KeyError(
                    "Cannot update model. Model metadata must contain a 'name' element. Optionally, it may contain a 'settings' element."
                )
            model_metadata = ModelMetadata(**model_metadata)
        if prompt_name:
            prompt = self.get_prompt(prompt_name)
            if not prompt:
                raise IndexError(
                    f"Cannot update model {model_metadata.name} for prompt {prompt_name}. Prompt {prompt_name} does not exist in AIConfig."
                )
            prompt.metadata.model = model_metadata
        else:
            self.metadata.models[model_metadata.name] = model_metadata.settings

    def set_metadata(self, key: str, value: Any, prompt_name: Optional[str] = None):
        """
        Sets a metadata property in the AIConfig

        Args:
            key (str): The Metadata key.
            value (str): Metadata value. Must be a JSON-serializable object (ie dict, list, str, etc).
            prompt_name (str, optional): If specified, the metadata will only be updated for the prompt with the given name
        """
        if prompt_name:
            prompt = self.get_prompt(prompt_name)
            if not prompt:
                raise IndexError(
                    f"Cannot set metadata property '{key}' for prompt {prompt_name}. Prompt {prompt_name} does not exist in AIConfig."
                )
            setattr(prompt.metadata, key, value)
        else:
            setattr(self.metadata, key, value)

    def delete_metadata(self, key: str, prompt_name: Optional[str] = None):
        """
        Removes a metadata property in the AIConfig

        Args:
            key (str): The Metadata key.
            prompt_name (str, optional): If specified, the metadata will only be deleted for the prompt with the given name
        """
        if prompt_name:
            prompt = self.get_prompt(prompt_name)
            if not prompt:
                raise IndexError(
                    f"Cannot delete metadata. Prompt '{prompt_name}' not found in config."
                )
            if hasattr(prompt.metadata, key):
                delattr(prompt.metadata, key)
            else:
                raise KeyError(
                    f"Metadata '{key}' does not exist for Prompt {prompt_name}."
                )
        else:
            if hasattr(self.metadata, key):
                delattr(self.metadata, key)
            else:
                raise KeyError(f"Metadata '{key}' does not exist in config.")

    # TODO: rename _get_metadata to get_metadata

    def add_output(self, prompt_name: str, output: Output, overwrite: bool = False):
        """
        Add an output to the [rompt with the given name in the AIConfig

        Args:
            prompt_name (str): The name of the prompt to add the output to.
            output (Output): The output to add.
            overwrite (bool, optional): Overwrites the existing output if True. Otherwise appends the output to the prompt's output list. Defaults to False.
        """
        prompt = self.get_prompt(prompt_name)
        if not prompt:
            raise IndexError(
                f"Cannot out output. Prompt '{prompt_name}' not found in config."
            )
        if overwrite or not output:
            prompt.outputs = [output]
        else:
            prompt.outputs.append(output)

    def delete_output(self, prompt_name: str):
        """
        Deletes the outputs for the prompt with the given prompt_name.

        Args:
            prompt_name (str): The name of the prompt to delete the outputs for.

        Returns:
            List[Output]: The outputs that were deleted.
        """
        prompt = self.get_prompt(prompt_name)
        existing_outputs = prompt.outputs
        prompt.outputs = []

        return existing_outputs

    def get_latest_output(self, prompt: str | Prompt):
        """
        Gets the latest output associated with a prompt.

        Args:
            prompt (str|Prompt): The name of the prompt or the prompt object.
        """
        if isinstance(prompt, str):
            prompt = self.prompt_index[prompt]
        if not prompt.outputs:
            return None
        return prompt.outputs[-1]

    def get_output_text(self, prompt: str | Prompt):
        """
        Gets the string representing the output from a prompt.

        Args:
            prompt (str|Prompt): The name of the prompt or the prompt object.
        """

    def get_prompt_parameters(self, prompt: Prompt):
        """
        Gets the prompt's local parameters for a prompt.
        """
        if not prompt.metadata:
            return {}
        return prompt.metadata.parameters

    """
    Library Helpers
    """

    def get_global_settings(self, model_name: str):
        """
        Gets the global settings for a model.

        Args:
            model_name (str): The name of the model.

        Returns:
            dict: The global settings for the model with the given name. Returns an empty dict if no settings are defined.
        """
        return self.metadata.models.get(model_name, {})


AIConfigV1 = AIConfig
