import { memo, useState } from "react";
import {
  Anchor,
  Button,
  Flex,
  HoverCard,
  Text,
  TextInput,
  createStyles,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

type Props = {
  onSetToken: (apiToken: string) => Promise<void>;
};

const useStyles = createStyles((theme) => ({
  // Override gradio styles, using original mantine border styles
  hoverCard: {
    border: `0.0625rem solid ${
      theme.colorScheme === "light" ? "#e9ecef" : "#373A40"
    } !important`,
  },
  // Override gradio styles, using original mantine link styles
  link: {
    color: `${
      theme.colorScheme === "dark" ? theme.colors.blue[4] : theme.primaryColor
    } !important`,
  },
}));

function isValidToken(tokenInput: string) {
  return tokenInput.startsWith("hf_");
}

function getValidationMessage(tokenInput: string) {
  if (tokenInput.length > 0 && !isValidToken(tokenInput)) {
    return "Invalid token. Tokens must begin with hf_";
  }

  return null;
}

export default memo(function APITokenInput(props: Props) {
  // Token submitted to callback. Use this state for managing the 'clear token' flow
  const [submittedToken, setSubmittedToken] = useState<string>("");
  // Literal value in input
  const [tokenInput, setTokenInput] = useState<string>("");

  const onSetToken = async () => {
    if (tokenInput.length > 0 && !isValidToken(tokenInput)) {
      return;
    }

    await props.onSetToken(tokenInput);
    setSubmittedToken(tokenInput);
  };

  const { classes } = useStyles();

  return (
    <Flex align="center" justify="flex-end" gap="sm">
      <TextInput
        className="hfTokenInput"
        placeholder="Enter your HF Token"
        type="password"
        value={tokenInput}
        onChange={(e) => setTokenInput(e.currentTarget.value)}
        error={getValidationMessage(tokenInput)}
        rightSection={
          // Delay so it's not shown when quickly moving mouse from input to button
          <HoverCard openDelay={300} withArrow>
            <HoverCard.Target>
              <IconInfoCircle size={16} />
            </HoverCard.Target>
            <HoverCard.Dropdown className={classes.hoverCard}>
              <Text size="sm">
                <Anchor
                  href="https://huggingface.co/settings/tokens"
                  target="_blank"
                  className={classes.link}
                >
                  Hugging Face API token
                </Anchor>{" "}
                used for model inference
              </Text>
            </HoverCard.Dropdown>
          </HoverCard>
        }
      />
      <Button
        onClick={onSetToken}
        disabled={
          // Allow clearing token (set to empty after previously submitting a token)
          (tokenInput.length === 0 && submittedToken.length === 0) ||
          (tokenInput.length > 0 && !isValidToken(tokenInput))
        }
      >
        Set HF Token
      </Button>
    </Flex>
  );
});
