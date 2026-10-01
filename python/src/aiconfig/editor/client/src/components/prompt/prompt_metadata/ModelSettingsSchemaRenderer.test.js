import React from "react";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import ModelSettingsSchemaRenderer from "./PromptMetadataSchemaRenderer";
import { DEBOUNCE_MS } from "../../../utils/constants";

describe("ModelSettingsSchemaRenderer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("preserves rapid edits to separate settings fields", () => {
    const initialMetadata = { left: "old-left", right: "old-right" };
    const onUpdatePromptMetadata = jest.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <MantineProvider>
          <ModelSettingsSchemaRenderer
            schema={{
              type: "object",
              properties: {
                left: { type: "string" },
                right: { type: "string" },
              },
            }}
            metadata={initialMetadata}
            onUpdatePromptMetadata={onUpdatePromptMetadata}
          />
        </MantineProvider>
      );
    });

    const fields = container.querySelectorAll("textarea");
    expect(fields).toHaveLength(2);

    const changeField = (field, value) => {
      act(() => {
        const valueSetter = Object.getOwnPropertyDescriptor(
          HTMLTextAreaElement.prototype,
          "value"
        ).set;
        valueSetter.call(field, value);
        field.dispatchEvent(new Event("input", { bubbles: true }));
      });
    };

    changeField(fields[0], "new-left");
    changeField(fields[1], "new-right");

    act(() => {
      jest.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(onUpdatePromptMetadata).toHaveBeenCalledWith({
      left: "new-left",
      right: "new-right",
    });

    act(() => root.unmount());
    container.remove();
  });
});
