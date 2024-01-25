from aiconfig.default_parsers.openai import DefaultOpenAIParser
from aiconfig.util.config_utils import get_api_key_from_environment

from openai import AzureOpenAI


class AzureParser(DefaultOpenAIParser):
    def __init__(self, deployment: str):
        super().__init__(deployment)

        self.deployment = deployment

    def deserialize(self, *args, **kwargs):
        openai_deserialized_params = super().deserialize(*args, **kwargs)
        openai_deserialized_params["model"] = self.deployment
        return openai_deserialized_params

    def initialize_openai_client(self) -> None:
        azure_openai_key = get_api_key_from_environment(
            "AZURE_OPENAI_KEY"
        ).unwrap()
        azure_endpoint = get_api_key_from_environment(
            "AZURE_OPENAI_ENDPOINT"
        ).unwrap()
        client = AzureOpenAI(
            api_key=azure_openai_key,
            azure_endpoint=azure_endpoint,
        )
