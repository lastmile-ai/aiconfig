import { createContext } from "react";
import { AIConfigEditorNotification } from "./NotificationProvider";

/**
 * Context for providing showNotification method throughout the editor
 */
const NotificationContext = createContext<{
  showNotification: (notification: AIConfigEditorNotification) => void;
}>({
  showNotification: () => {},
});

export default NotificationContext;
