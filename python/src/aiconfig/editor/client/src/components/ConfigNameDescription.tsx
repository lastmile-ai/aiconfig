import {
  createStyles,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useClickOutside } from "@mantine/hooks";
import { ChangeEvent, memo, useCallback, useRef, useState } from "react";

type Props = {
  name?: string;
  description?: string | null;
  setNameDescription: (val: {
    name?: string;
    description?: string | null;
  }) => void;
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

export default memo(function ConfigTitleDescription({
  name,
  description,
  setNameDescription,
}: Props) {
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
      setIsEditing(true);
      if (event.target === nameDisplayRef.current) {
        setInitialFocus("name");
      } else if (event.target === descriptionDisplayRef.current) {
        setInitialFocus("description");
      }
    },
    []
  );

  const setName = (e: ChangeEvent<HTMLInputElement>) => {
    setNameDescription({ name: e.target.value });
  };

  const setDescription = (e: ChangeEvent<HTMLTextAreaElement>) => {
    // If description is empty, set it to null; it will be removed from the config
    setNameDescription({ description: e.target.value || null });
  };

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
            onChange={setName}
          />
          <Textarea
            placeholder="Config description"
            value={description ?? undefined}
            onKeyDown={onHandleEnter}
            autoFocus={initialFocus === "description"}
            onChange={setDescription}
            autosize
            minRows={2}
          />
        </>
      ) : (
        <div>
          <Title
            ref={nameDisplayRef}
            onClick={onClickEdit}
            className={classes.hoverContainer}
          >
            {name}
          </Title>
          <Text
            ref={descriptionDisplayRef}
            onClick={onClickEdit}
            style={{ whiteSpace: "pre-wrap" }}
            className={classes.hoverContainer}
          >
            {description}
          </Text>
        </div>
      )}
    </Stack>
  );
});
