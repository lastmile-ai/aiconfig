import { set } from "lodash";
import { compile } from "handlebars";
import { Prompt } from "../types";
import { JSONObject } from "../common";
import { ModelParserRegistry } from "./modelParserRegistry";
import { ParameterizedModelParser } from "./parameterizedModelParser";
import { AIConfigRuntime } from "./config";

export function getPromptTemplate(prompt: Prompt, aiConfig: AIConfigRuntime) {
  const modelParser = ModelParserRegistry.getModelParserForPrompt(
    prompt,
    aiConfig
  );
  if (modelParser instanceof ParameterizedModelParser) {
    return modelParser.getPromptTemplate(prompt, aiConfig);
  }

  if (typeof prompt.input === "string") {
    return prompt.input;
  } else if (typeof prompt.input?.data === "string") {
    return prompt.input?.data;
  } else {
    throw new Error(
      `Cannot get prompt template string from prompt: ${JSON.stringify(
        prompt.input
      )}`
    );
  }
}

// TODO: saqadri - this function should be implemented in conjunction with the model registry in order to
// generalize its implementation and let different model providers define the serialization format for
// system prompts.
export function getSystemPromptTemplate(
  prompt: Prompt,
  aiConfig: AIConfigRuntime
) {
  const modelParser = ModelParserRegistry.getModelParserForPrompt(
    prompt,
    aiConfig
  );

  const modelSettings = modelParser?.getModelSettings(prompt, aiConfig);
  const systemPrompt = modelSettings?.system_prompt;
  return systemPrompt as string;
}

/**
 * Takes the Prompt object and returns the resolved prompt string with all the parameters filled in.
 */
export function resolvePrompt(
  prompt: Prompt,
  aiConfig: AIConfigRuntime,
  params?: JSONObject
) {
  const promptTemplate = getPromptTemplate(prompt, aiConfig);

  const resolvedPrompt = resolvePromptString(
    promptTemplate,
    prompt,
    aiConfig,
    params
  );

  return resolvedPrompt;
}

/**
 * Takes the prompt string containing possible handlebars syntax, and returns the resolved prompt string with all the parameters filled in.
 */
export function resolvePromptString(
  promptTemplate: string,
  prompt?: Prompt,
  aiConfig?: AIConfigRuntime,
  params?: JSONObject
) {
  const template = compile(promptTemplate);

  const configParameters = aiConfig?.metadata?.parameters;
  const promptParameters = prompt?.metadata?.parameters;

  let data = {
    ...(configParameters || {}),
    ...(promptParameters || {}),
    ...(params || {}),
  };

  // Add named cells above the current cell to the parameters to allow references to them
  if (prompt != null && aiConfig != null) {
    for (let i = 0; i < aiConfig.prompts.length; i++) {
      const currentPrompt = aiConfig.prompts[i];
      if (prompt.name === currentPrompt.name) {
        // We only allow references to prompts above the current prompt to prevent cycles by design
        // TODO: saqadri - revisit this restriction in the future.
        break;
      }

      const resolvedParameter = resolvePromptReference(currentPrompt, aiConfig);
      if (resolvedParameter != null) {
        data = {
          ...data,
          ...resolvedParameter,
        };
      }
    }
  }

  // TODO: saqadri - determine which parameters were actually used in the prompt (will become important to identify dependency graph eventually)
  const resolvedPrompt = template(data);
  return resolvedPrompt;
}

/**
 * Get the default prompt name in format "prompt_#" where # is the 1-indexed number of the new prompt inserted
 * below previous prompt.
 */
export function createPromptName(
  previousPromptName: string | null,
  promptPrefix: string | null,
  aiConfig: AIConfigRuntime
) {
  const prefix = promptPrefix || "prompt_";
  if (previousPromptName == null) {
    return `${prefix}1`;
  }
  const existingPromptNames = new Set<string>();
  let newPromptNumber = 1;
  let previousPromptFound = false;

  for (let i = 0; i < aiConfig.prompts.length; i++) {
    const currentPrompt = aiConfig.prompts[i];

    if (currentPrompt.name) {
      existingPromptNames.add(currentPrompt.name);
    }

    if (!previousPromptFound) {
      newPromptNumber++;
    }

    if (currentPrompt.name === previousPromptName) {
      previousPromptFound = true;
    }
  }

  let newPromptName = `${prefix}${newPromptNumber}`;

  // Make sure we have a unique prompt name. Increment the # if needed until we find one
  while (existingPromptNames.has(newPromptName)) {
    newPromptNumber++;
    newPromptName = `${prefix}${newPromptNumber}`;
  }

  return newPromptName;
}

