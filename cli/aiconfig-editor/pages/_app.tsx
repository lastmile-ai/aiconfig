import type { AppProps } from "next/app";

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { useColorScheme } from "@mantine/hooks";

export default function App({ Component, pageProps }: AppProps) {
  const preferredColorScheme = useColorScheme();

  return (
    <MantineProvider
      withGlobalStyles
      withNormalizeCSS
      theme={{ colorScheme: preferredColorScheme }}
    >
      <Notifications />
      <Component {...pageProps} />
    </MantineProvider>
  );
}
