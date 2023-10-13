export function getAPIKeyFromEnv(apiKeyName: string) {
  const apiKeyValue = process.env[apiKeyName];
  if (!apiKeyValue) {
    throw new Error(`Missing API key ${apiKeyName} in environment`);
  }
  return apiKeyValue;
}
