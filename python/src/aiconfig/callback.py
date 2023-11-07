class event():
    data: any

class startEvent(event):
    action: str

class endEvent(event):
    action: str

class callbackHandler():
    pass

class callBackManager():
    def __init__(self):
        self.callbacks = {}
        self.callbacks["start"] = []
        self.callbacks["end"] = []
        self.callbacks["error"] = []

    def addCallback(self, event: str, callback: Callable[[event], None]):
        self.callbacks[event].append(callback)

    def runCallbacks(self, event: event):
        for callback in self.callbacks[event.action]:
            callback(event)