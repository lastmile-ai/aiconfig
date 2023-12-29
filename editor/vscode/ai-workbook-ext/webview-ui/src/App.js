"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("./utilities/vscode");
const react_1 = require("@vscode/webview-ui-toolkit/react");
require("./App.css");
function App() {
    function handleHowdyClick() {
        vscode_1.vscode.postMessage({
            command: "hello",
            text: "Hey there partner! 🤠",
        });
    }
    return (<main>
      <h1>Hello World!</h1>
      <react_1.VSCodeButton onClick={handleHowdyClick}>Howdy!</react_1.VSCodeButton>
    </main>);
}
exports.default = App;
//# sourceMappingURL=App.js.map