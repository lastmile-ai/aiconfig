"""Helper class to reference the AIConfigRuntime state
"""
import copy
import heapq
import time
from threading import Event
from typing import Any, Dict, Literal

from aiconfig import AIConfigRuntime, ModelParserRegistry
from aiconfig.registry import update_model_parser_registry_with_config_runtime
from aiconfig_extension_hugging_face import (
    HuggingFaceAutomaticSpeechRecognitionRemoteInference,
    HuggingFaceConversationalRemoteInference,
    HuggingFaceImage2TextRemoteInference,
    HuggingFaceText2ImageRemoteInference,
    HuggingFaceText2SpeechRemoteInference,
    HuggingFaceTextGenerationRemoteInference,
    HuggingFaceTextSummarizationRemoteInference,
    HuggingFaceTextTranslationRemoteInference,
)

from .session_data import SessionData
from .utils import (
    EXCLUDE_OPTIONS,
    get_validated_path,
    load_user_parser_module,
    show_debug,
)

# TODO (rossdanlm): Use os.path to get better relative path to file
DEFAULT_CONFIG_PATH: Literal = "my_app.aiconfig.json"
DEFAULT_PARSERS_PATH: Literal = "model_parsers.py"
DEFAULT_AICONFIG_SETTINGS: Dict[str, Any] = {
    "name": "Gradio Notebook AIConfig",
    # TODO (rossdanlm): Link this description to our README docs to help people get
    # started
    "description": "This is the AIConfig that is used for the current Gradio notebook",
}
NUM_MINUTES_BEFORE_DELETING_OLD_SESSIONS = 120  # 2 hours


