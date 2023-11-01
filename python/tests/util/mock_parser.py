from aiconfig.model_parser import ModelParser


class MockModelParser(ModelParser):
    def __init__(self):
        pass

    def id(self):
        return "mock_model_parser"

    def serialize(**kwargs):
        return

    def deserialize(**kwargs):
        return

    def run(**kwargs):
        return
    def get_output_text():
        return
