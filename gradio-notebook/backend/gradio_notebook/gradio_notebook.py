import json

from .aiconfig_manager import AIConfigManager
from .events import EventHandler
from .gradio_notebook_component import GradioNotebookComponent
from .utils import show_debug


class GradioNotebook:
    """
    A wrapper that constructs a GradioNotebookComponent. We need to do this instead of
    using the GradioNotebookComponent directly because if we try to override the __init__
    method of GradioNotebookComponent, it doesn't properly pass the value into the Component
    """

    config_manager: AIConfigManager

    def __init__(self, config_path: str = "", parsers_path: str = "", **kwargs):
        """
        Args:
            config_path: (str, optional): The filepath to load the AIConfig from.
                If the filepath doesn't exist, a new AIConfig will be created
            parsers_path: (str, optional): The filepath to a module which registers
                additional ModelParsers to the ModelParserRegistry. If the module
                doesn't exist, the default ModelParsers (HF remote inference) will be
                used
        """
        # Create AIConfigManager
        self.config_manager = AIConfigManager(config_path, parsers_path)
        if show_debug():
            print(f"{self.config_manager=}")
            print(f"{self.config_manager.config=}")

        # Display components
        self.component = GradioNotebookComponent(
            value=json.dumps(
                {
                    "aiconfig": self.config_manager.get_config_json("original"),
                    "model_ids": self.config_manager.get_models(),
                }
            ),
            **kwargs,
        )

        # Hook up events
        self._register_events(self.component)

    def _register_events(self, component: GradioNotebookComponent) -> None:
        """
        Register all the events that we need to handle
        Please see the diagram here for visual representation on the steps below:
            https://drive.google.com/file/d/1MgQlh9rL319QBABHuooRnSRymTWoKiEF/view?usp=sharing
        1. Every Component has an EVENTS field which holds the names of events that can
            be triggered on that component (ex: GradioNotebookComponent has
            `add_prompt` event in the EVENTS field)
        2. When we run the app (`gradio cc dev`), this will automagically create an
            .pyi file for each custom component. `.pyi` means Python-interface, and this
            is what is actually being read/run/whatever when using the app. If you open
            this file, you will see that a new function is created for each event
            added in the events field. Ex: `gradio_notebook_component.pyi` contains the
            function `add_prompt()`
        3. This function `add_prompt()` takes in 3 main arguments (many others kwargs,
            but ignore those for now): (<some_function>, <some_inputs>, <some_outputs>)
            Ex: in this function below we setup this piece of code:
                `component.add_prompt(event_handler.add_prompt_impl, [], [component])`
            This means that when the event `add_prompt` is triggered, we will call the
                `event_handler.add_prompt_impl` function by passing the inputs (empty
                in our case) to this function, and return the result of
                `event_handler.add_prompt_impl` to the outputs (components)
        4. The frontend (Index.svelte) dispatches an event corresponding to the name
            of an event in the EVENTS field, and also sends in a json payload which
            contains data that matches the EventData class for that event
        5. The backend defines the EventData class for each event, which specifies
            the schema of the json payload that the frontend sends
            (ex: AddPromptEventData has fields for `prompt` and `existing_ai_config`)
        6. The <some_function> takes in this payload through an EventData object and
            does whatever it wants with it, returning the output which gets sent to
            the output component in part 3
        7. The backend uses the auto-generated event function from part 3 to register
            event listeners using the implementation from part 6
        """
        event_handler = EventHandler(config_manager=self.config_manager)
        component.add_prompt(
            event_handler.add_prompt_impl, [], [component], show_progress=False
        )
        component.cancel_run(
            event_handler.cancel_run_impl, [], [component], show_progress=False
        )
        component.clear_outputs(
            event_handler.clear_outputs_impl, [], [component], show_progress=False
        )
        component.delete_prompt(
            event_handler.delete_prompt_impl, [], [component], show_progress=False
        )
        component.get_aiconfig(
            event_handler.get_aiconfig_impl, [], [component], show_progress=False
        )
        component.remove_session_id(
            event_handler.remove_session_id_impl, [], [component], show_progress=False
        )
        component.run_prompt(
            event_handler.run_prompt_impl, [], [component], show_progress=False
        )
        component.set_config_description(
            event_handler.set_config_description_impl,
            [],
            [component],
            show_progress=False,
        )
        component.set_config_name(
            event_handler.set_config_name_impl, [], [component], show_progress=False
        )
        component.set_parameters(
            event_handler.set_parameters_impl, [], [component], show_progress=False
        )
        component.share_config(
            event_handler.share_config_impl, [], [component], show_progress=False
        )
        component.update_model(
            event_handler.update_model_impl, [], [component], show_progress=False
        )
        component.update_prompt(
            event_handler.update_prompt_impl, [], [component], show_progress=False
        )
