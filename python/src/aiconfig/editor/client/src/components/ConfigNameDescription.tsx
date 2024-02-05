import { createStyles, Stack, Textarea, TextInput, Title } from "@mantine/core";
import { useClickOutside } from "@mantine/hooks";
import { memo, useCallback, useContext, useRef, useState } from "react";
import AIConfigContext from "../contexts/AIConfigContext";
import { TextRenderer } from "./prompt/TextRenderer";
import { PROMPT_CELL_LEFT_MARGIN_PX } from "../utils/constants";

type Props = {
  name?: string;
  description?: string | null;
  setDescription: (description: string) => void;
  setName: (name: string) => void;
};

const useStyles = createStyles((theme) => ({
  // Match name input style to corresponding Title element styles
  // See https://github.com/mantinedev/mantine/blob/master/src/mantine-core/src/Title/Title.styles.ts
  nameInput: {
    ...theme.fn.fontStyles(),
    fontFamily: theme.headings.fontFamily,
    fontWeight: theme.headings.fontWeight as number,
    fontSize: theme.headings.sizes.h1.fontSize,
    lineHeight: theme.headings.sizes.h1.lineHeight,
    width: "-webkit-fill-available",
    letterSpacing: "-1px",
    height: "44px",
  },
  hoverContainer: {
    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? "rgba(255, 255, 255, 0.1)"
          : theme.colors.gray[1],
    },
    borderRadius: theme.radius.sm,
    width: "-webkit-fill-available",
  },
}));

function isClickableChildElement(element: EventTarget | null) {
  // Specifically handle markdown links and prism code copy svg elements
  return element instanceof HTMLAnchorElement || element instanceof SVGElement;
}

export default memo(function ConfigNameDescription({
  name,
  description,
  setDescription,
  setName,
}: Props) {
  const { readOnly } = useContext(AIConfigContext);
  const { classes } = useStyles();

  const [isEditing, setIsEditing] = useState(!name);
  const [initialFocus, setInitialFocus] = useState<
    "name" | "description" | null
  >("name");

  const nameDisplayRef = useRef<HTMLHeadingElement | null>(null);
  const descriptionDisplayRef = useRef<HTMLDivElement | null>(null);

  const inputSectionRef = useClickOutside(() => {
    if (name) {
      setIsEditing(false);
    }
  });

  const onHandleEnter = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        // Shift+Enter to add new line
        event.stopPropagation();
        setIsEditing(false);
      }
    },
    []
  );

  const onClickEdit = useCallback(
    (event: React.MouseEvent<HTMLHeadingElement | HTMLDivElement>) => {
      if (readOnly) {
        return;
      }

      if (event.currentTarget === nameDisplayRef.current) {
        setInitialFocus("name");
        setIsEditing(true);
      } else if (
        event.currentTarget === descriptionDisplayRef.current &&
        !isClickableChildElement(event.target)
      ) {
        setInitialFocus("description");
        setIsEditing(true);
      }
    },
    [readOnly]
  );

  return (
    <Stack
      ref={isEditing ? inputSectionRef : undefined}
      spacing="xs"
      ml={readOnly ? "auto" : PROMPT_CELL_LEFT_MARGIN_PX}
      mr="0.5em"
    >
      {isEditing ? (
        <>
          <TextInput
            classNames={{ input: classes.nameInput }}
            placeholder={"Config name"}
            value={name}
            onKeyDown={onHandleEnter}
            autoFocus={initialFocus === "name"}
            onChange={(e) => setName(e.currentTarget.value)}
          />
          <Textarea
            placeholder="Config description"
            value={description ?? undefined}
            onKeyDown={onHandleEnter}
            autoFocus={initialFocus === "description"}
            onChange={(e) => setDescription(e.currentTarget.value)}
            autosize
            minRows={2}
          />
        </>
      ) : (
        <div>
          <Title
            ref={nameDisplayRef}
            onClick={onClickEdit}
            className={
              !readOnly ? `${classes.hoverContainer} hoverContainer` : undefined
            }
          >
            {name}
          </Title>
          {description && (
            <div
              ref={descriptionDisplayRef}
              onClick={onClickEdit}
              className={
                !readOnly
                  ? `${classes.hoverContainer} hoverContainer`
                  : undefined
              }
            >
              <TextRenderer content={description} />
            </div>
          )}
        </div>
      )}
    </Stack>
  );
});
