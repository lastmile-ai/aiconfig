import { createContext } from "react";
import { ClientAIConfig } from "../shared/types";

/**
 * Context for overall editor config state. This context should
 * be memoized to prevent unnecessary re-renders
 */
const AIConfigContext = createContext<{
  getState: () => ClientAIConfig;
}>({
  getState: () => ({ prompts: [] }),
});

export default AIConfigContext;