class AIConfigManager:
    """
    Manages the mapping of client session --> SessionData state so that
    we can reference AIConfig from other classes without worrying about it
    being stale. This also ensures that there are no circular dependencies for
    classes that need to reference the AIConfigRuntime

    Also will contain utility methods if needed
    """

    session_data_map: Dict[str, SessionData]
    session_id_lru_min_heap: list[(float, str)]  # (update_time, session_id)
    thread_events: dict[str, Event]

    def __init__(self, config_path: str, parsers_path: str):
        self._clear_default_model_parsers()
        self._register_model_parsers(parsers_path)
        self.session_data_map = {
            "original": SessionData(
                config=self._create_or_load_aiconfig(config_path),
                update_time=time.time(),
            )
        }
        self.session_id_lru_min_heap = []  # Do not store original in min_heap
        self.thread_events = {}

    def _clear_default_model_parsers(self):
        """
        By default, there are a ton of non-hf models/parsers registered in the
        ModelParserRegistry. We want to clear these out so that we can register
        only the hf ones to start
        """
        ModelParserRegistry.clear_registry()

    def _register_model_parsers(self, parsers_path: str):
        """
        Register the model parsers to use for the AIConfig.
        By default, we register the main HuggingFace parsers.

        TODO: Support user-provider parser registration
        """
        automatic_speech_recognition = (
            HuggingFaceAutomaticSpeechRecognitionRemoteInference()
        )
        AIConfigRuntime.register_model_parser(
            automatic_speech_recognition, "Automatic Speech Recognition"
        )

        conversational = HuggingFaceConversationalRemoteInference()
        AIConfigRuntime.register_model_parser(conversational, "Conversational")

        image_to_text = HuggingFaceImage2TextRemoteInference()
        AIConfigRuntime.register_model_parser(image_to_text, "Image-to-Text")

        text_to_image = HuggingFaceText2ImageRemoteInference()
        AIConfigRuntime.register_model_parser(text_to_image, "Text-to-Image")

        text_to_speech = HuggingFaceText2SpeechRemoteInference()
        AIConfigRuntime.register_model_parser(text_to_speech, "Text-to-Speech")

        text_generation = HuggingFaceTextGenerationRemoteInference()
        AIConfigRuntime.register_model_parser(text_generation, "Text Generation")

        text_summarization = HuggingFaceTextSummarizationRemoteInference()
        AIConfigRuntime.register_model_parser(text_summarization, "Summarization")

        text_translation = HuggingFaceTextTranslationRemoteInference()
        AIConfigRuntime.register_model_parser(text_translation, "Translation")

        # By default, model parsers will also have their own ids registered. Remove those
        # since we just want the task-based names registered
        parsers = [
            automatic_speech_recognition,
            conversational,
            image_to_text,
            text_to_image,
            text_to_speech,
            text_generation,
            text_summarization,
            text_translation,
        ]

        for parser in parsers:
            ModelParserRegistry.remove_model_parser(parser.id())

        # Lastly, register any user-provided model parsers, if applicable
        if not parsers_path:
            print(
                f"Warning, no parsers_path was provided so using default path '{DEFAULT_PARSERS_PATH}' instead"
            )
            parsers_path = DEFAULT_PARSERS_PATH

        self._load_user_parser_module_if_exists(parsers_path)

    def _load_user_parser_module_if_exists(self, parsers_module_path: str) -> None:
        try:
            parsers_path = get_validated_path(parsers_module_path)
            load_user_parser_module(parsers_path)
            print(f"Loaded parsers module from {parsers_module_path}")
        except Exception as e:
            print(f"Failed to load parsers module: {e}")

    def delete_session_id(self, session_id: str) -> None:
        """Delete the session_id from the session_data_map map"""
        self.session_data_map.pop(session_id, None)

    def get_config(self, session_id: str) -> AIConfigRuntime:
        """Get a config that is mapped to a session id"""
        update_time = time.time()
        if session_id not in self.session_data_map:
            copied_config = copy.deepcopy(self.session_data_map["original"].config)
            session_data = SessionData(config=copied_config, update_time=update_time)
            self.session_data_map[session_id] = session_data
            heapq.heappush(self.session_id_lru_min_heap, (update_time, session_id))

        if show_debug():
            print(f"{self.session_data_map.keys()=}")
            update_times = [
                (k, v.update_time) for k, v in self.session_data_map.items()
            ]
            print(f"{update_times=}")

        self.session_data_map[session_id].update_time = update_time
        self.clear_old_session_ids()
        return self.session_data_map[session_id].config

    def get_config_json(self, session_id: str) -> dict[str, Any]:
        """Helper function to return the config in json dict format"""
        return self.get_config(session_id).model_dump(exclude=EXCLUDE_OPTIONS)

    def set_config(self, session_id: str, config: AIConfigRuntime):
        """Set the AIConfigRuntime for a session_id and also reset the update_time"""
        session_data = SessionData(config=config, update_time=time.time())
        self.session_data_map[session_id] = session_data

    def _create_or_load_aiconfig(self, config_path: str) -> AIConfigRuntime:
        """
        Create or load an AIConfigRuntime from a provide config_path.
        This should only ever be called during init of this AIConfigManager class
        """
        already_tried_default_filepath = False
        if not config_path:
            print(
                f"Warning, no config_path was provided so using default path '{DEFAULT_CONFIG_PATH}' instead"
            )
            config_path = DEFAULT_CONFIG_PATH
            already_tried_default_filepath = True

        try:
            config = AIConfigRuntime.load(config_path)
        # TODO (rossdanlm): Test this also with malformed json format to see which error it produces and catch for that
        except FileNotFoundError:
            try:
                if not already_tried_default_filepath:
                    print(
                        f"Warning, config_path '{config_path}' not found, trying default config_path '{DEFAULT_CONFIG_PATH}' instead..."
                    )
                    config_path = DEFAULT_CONFIG_PATH
                    config = AIConfigRuntime.load(config_path)
                else:
                    raise FileNotFoundError()
            except FileNotFoundError:
                print(
                    f"Warning, config_path '{config_path}' not found, creating new AIConfig."
                )
                config_path = DEFAULT_CONFIG_PATH
                config = AIConfigRuntime.create(**DEFAULT_AICONFIG_SETTINGS)
        config.file_path = config_path
        update_model_parser_registry_with_config_runtime(config)
        return config

    def get_models(self) -> list[str]:
        """Helper function to get the models from the ModelParserRegistry"""
        return ModelParserRegistry.parser_ids()

    def clear_old_session_ids(self):
        """
        Clear out old session_ids from the session_id_lru_min_heap and session_data_map
        """
        threshold_cutoff_time: float = (
            time.time() - NUM_MINUTES_BEFORE_DELETING_OLD_SESSIONS * 60
        )
        if show_debug():
            print(f"{threshold_cutoff_time=}\n")
        while (
            len(self.session_id_lru_min_heap) > 0
            and self.session_id_lru_min_heap[0][0]  # update_time
            < threshold_cutoff_time
        ):
            session_id = self.session_id_lru_min_heap[0][1]
            should_delete = self.remove_lru_session_if_not_updated(
                threshold_cutoff_time,
            )
            if should_delete:
                self.session_data_map.pop(session_id, None)

    def remove_lru_session_if_not_updated(self, threshold_cutoff_time: float) -> bool:
        """
        Remove the least recently used session from the session_id_lru_min_heap
        If the session has been updated since it was added to the min_heap, and the
        update time is after the threshold cutoff, then we need to add it back to the
        min_heap and check again

        @return bool: Whether the session was removed or not
        """
        old_update_time, session_id = heapq.heappop(self.session_id_lru_min_heap)
        actual_update_time = self.session_data_map[session_id].update_time
        if (
            old_update_time < actual_update_time
            and actual_update_time > threshold_cutoff_time
        ):
            # This means that the update_time was updated since we added it to the
            # min_heap, so we need to add it back to the min_heap and check again
            heapq.heappush(
                self.session_id_lru_min_heap, (actual_update_time, session_id)
            )
            return False
        return True
