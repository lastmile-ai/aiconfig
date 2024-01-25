// s3 file uris cannot have '+' character, so replace with '_'
function sanitizeFileName(name: string) {
  return name.replace(/[_+]/g, "_");
}

export function getTodayDateString(): string {
  const date = new Date();
  const dateString = `${date.getFullYear()}_${
    date.getMonth() + 1
  }_${date.getDate()}`;
  const timeString = `${date.getUTCHours()}_${date.getUTCMinutes()}_${date.getUTCSeconds()}`;
  return `${dateString}_${timeString}`;
}

// TODO: Make this configurable for external deployments
export async function uploadFileToS3(file: File): Promise<{ url: string }> {
  const randomPath = Math.round(Math.random() * 10000);
  // TODO: Add back once CORS is resolved
  // const policyResponse = await fetch(
  //   "https://lastmileai.dev/api/upload/publicpolicy"
  // );
  // const policy = await policyResponse.json();
  const uploadUrl = "https://s3.amazonaws.com/lastmileai.aiconfig.public/";
  const uploadKey = `uploads/${getTodayDateString()}/${randomPath}/${sanitizeFileName(
    file.name
  )}`;

  const formData = new FormData();
  formData.append("key", uploadKey);
  formData.append("acl", "public-read");
  formData.append("Content-Type", file.type);
  // formData.append("AWSAccessKeyId", policy.AWSAccessKeyId);
  formData.append("success_action_status", "201");
  // formData.append("Policy", policy.s3Policy);
  // formData.append("Signature", policy.s3Signature);
  formData.append("file", file);

  // See this about changing to use XMLHTTPRequest to show upload progress as well
  // https://medium.com/@cpatarun/tracking-file-upload-progress-to-amazon-s3-from-the-browser-71be6712c63d
  const rawRes = await fetch(uploadUrl, {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    body: formData,
    headers: {
      Authorization: "",
    },
  });

  if (rawRes.ok && rawRes.status === 201) {
    // Dont really need to parse xml s3 response, just use the keys, etc. that were passed
    return { url: `${uploadUrl}${uploadKey}` };
  } else {
    throw new Error("Error uploading to S3!");
  }
}
