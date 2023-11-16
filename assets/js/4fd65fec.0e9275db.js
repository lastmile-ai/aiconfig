"use strict";(self.webpackChunkaiconfig_docs=self.webpackChunkaiconfig_docs||[]).push([[62],{923:(e,n,a)=>{a.r(n),a.d(n,{assets:()=>o,contentTitle:()=>s,default:()=>h,frontMatter:()=>r,metadata:()=>l,toc:()=>c});var t=a(5893),i=a(1151);const r={sidebar_position:14},s="Extensibility",l={id:"extensibility",title:"Extensibility",description:"ModelParser Extensibility",source:"@site/docs/extensibility.md",sourceDirName:".",slug:"/extensibility",permalink:"/docs/extensibility",draft:!1,unlisted:!1,editUrl:"https://github.com/lastmile-ai/aiconfig/aiconfig-docs/docs/extensibility.md",tags:[],version:"current",sidebarPosition:14,frontMatter:{sidebar_position:14},sidebar:"docSidebar",previous:{title:"Prompt Routing",permalink:"/docs/cookbooks/prompt-routing"},next:{title:"Contributing Guidelines",permalink:"/docs/contributing"}},o={},c=[{value:"ModelParser Extensibility",id:"modelparser-extensibility",level:2},{value:"Contributing",id:"contributing",level:2},{value:"Extending AIConfig",id:"extending-aiconfig",level:2},{value:"Bring your own Model",id:"bring-your-own-model",level:3},{value:"Getting Started with Model Parsers",id:"getting-started-with-model-parsers",level:3},{value:"ModelParser Class",id:"modelparser-class",level:2},{value:"Model Parser Extensibility",id:"model-parser-extensibility",level:2},{value:"Parameterized Model Parser",id:"parameterized-model-parser",level:3},{value:"Quick Note On Parameterization:",id:"quick-note-on-parameterization",level:4},{value:"Model Parser Extensibility with Parameterization",id:"model-parser-extensibility-with-parameterization",level:3},{value:"Helper Utils provided with the Parameterized Model Parser Class",id:"helper-utils-provided-with-the-parameterized-model-parser-class",level:3},{value:"General Helper Utilities for Parameterization",id:"general-helper-utilities-for-parameterization",level:3},{value:"Callback handlers",id:"callback-handlers",level:3},{value:"Structure of a Callback Event",id:"structure-of-a-callback-event",level:4},{value:"Writing Custom Callbacks",id:"writing-custom-callbacks",level:4},{value:"Setting up a CallbackManager and Registering Callbacks",id:"setting-up-a-callbackmanager-and-registering-callbacks",level:4},{value:"Triggering Callbacks",id:"triggering-callbacks",level:4},{value:"Handling Callbacks with Timers",id:"handling-callbacks-with-timers",level:4},{value:"Error Handling",id:"error-handling",level:4},{value:"Custom metadata",id:"custom-metadata",level:3}];function d(e){const n={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",h4:"h4",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,i.a)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.h1,{id:"extensibility",children:"Extensibility"}),"\n",(0,t.jsx)(n.h2,{id:"modelparser-extensibility",children:"ModelParser Extensibility"}),"\n",(0,t.jsx)(n.h2,{id:"contributing",children:"Contributing"}),"\n",(0,t.jsx)(n.h2,{id:"extending-aiconfig",children:"Extending AIConfig"}),"\n",(0,t.jsx)(n.p,{children:"AIConfig is designed to be customized and extended for your use-case. There are some key extension points for AIConfig:"}),"\n",(0,t.jsx)(n.h3,{id:"bring-your-own-model",children:"Bring your own Model"}),"\n",(0,t.jsxs)(n.p,{children:["You can use any generative AI model with the ",(0,t.jsx)(n.code,{children:"aiconfig"})," format. All you need to do is define a ",(0,t.jsx)(n.code,{children:"ModelParser"})," class. This class is responsible for 3 key operations:"]}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:"serialize"})," prompts, model parameters and inference outputs into an ",(0,t.jsx)(n.code,{children:"aiconfig"}),"."]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:"deserialize"})," existing ",(0,t.jsx)(n.code,{children:"aiconfig"})," prompts for that model into the data that the model accepts (e.g. OpenAI chat completion params)."]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:"run"})," inference using a model (e.g. calling the OpenAI API or a model running locally)."]}),"\n"]}),"\n",(0,t.jsx)(n.h3,{id:"getting-started-with-model-parsers",children:"Getting Started with Model Parsers"}),"\n",(0,t.jsx)(n.h1,{id:"defining-your-own-model-parser",children:"Defining Your Own Model Parser"}),"\n",(0,t.jsx)(n.p,{children:"In this guide, you will learn the basics of defining your own custom Model Parser for use in the AIConfig library. Model Parsers play a crucial role in managing and interacting with AI models within the AIConfig SDK. You can create custom Model Parsers to suit your specific needs and integrate them seamlessly into AIConfig."}),"\n",(0,t.jsx)(n.h2,{id:"modelparser-class",children:"ModelParser Class"}),"\n",(0,t.jsxs)(n.p,{children:["The ",(0,t.jsx)(n.code,{children:"ModelParser"})," is an abstract base class that serves as the foundation for all Model Parsers. It defines a set of methods and behaviors that any Model Parser implementation must adhere to. Below are the key methods defined in the ",(0,t.jsx)(n.code,{children:"ModelParser"})," class:"]}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"id()"}),'\nReturns an identifier for the model parser (e.g., "OpenAIModelParser, HuggingFaceTextGeneration", etc.).']}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"serialize()"}),"\nSerialize a prompt and additional metadata/model settings into a ",(0,t.jsx)(n.code,{children:"Prompt"})," object that can be saved in the AIConfig."]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"deserialize()"}),"\nDeserialize a ",(0,t.jsx)(n.code,{children:"Prompt"})," object loaded from an AIConfig into a structure that can be used for model inference."]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"run()"}),"\nExecute model inference based on completion data constructed in the ",(0,t.jsx)(n.code,{children:"deserialize()"})," method. It saves the response or output in ",(0,t.jsx)(n.code,{children:"prompt.outputs"}),"."]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"get_output_text()"}),": Get the output text from the output object containing model inference response."]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"get_model_settings()"}),": Extract the AI model's settings from the AIConfig"]}),"\n"]}),"\n",(0,t.jsx)(n.h2,{id:"model-parser-extensibility",children:"Model Parser Extensibility"}),"\n",(0,t.jsxs)(n.p,{children:["When defining your custom Model Parser, you can inherit from the ",(0,t.jsx)(n.code,{children:"ModelParser"})," class and override its methods as needed to customize the behavior for your specific AI models. This extensibility allows you to seamlessly integrate your Model Parser into the AIConfig framework and manage AI models with ease."]}),"\n",(0,t.jsx)(n.h3,{id:"parameterized-model-parser",children:"Parameterized Model Parser"}),"\n",(0,t.jsxs)(n.p,{children:["In some cases, you may want to create a specialized Model Parser that handles parameterization of prompts. The ",(0,t.jsx)(n.code,{children:"ParameterizedModelParser"})," is an abstract subclass of ",(0,t.jsx)(n.code,{children:"ModelParser"})," that provides additional methods and utilities for parameterization."]}),"\n",(0,t.jsx)(n.h4,{id:"quick-note-on-parameterization",children:"Quick Note On Parameterization:"}),"\n",(0,t.jsx)(n.p,{children:"In AIConfig, parameters refer to the handlebar syntax used by prompt inputs to denote a placeholder for another value. See # Parameters and Chaining Prompts section"}),"\n",(0,t.jsx)(n.h3,{id:"model-parser-extensibility-with-parameterization",children:"Model Parser Extensibility with Parameterization"}),"\n",(0,t.jsxs)(n.p,{children:["When defining your own custom Model Parser, you can choose to inherit from the ",(0,t.jsx)(n.code,{children:"ParameterizedModelParser"})," class to take advantage of the parameterization features provided by AIConfig. This allows you to create model parsers that can handle prompts with placeholders and dynamically replace them with actual values during serialization and deserialization."]}),"\n",(0,t.jsx)(n.p,{children:"By incorporating parameterization into your model parser, you can create AIConfigs that are more flexible and adaptable to different use cases, as well as facilitate the customization of prompt templates to meet specific requirements."}),"\n",(0,t.jsxs)(n.p,{children:["Another notable benefit of using parameterization is the ability to leverage the ",(0,t.jsx)(n.code,{children:"run_with_dependencies"})," feature. The ",(0,t.jsx)(n.code,{children:"run_with_dependencies"})," API method allows you to execute prompts with resolved dependencies and prompt references, providing more advanced control over the model's behavior."]}),"\n",(0,t.jsxs)(n.p,{children:["The ",(0,t.jsx)(n.code,{children:"ParameterizedModelParser"})," class and associated helper utilities empower you to harness the power of parameterization in your AI configuration management, offering greater flexibility and control over how prompts are processed and used in model inference."]}),"\n",(0,t.jsx)(n.h3,{id:"helper-utils-provided-with-the-parameterized-model-parser-class",children:"Helper Utils provided with the Parameterized Model Parser Class"}),"\n",(0,t.jsxs)(n.p,{children:["The ",(0,t.jsx)(n.code,{children:"ParameterizedModelParser"})," class extends the capabilities of the base ",(0,t.jsx)(n.code,{children:"ModelParser"})," and includes the following methods:"]}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:["Python ",(0,t.jsx)(n.code,{children:"resolve_prompt_template()"})," TypeScript: ",(0,t.jsx)(n.code,{children:"resolve_prompt_template()"}),"\nResolves a templated string with provided parameters, allowing for dynamic prompt generation."]}),"\n",(0,t.jsxs)(n.li,{children:["Python ",(0,t.jsx)(n.code,{children:"get_prompt_template()"})," TypeScript: ",(0,t.jsx)(n.code,{children:"get_prompt_template()"}),"\nAn overrideable method that returns a template for a prompt. Customize this method to specify how prompt templates are extracted from prompts."]}),"\n"]}),"\n",(0,t.jsx)(n.h3,{id:"general-helper-utilities-for-parameterization",children:"General Helper Utilities for Parameterization"}),"\n",(0,t.jsx)(n.p,{children:"To facilitate parameterization, AIConfig provides a set of helper utilities:"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:["Python: ",(0,t.jsx)(n.code,{children:"resolve_parameters()"})," TypeScript: ",(0,t.jsx)(n.code,{children:"resolveParameters()"}),"\nResolves parameters within a given string by substituting placeholders with actual values."]}),"\n",(0,t.jsxs)(n.li,{children:["Python: ",(0,t.jsx)(n.code,{children:"resolve_prompt_string()"})," TypeScript: ",(0,t.jsx)(n.code,{children:"resolve_prompt_string()"}),"\nResolves a templated string with parameters, similar to the ",(0,t.jsx)(n.code,{children:"resolve_prompt_template()"})," method of the ",(0,t.jsx)(n.code,{children:"ParameterizedModelParser"})," class."]}),"\n",(0,t.jsxs)(n.li,{children:["Python: ",(0,t.jsx)(n.code,{children:"resolve_parametrized_prompt()"})," TypeScript: ",(0,t.jsx)(n.code,{children:"resolve_parametrized_prompt() "}),"\nResolves a parametrized prompt by substituting parameter placeholders with their corresponding values."]}),"\n",(0,t.jsxs)(n.li,{children:["Python: ",(0,t.jsx)(n.code,{children:"resolve_system_prompt()"})," TypeScript: ",(0,t.jsx)(n.code,{children:"resolve_system_prompt() "}),"\nResolves system prompts, often used in multi-turn conversations, by applying parameterization to system prompt templates."]}),"\n"]}),"\n",(0,t.jsx)(n.p,{children:"These utilities enable dynamic parameterization of prompts and customization of prompt templates to meet specific requirements."}),"\n",(0,t.jsx)(n.p,{children:"Here are some helpful resources to get started:"}),"\n",(0,t.jsxs)(n.ol,{children:["\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"ModelParser"})," class (",(0,t.jsx)(n.a,{href:"https://github.com/lastmile-ai/aiconfig/blob/main/python/src/aiconfig/model_parser.py",children:"Python"}),", ",(0,t.jsx)(n.a,{href:"https://github.com/lastmile-ai/aiconfig/blob/main/typescript/lib/modelParser.ts",children:"TypeScript"}),")."]}),"\n",(0,t.jsxs)(n.li,{children:["OpenAI Chat ",(0,t.jsx)(n.code,{children:"ModelParser"})," (",(0,t.jsx)(n.a,{href:"https://github.com/lastmile-ai/aiconfig/blob/main/python/src/aiconfig/default_parsers/openai.py#L25",children:"Python"}),", ",(0,t.jsx)(n.a,{href:"https://github.com/lastmile-ai/aiconfig/blob/main/typescript/lib/parsers/openai.ts#L261",children:"TypeScript"}),")"]}),"\n"]}),"\n",(0,t.jsx)(n.h3,{id:"callback-handlers",children:"Callback handlers"}),"\n",(0,t.jsxs)(n.p,{children:["The AIConfig SDK has a ",(0,t.jsx)(n.code,{children:"CallbackManager"})," class which can be used to register callbacks that trace prompt resolution, serialization, deserialization, and inference. This lets you get a stack trace of what's going on under the covers, which is especially useful for complex control flow operations."]}),"\n",(0,t.jsx)(n.p,{children:"Anyone can register a callback, and filter for the events they care about. You can subsequently use these callbacks to integrate with your own monitoring and observability systems."}),"\n",(0,t.jsxs)(n.p,{children:["Video: ",(0,t.jsx)(n.a,{href:"https://github.com/lastmile-ai/aiconfig/assets/141073967/ce909fc4-881f-40d9-9c67-78a6682b3063",children:"https://github.com/lastmile-ai/aiconfig/assets/141073967/ce909fc4-881f-40d9-9c67-78a6682b3063"})]}),"\n",(0,t.jsx)(n.h4,{id:"structure-of-a-callback-event",children:"Structure of a Callback Event"}),"\n",(0,t.jsx)(n.p,{children:"Each callback event is an object of the CallbackEvent type, containing:"}),"\n",(0,t.jsx)(n.p,{children:'name: The name of the event (e.g., "on_resolve_start").\nfile: The source file where the event is triggered\ndata: An object containing relevant data for the event, such as parameters or results.\nts_ns: An optional timestamp in nanoseconds.'}),"\n",(0,t.jsx)(n.h4,{id:"writing-custom-callbacks",children:"Writing Custom Callbacks"}),"\n",(0,t.jsx)(n.p,{children:"Custom callbacks are functions that conform to the Callback type. They receive a CallbackEvent object containing event details, and return a Promise. Here's an example of a simple logging callback:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-typescript",children:"const myLoggingCallback: Callback = async (event: CallbackEvent) => {\n  console.log(`Event triggered: ${event.name}`, event);\n};\n"})}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-python",children:'async def my_logging_callback(event: CallbackEvent) -> None:\n  print(f"Event triggered: {event.name}", event)\n'})}),"\n",(0,t.jsx)(n.p,{children:"Sample output:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{children:"Event triggered: on_resolve_start\nCallbackEventModel(name='on_resolve_start', file='/Users/John/Projects/aiconfig/python/src/aiconfig/Config.py', data={'prompt_name': 'get_activities', 'params': None}, ts_ns=1700094936363867000)\nEvent triggered: on_deserialize_start\n"})}),"\n",(0,t.jsx)(n.h4,{id:"setting-up-a-callbackmanager-and-registering-callbacks",children:"Setting up a CallbackManager and Registering Callbacks"}),"\n",(0,t.jsx)(n.p,{children:"To register this callback with the AIConfigRuntime, include it in the array of callbacks when creating a CallbackManager:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-typescript",children:"const myCustomCallback: Callback = async (event: CallbackEvent) => {\n  console.log(`Event triggered: ${event.name}`, event);\n};\n\nconst callbackManager = new CallbackManager([myCustomCallback]);\naiConfigRuntimeInstance.setCallbackManager(callbackManager);\n"})}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-python",children:'async def my_custom_callback(event: CallbackEvent) -> None:\n  print(f"Event triggered: {event.name}", event)\n\ncallback_manager = CallbackManager([my_custom_callback])\naiconfigRuntimeInstance.set_callback_manager(callback_manager)\n'})}),"\n",(0,t.jsx)(n.h4,{id:"triggering-callbacks",children:"Triggering Callbacks"}),"\n",(0,t.jsx)(n.p,{children:"Callbacks are automatically triggered at specific points in the AIConfigRuntime flow. For example, when the resolve method is called on an AIConfigRuntime instance, it triggers on_resolve_start and on_resolve_end events, which are then passed to the CallbackManager to execute any associated callbacks."}),"\n",(0,t.jsx)(n.p,{children:"Sample implementation inside source code:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-typescript",children:'  public async resolve(promptName: string, params: JSONObject = {}) {\n    const startEvent = {\n      name: "on_resolve_start",\n      file: __filename,\n      data: { promptName, params },\n    } as CallbackEvent;\n    await this.callbackManager.runCallbacks(startEvent);\n\n    /** Method Implementation*/\n\n    const endEvent = {\n      name: "on_resolve_end",\n      file: __filename,\n      data: { result: resolvedPrompt },\n    };\n    await this.callbackManager.runCallbacks(endEvent);\n    return resolvedPrompt;\n  }\n'})}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-python",children:'async def resolve(\n    self,\n    prompt_name: str,\n    params: Optional[dict] = None,\n    **kwargs,\n):\n    event = CallbackEvent("on_resolve_start", __file__, {"prompt_name": prompt_name, "params": params})\n    await self.callback_manager.run_callbacks(event)\n\n    """Method Implementation"""\n\n    event = CallbackEvent("on_resolve_complete", __name__, {"result": response})\n    await self.callback_manager.run_callbacks(event)\n    return response\n\n'})}),"\n",(0,t.jsx)(n.p,{children:"Similarly, ModelParsers should trigger their own events when serializing, deserializing, and running inference. These events are also passed to the CallbackManager to execute any associated callbacks."}),"\n",(0,t.jsx)(n.h4,{id:"handling-callbacks-with-timers",children:"Handling Callbacks with Timers"}),"\n",(0,t.jsx)(n.p,{children:"The CallbackManager uses a timeout mechanism to ensure callbacks do not hang indefinitely. If a callback does not complete within the specified timeout, it is aborted, and an error is logged. This timeout can be adjusted in the CallbackManager constructor and defaults to 5 if not specified."}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-typescript",children:"const customTimeout = 10; // 10 seconds\nconst callbackManager = new CallbackManager(callbacks, customTimeout);\n"})}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-python",children:"custom_timeout = 10; # 10 seconds\ncallback_manager = CallbackManager([my_logging_callback], custom_timeout)\n"})}),"\n",(0,t.jsx)(n.h4,{id:"error-handling",children:"Error Handling"}),"\n",(0,t.jsx)(n.p,{children:"Custom callbacks should include error handling to manage exceptions. Errors thrown within callbacks are caught by the CallbackManager and can be logged or handled as needed."}),"\n",(0,t.jsx)(n.h3,{id:"custom-metadata",children:"Custom metadata"}),"\n",(0,t.jsxs)(n.p,{children:["You can store any kind of JSON-serializable metadata in an ",(0,t.jsx)(n.code,{children:"aiconfig"}),". See the ",(0,t.jsx)(n.a,{href:"https://aiconfig.lastmileai.dev/docs/overview/ai-config-format#metadata",children:"metadata schema details"})," to learn more."]}),"\n",(0,t.jsxs)(n.p,{children:["To add metadata, use the ",(0,t.jsx)(n.code,{children:"config.setMetadata"})," API (available in both Python and TypeScript)."]})]})}function h(e={}){const{wrapper:n}={...(0,i.a)(),...e.components};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(d,{...e})}):d(e)}},1151:(e,n,a)=>{a.d(n,{Z:()=>l,a:()=>s});var t=a(7294);const i={},r=t.createContext(i);function s(e){const n=t.useContext(r);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function l(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:s(e.components),t.createElement(r.Provider,{value:n},e.children)}}}]);