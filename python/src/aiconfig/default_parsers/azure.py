from aiconfig.default_parsers.openai import DefaultOpenAIParser
from aiconfig.util.config_utils import get_api_key_from_environment

from openai import AzureOpenAI


class AzureOpenAIParser(DefaultOpenAIParser):
    def __init__(self, deployment: str):
        super().__init__(model_id = deployment)

        # Deployment is a custom name that user defines in Azure portal. 
        self.deployment = deployment 

    async def deserialize(self, *args, **kwargs):
        # Logic doesn't depend on input, pass it forward to the openai model parser deserialize 
        openai_deserialized_params = await super().deserialize(*args, **kwargs)

        # Should this just be the "model name" from config? 
        # If so, Then the "model name" will have to be deployment name and be consistent 
        # Which would mean we don't need to have this custom deserialization
        openai_deserialized_params["model"] = self.deployment 
        return openai_deserialized_params

    def initialize_openai_client(self) -> None:
        ## The Azure Client itself will check and retrieve these from environment 
        # if its not explicitly passed in & will raise otherwise. Technically not needed
        azure_openai_key = get_api_key_from_environment(
            "AZURE_OPENAI_KEY"
        ).unwrap()

        azure_endpoint = get_api_key_from_environment(
            "AZURE_OPENAI_ENDPOINT"
        ).unwrap()

        # Initialize Azure Client.
        self.client = AzureOpenAI(
            api_key=azure_openai_key,
            api_version="2023-12-01-preview", # This will have to either be set here or passed in. Otherwise, azure client will check environment variables and throw error if not set
            azure_endpoint=azure_endpoint,
        )