// TODO: saqadri - should this function just take the prompt object as an input?
export function getPromptDependencies(
  promptTemplate: string,
  promptName: string,
  aiConfig: AIConfigRuntime
) {
  // This will contain the parameters referenced, as well as their specific sub-properties
  // We only care about top-level references, so object.keys would give us all root variables referenced.
  const parameterObj = getParametersInTemplate(promptTemplate);
  const parameterNames = new Set<string>(Object.keys(parameterObj));

  const dependencies = new Set<string>();
  for (let i = 0; i < aiConfig.prompts.length; i++) {
    const currentPrompt = aiConfig.prompts[i];
    if (currentPrompt.name === promptName) {
      // We only allow references to cells above the current cell to prevent cycles by design
      // TODO: saqadri - revisit this restriction in the future.
      break;
    }

    const currentPromptName = currentPrompt.name;
    if (!currentPromptName) {
      // Cells without named parameter cannot be referenced, so they cannot be a dependency
      continue;
    }

    if (parameterNames.has(currentPromptName)) {
      // Add the cell as a dependency
      dependencies.add(currentPromptName);

      // TODO: saqadri - technically, if I'm only referencing another cell's input, that cell isn't an execution dependency
      // If we want to be strict about execution dependencies, check if parameterObj[cellName].output = true
    }
  }

  return dependencies;
}

export type PromptNode = {
  id: string; // prompt name
  parents: Set<string>; // prompt names of the parents (i.e. dependencies) of this node
  children: Set<string>; // prompt names of the children (i.e. dependents) of this node
  visited: boolean;
};

function graphToObject(
  graph: Map<string, PromptNode>,
  promptsMap: Map<string, Prompt>
) {
  const graphObj: {
    [k in string]: {
      promptName: string;
      parents: string[];
      children: string[];
    };
  } = {};

  Array.from(graph.values()).forEach((node) => {
    const inputCell = promptsMap.get(node.id)!.input;
    const promptName = node.id;
    graphObj[node.id] = {
      promptName,
      parents: Array.from(node.parents.values()),
      children: Array.from(node.children.values()),
    };
  });

  console.log(`Dependency Graph=${JSON.stringify(graphObj)}`);
  return graphObj;
}

export function getDependencyGraph(
  aiConfig: AIConfigRuntime,
  promptName?: string
) {
  const graph = new Map<string, PromptNode>();
  const promptsMap = new Map<string, Prompt>();

  for (let i = 0; i < aiConfig.prompts.length; i++) {
    const currentPrompt = aiConfig.prompts[i];

    // If the prompt is the last one and it's empty (i.e. from auto-add after execution),
    // then skip it to prevent empty prompt errors
    // if (i === allCellGroups.length - 1 && cellGroup.input.data.prompt === "") {
    //   continue;
    // }

    promptsMap.set(currentPrompt.name, currentPrompt);

    graph.set(currentPrompt.name, {
      id: currentPrompt.name,
      parents: new Set<string>(),
      children: new Set<string>(),
      visited: false,
    });
  }

  if (promptName) {
    updateDependencyGraph(promptName, aiConfig, promptsMap, graph);
    const graphObj = graphToObject(graph, promptsMap);

    // return the single node for the requested prompt
    return {
      graph,
      graphObj,
      start: [graph.get(promptName)!],
    };
  } else {
    for (let i = 0; i < aiConfig.prompts.length; i++) {
      const currentPrompt = aiConfig.prompts[i];
      updateDependencyGraph(currentPrompt.name, aiConfig, promptsMap, graph);
    }

    // return the "roots" of the graph
    const roots: PromptNode[] = [];
    Array.from(graph.values()).forEach((node) => {
      if (node.parents.size === 0) {
        roots.push(node);
      }
    });

    const graphObj = graphToObject(graph, promptsMap);

    return {
      graph,
      graphObj,
      start: roots,
    };
  }
}

