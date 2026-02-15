import {
  Notifications,
  showNotification as mantineShowNotification,
} from "@mantine/notifications";
import { useCallback, useMemo } from "react";
import NotificationContext from "./NotificationContext";

export type AIConfigEditorNotificationType =
  | "info"
  | "success"
  | "warning"
  | "error";

export type AIConfigEditorNotification = {
  title: string;
  message: string | null;
  type?: AIConfigEditorNotificationType;
  autoClose?: boolean | number;
  onClose?: () => void;
  onOpen?: () => void;
};

type Props = {
  children: React.ReactNode;
  showNotification?: (notification: AIConfigEditorNotification) => void;
};

const NOTIFICATION_TYPE_COLOR = {
  info: "blue",
  success: "green",
  warning: "yellow",
  error: "red",
};

export default function NotificationProvider({
  children,
  showNotification: overrideShowNotification,
}: Props) {
  const defaultShowNotification = useCallback(
    (notification: AIConfigEditorNotification) =>
      mantineShowNotification({
        ...notification,
        color: NOTIFICATION_TYPE_COLOR[notification.type ?? "info"],
      }),
    []
  );

  const notificationContext = useMemo(
    () => ({
      showNotification: overrideShowNotification ?? defaultShowNotification,
    }),
    [defaultShowNotification, overrideShowNotification]
  );

  return (
    <NotificationContext.Provider value={notificationContext}>
      {!overrideShowNotification && <Notifications />}
      {children}
    </NotificationContext.Provider>
  );
}
