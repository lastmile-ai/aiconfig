from gradio.components.base import Component
from gradio.data_classes import GradioModel
from gradio.events import EventListener

from .utils import show_debug


class GradioAIConfig(GradioModel):
    # TODO(rossdanlm): Explicitly define AIConfigRuntime
    # https://github.com/lastmile-ai/gradio-workbook/issues/62
    pass


class GradioNotebookComponent(Component):
    data_model = GradioAIConfig

    add_prompt_event_listener = EventListener(
        "add_prompt",
        doc="Triggered when user clicks the Add Prompt button",
    )
    cancel_run_event_listener = EventListener(
        "cancel_run",
        doc="Triggered when user clicks the cancel button while a prompt is running",
    )
    clear_outputs_event_listener = EventListener(
        "clear_outputs",
        doc="Triggered when user clicks the Clear Outputs button",
    )
    delete_prompt_event_listener = EventListener(
        "delete_prompt",
        doc="Triggered when user clicks the Delete Prompt button",
    )
    get_aiconfig_event_listener = EventListener(
        "get_aiconfig",
        doc="Triggered when user needs a non-stale version of config from server to perform an action directly on client (ex: download)",
    )
    remove_session_id_event_listener = EventListener(
        "remove_session_id",
        doc="Triggered when window is closing and session is about to be deleted",
    )
    share_config_event_listener = EventListener(
        "share_config",
        doc="Triggered when user clicks the Share button",
    )
    run_prompt_event_listener = EventListener(
        "run_prompt",
        doc="Triggered when user clicks the Run Prompt button",
    )
    set_config_description_event_listener = EventListener(
        "set_config_description",
        doc="Triggered when user sets the description for the AIConfig",
    )
    set_config_name_event_listener = EventListener(
        "set_config_name",
        doc="Triggered when user sets the name for the AIConfig",
    )
    set_parameters_event_listener = EventListener(
        "set_parameters",
        doc="Triggered when user sets global or prompt parameters. If done with a prompt, \
            it will update the param for that prompt. Otherwise, it will update \
            the overall parameters for the AIConfig",
    )
    update_model_event_listener = EventListener(
        "update_model",
        doc="Triggered when user clicks the Update Model button. If done with a prompt, \
            it will update the model settings for that prompt. Otherwise, it will update \
            the overall model settings for the AIConfig",
    )
    update_prompt_event_listener = EventListener(
        "update_prompt",
        doc="Triggered when user updates the prompt name or settings",
    )
    EVENTS = [
        add_prompt_event_listener,
        cancel_run_event_listener,
        clear_outputs_event_listener,
        delete_prompt_event_listener,
        get_aiconfig_event_listener,
        remove_session_id_event_listener,
        run_prompt_event_listener,
        share_config_event_listener,
        set_config_description_event_listener,
        set_config_name_event_listener,
        set_parameters_event_listener,
        update_model_event_listener,
        update_prompt_event_listener,
    ]

    def preprocess(self, payload: GradioAIConfig | None):
        if show_debug():
            print("\nin preprocess")
            print(f"{payload=}")
        if payload is None:
            return payload
        return payload

    def postprocess(self, value: str) -> str:
        """
        Return an output in the form of a json-formatted string for
        client to process
        """
        if show_debug():
            print("\nin postprocess")
            print(f"{value=}")
        return value

    # TODO (rossdanlm): Update this with a valud AIConfigRuntime object
    # https://github.com/lastmile-ai/gradio-workbook/issues/62
    def example_inputs(self):
        if show_debug():
            print("\nin example_inputs")
        return {"foo": "bar"}

    def api_info(self):
        return {"type": {}, "description": "AIConfigRuntime"}
