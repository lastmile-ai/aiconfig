import { Autocomplete, AutocompleteItem, Button, Flex } from "@mantine/core";
import { memo, useMemo, useState } from "react";
import { getPromptModelName } from "../../utils/promptUtils";
import { Prompt } from "aiconfig";
import useLoadModels from "../../hooks/useLoadModels";
import { IconX } from "@tabler/icons-react";
import { Model } from "../../shared/types";
import useLoadModelParsers from "../../hooks/useLoadModelParsers";

type Props = {
  prompt: Prompt;
  getModels: (search?: string) => Promise<Model[]>;
  getModelParsers: (search?: string) => Promise<string[]>;
  onSetModel: (model?: string) => void;
  defaultConfigModelName?: string;
};

export default memo(function ModelSelector({
  prompt,
  getModels,
  getModelParsers,
  onSetModel,
  defaultConfigModelName,
}: Props) {
  const [selectedModel, setSelectedModel] = useState<string | undefined>(
    getPromptModelName(prompt, defaultConfigModelName)
  );
  const [showAllModels, setShowAllModels] = useState(true);
  const [autocompleteModelSearch, setAutocompleteModelSearch] = useState(
    getPromptModelName(prompt, defaultConfigModelName)
  );

  const [selectedModelParser, setSelectedModelParser] = useState<
    string | undefined
  >();
  const [showAllParsers, setShowAllParsers] = useState(true);
  const [autocompleteParserSearch, setAutocompleteParserSearch] = useState<
    string | undefined
  >();

  const models = useLoadModels(
    showAllModels ? "" : autocompleteModelSearch ?? "",
    getModels
  );

  const parsers = useLoadModelParsers(
    showAllParsers ? "" : autocompleteParserSearch ?? "",
    getModelParsers
  );

  // Set model parser if selectedModel has associated parser and parser is not set
  if (!selectedModelParser && selectedModel) {
    models.some((model) => {
      if (model.id === selectedModel) {
        setSelectedModelParser(model.parser_id);
        setAutocompleteParserSearch(model.parser_id);
        return true;
      }
    });
  }

  const modelNames = useMemo(() => models.map((model) => model.id), [models]);

  const onSelectModel = (model?: string) => {
    setSelectedModel(model);
    onSetModel(model);
  };

  return (
    <Flex>
      <Autocomplete
        placeholder="Select model parser"
        limit={100}
        className="ghost"
        variant="unstyled"
        maxDropdownHeight={200}
        error={
          autocompleteParserSearch &&
          !parsers.includes(autocompleteParserSearch)
            ? "Invalid model parser"
            : null
        }
        rightSection={
          selectedModelParser ? (
            <Button
              size="xs"
              variant="subtle"
              className="ghost"
              mr={10}
              onClick={() => {
                setSelectedModelParser(undefined);
                setShowAllParsers(true);
                setAutocompleteParserSearch("");
              }}
            >
              <IconX size={10} />
            </Button>
          ) : null
        }
        filter={(searchValue: string, item: AutocompleteItem) => {
          if (showAllParsers) {
            return true;
          }

          const parserId: string = item.value;
          return parserId
            .toLocaleLowerCase()
            .includes(searchValue.toLocaleLowerCase().trim());
        }}
        data={parsers}
        value={autocompleteParserSearch}
        onChange={(value: string) => {
          setAutocompleteParserSearch(value);
          setShowAllParsers(false);
          parsers.some((id) => {
            if (id === value) {
              setShowAllParsers(true);
              setSelectedModelParser(value);
              return true;
            }
          });
        }}
      />
      <Autocomplete
        placeholder="Select model"
        limit={100}
        className="ghost"
        variant="unstyled"
        maxDropdownHeight={200}
        rightSection={
          selectedModel ? (
            <Button
              size="xs"
              variant="subtle"
              className="ghost"
              mr={10}
              onClick={() => {
                onSelectModel(undefined);
                setShowAllModels(true);
                setAutocompleteModelSearch("");
              }}
            >
              <IconX size={10} />
            </Button>
          ) : null
        }
        filter={(searchValue: string, item: AutocompleteItem) => {
          if (showAllModels) {
            return true;
          }

          const modelName: string = item.value;
          return modelName
            .toLocaleLowerCase()
            .includes(searchValue.toLocaleLowerCase().trim());
        }}
        data={modelNames}
        value={autocompleteModelSearch}
        onChange={(value: string) => {
          setAutocompleteModelSearch(value);
          setShowAllModels(false);
          onSelectModel(value);
          modelNames.some((model) => {
            if (model === value) {
              setShowAllModels(true);
              return true;
            }
          });
        }}
      />
    </Flex>
  );
});
