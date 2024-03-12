import { Autocomplete, AutocompleteItem, Button } from "@mantine/core";
import { memo, useContext, useState } from "react";
import { getPromptModelName } from "../../utils/promptUtils";
import { Prompt } from "aiconfig";
import useLoadModels from "../../hooks/useLoadModels";
import { IconX } from "@tabler/icons-react";
import AIConfigContext from "../../contexts/AIConfigContext";

type Props = {
  prompt: Prompt;
  getModels?: (search?: string) => Promise<string[]>;
  onSetModel: (model?: string) => void;
  defaultConfigModelName?: string;
};

export default memo(function ModelSelector({
  prompt,
  getModels,
  onSetModel,
  defaultConfigModelName,
}: Props) {
  const { mode } = useContext(AIConfigContext);
  const { readOnly } = useContext(AIConfigContext);
  const [selectedModel, setSelectedModel] = useState<string | undefined>(
    getPromptModelName(prompt, defaultConfigModelName)
  );
  const [showAll, setShowAll] = useState(true);
  const [autocompleteSearch, setAutocompleteSearch] = useState(
    getPromptModelName(prompt, defaultConfigModelName)
  );

  const models = useLoadModels(
    getModels,
    showAll ? undefined : autocompleteSearch
  );

  const onSelectModel = (model?: string) => {
    setSelectedModel(model);
    onSetModel(model);
  };

  return (
    <Autocomplete
      placeholder={`Select ${mode === "gradio" ? "task" : "model"}`}
      limit={100}
      className="ghost"
      label={mode === "gradio" ? "Hugging Face Task" : "Model"}
      variant="unstyled"
      maxDropdownHeight={200}
      disabled={readOnly}
      rightSection={
        selectedModel ? (
          <Button
            size="xs"
            variant="subtle"
            className="ghost"
            mr={10}
            onClick={() => {
              onSelectModel(undefined);
              setShowAll(true);
              setAutocompleteSearch("");
            }}
          >
            <IconX size={10} />
          </Button>
        ) : null
      }
      filter={(searchValue: string, item: AutocompleteItem) => {
        if (showAll) {
          return true;
        }

        const modelName: string = item.value;
        return modelName
          .toLocaleLowerCase()
          .includes(searchValue.toLocaleLowerCase().trim());
      }}
      data={models}
      value={autocompleteSearch}
      onChange={(value: string) => {
        setAutocompleteSearch(value);
        setShowAll(false);
        onSelectModel(value);
        models.some((model) => {
          if (model === value) {
            setShowAll(true);
            return true;
          }
        });
      }}
    />
  );
});
