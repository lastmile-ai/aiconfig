import {
  Notifications,
  showNotification as mantineShowNotification,
} from "@mantine/notifications";
import { useMemo } from "react";
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
  showNotification,
}: Props) {
  const notificationContext = useMemo(
    () => ({
      showNotification:
        showNotification ??
        ((notification: AIConfigEditorNotification) =>
          mantineShowNotification({
            ...notification,
            color: NOTIFICATION_TYPE_COLOR[notification.type ?? "info"],
          })),
    }),
    [showNotification]
  );

  return (
    <NotificationContext.Provider value={notificationContext}>
      {!showNotification && <Notifications />}
      {children}
    </NotificationContext.Provider>
  );
}
