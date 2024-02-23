import { createContext } from "react";
import { AIConfigEditorNotification } from "./NotificationProvider";

/**
 * Context for providing showNotification method throughout the editor. For example,
 * for VS Code extension we want to re-use VS Code's notification framework instead of
 * using the default (mantine) -- set in context with the `showNotification` callback
 * provided to AIConfigEditor.
 */
const NotificationContext = createContext<{
  showNotification: (notification: AIConfigEditorNotification) => void;
}>({
  showNotification: () => {},
});

export default NotificationContext;
