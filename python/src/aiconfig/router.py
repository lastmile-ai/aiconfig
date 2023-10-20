from abc import ABCMeta, abstractmethod
from typing import List
from aiconfig import Prompt
from aiconfig.AIConfigSettings import Output
from aiconfig.Config import AIConfigRuntime

class Router(Metaclass=ABCMeta):

    def __init__(self, config: AIConfigRuntime):
        self.config = config

    @abstractmethod
    def find(input, **kwargs) -> List[Prompt]:
        """
        Search and select a list of suitable prompts
        """
        pass

    @abstractmethod
    def route(self, **kwargs) -> Output:
        """
        The main entry point for the router. This method should be called to route the input to the appropriate prompt. Run the inference and return the output.
        """
        pass