function updateDependencyGraph(
  promptName: string,
  aiConfig: AIConfigRuntime,
  promptsMap: Map<string, Prompt>,
  nodes: Map<string, PromptNode>
) {
  const prompt = promptsMap.get(promptName);
  if (prompt == null) {
    return;
  }

  const promptNode = nodes.get(promptName)!;
  if (promptNode.visited) {
    // If this node has already been processed, then no need to re-process it
    return;
  }

  // Set visited to true so we don't re-traverse from this node
  promptNode.visited = true;
  nodes.set(promptName, promptNode);

  let promptDependencies = new Set<string>();

  const promptTemplate = getPromptTemplate(prompt, aiConfig);
  if (promptTemplate) {
    promptDependencies = getPromptDependencies(
      promptTemplate,
      promptName,
      aiConfig
    );
  }

  const systemPromptTemplate = getSystemPromptTemplate(prompt, aiConfig);
  if (systemPromptTemplate) {
    const systemPromptDependencies = getPromptDependencies(
      systemPromptTemplate,
      promptName,
      aiConfig
    );

    systemPromptDependencies.forEach((id) => {
      promptDependencies.add(id);
    });
  }

  // Update the prompt's dependencies, and vice versa
  promptDependencies.forEach((id) => {
    promptNode.parents.add(id);

    const parentNode = nodes.get(id)!;
    parentNode.children.add(promptNode.id);
  });

  // Recurse up to the dependencies
  promptDependencies.forEach((id) =>
    updateDependencyGraph(id, aiConfig, promptsMap, nodes)
  );
}

export function resolvePromptReference(
  prompt: Prompt,
  aiConfig: AIConfigRuntime
) {
  const parameterName = prompt.name;
  if (!parameterName) {
    return null;
  }

  const input = getPromptTemplate(prompt, aiConfig);
  const outputText = aiConfig.getOutputText(prompt);

  return {
    [parameterName]: {
      input,
      output: outputText,
    },
  };
}

/**
 * Parameter name must start with a letter (a-z, A-Z) or an underscore (_). The rest of the
 * name can contain letters, digits (0-9), underscores, and dollar signs ($).
 */
export function isValidParameterName(name: string): boolean {
  const validNamePattern = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
  return validNamePattern.test(name);
}

/**
 * Returns an object with the parameters that are referenced in the given template.
 * Taken from https://github.com/handlebars-lang/handlebars.js/issues/1207#issuecomment-722588940
 *
 * For example, given this template:
 * ```
 * {{#with test}}
 * Previous question: {{input}}
 * Answer: {{output}}
 * {{/with}}
 * Tweet prompt: {{tweet_chapter.input}}
 * Tweet: {{tweet_chapter.output}}
 * ```
 * This function would return:
 * ```json
 * {
 *   "test": { "input": true, "output": true },
 *   "tweet_chapter": { "input": true, "output": true }
 * }
 * ```
 */
export function getParametersInTemplate(template: string) {
  const re = /{{[{]?(.*?)[}]?}}/g;
  const tags = [];
  let matches;
  while ((matches = re.exec(template)) != null) {
    tags.push(matches[1].trim());
  }
  const root = {};
  let context: any = root;
  const stack = [];
  const setVar = (variable: string, val: boolean) => {
    // Dot Notation Breakdown
    if (variable.match(/\.*\./) && !variable.match(/\s/)) {
      let notation = variable.split(".");
      set(context, notation, true);
    } else {
      context[variable.trim()] = val;
    }
  };
  for (let tag of tags) {
    if (tag.startsWith("! ")) {
      continue;
    }
    if (tag === "else") {
      continue;
    }
    if ("#^".includes(tag[0]) && !tag.includes(" ")) {
      setVar(tag.substring(1), true);
      stack.push(context);
      continue;
    }
    if (tag.startsWith("#if")) {
      const vars = tag.split(" ").slice(1);
      for (const v of vars) {
        setVar(v, true);
      }
      stack.push(context);
      continue;
    }
    if (tag.startsWith("/if")) {
      context = stack.pop();
      continue;
    }
    if (tag.startsWith("#with ")) {
      const v = tag.split(" ")[1];
      let newContext = {};
      context[v] = newContext;
      stack.push(context);
      context = newContext;
      continue;
    }
    if (tag.startsWith("/with")) {
      context = stack.pop();
      continue;
    }
    if (tag.startsWith("#unless ")) {
      const v = tag.split(" ")[1];
      setVar(v, true);
      stack.push(context);
      continue;
    }
    if (tag.startsWith("/unless")) {
      context = stack.pop();
      continue;
    }
    if (tag.startsWith("#each ")) {
      const v = tag.split(" ")[1];
      const newContext = {};
      context[v] = [newContext];
      stack.push(context);
      context = newContext;
      continue;
    }
    if (tag.startsWith("/each")) {
      context = stack.pop();
      continue;
    }
    if (tag.startsWith("/")) {
      context = stack.pop();
      continue;
    }
    setVar(tag, true);
  }

  return root;
}
