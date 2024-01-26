import { Button, Tooltip } from "@mantine/core";
import { memo, useContext } from "react";
import { AIConfig } from "aiconfig";
import AIConfigContext from "../../contexts/AIConfigContext";
import { ClientAIConfig } from "../../shared/types";
import { convertClientAIConfigToAIConfig } from "../../utils/aiconfigStateUtils";
import { uploadFileToS3 } from "../../utils/uploadFileToS3";

export default memo(function ShareButton() {
  const { getState } = useContext(AIConfigContext);
  const clientConfig: ClientAIConfig = getState();
  const config: AIConfig = convertClientAIConfigToAIConfig(clientConfig);

  const configString = JSON.stringify(config, (_key, value) => value, 2);
  const filename: string = `${config.name}.aiconfig.json`;
  const file = new File([configString], filename, { type: "application/json" });

  const onClick = async () => {
    // TODO: While uploading, show a loader state
    const upload = await uploadFileToS3(file);
    console.log("Upload URL: ", upload.url);

    // TODO: Use the S3 URL to upload to lastmile API endpoint, using mode prop and sourceURL
    // TODO: Implement dialog that opens with lastmile API URL for user to copy paste
  };

  return (
    <Tooltip label={"Create a link to share your AIConfig!"}>
      <Button loading={undefined} onClick={onClick} size="xs" variant="filled">
        Share
      </Button>
    </Tooltip>
  );
});
