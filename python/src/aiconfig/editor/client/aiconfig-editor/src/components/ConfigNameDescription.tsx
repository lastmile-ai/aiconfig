import {
  createStyles,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useClickOutside } from "@mantine/hooks";
import { memo, useCallback, useContext, useRef, useState } from "react";
import AIConfigContext from "../contexts/AIConfigContext";

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
      if (event.key === "Enter") {
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
      setIsEditing(true);
      if (event.target === nameDisplayRef.current) {
        setInitialFocus("name");
      } else if (event.target === descriptionDisplayRef.current) {
        setInitialFocus("description");
      }
    },
    [readOnly]
  );

  return (
    <Stack
      ref={isEditing ? inputSectionRef : undefined}
      spacing="xs"
      w="100%"
      ml="1em"
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
            className={!readOnly ? classes.hoverContainer : undefined}
          >
            {name}
          </Title>
          <Text
            ref={descriptionDisplayRef}
            onClick={onClickEdit}
            style={{ whiteSpace: "pre-wrap" }}
            className={!readOnly ? classes.hoverContainer : undefined}
          >
            {description}
          </Text>
        </div>
      )}
    </Stack>
  );
});
