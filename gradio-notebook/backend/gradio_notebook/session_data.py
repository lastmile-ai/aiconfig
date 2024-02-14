import time

from aiconfig import AIConfigRuntime
from pydantic import BaseModel


class SessionData(BaseModel):
    """
    Represents the data stored per session_id, including:
        - AIConfigRuntime: a copied version of the original AIConfigRuntime
        - update_time: the last time this config was updated
            - if it's been after certain amount of time, we will delete it
    """

    config: AIConfigRuntime
    update_time: float = time.time()

    def __lt__(self, other):
        return self.update_time < other.update_time
