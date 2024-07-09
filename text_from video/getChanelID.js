const { google } = require("googleapis");
const config = require("./config");

const API_KEY = config.APIkey;

async function getChannelIdByCustomUrl(customUrl) {
  console.log("start");
  const youtube = google.youtube({
    version: "v3",
    auth: API_KEY,
  });

  const response = await youtube.search.list({
    part: "snippet",
    q: customUrl,
    type: "channel",
    maxResults: 1,
  });

  if (response.data.items.length > 0) {
    const channelId = response.data.items[0].id.channelId;
    return channelId;
  } else {
    throw new Error("Channel not found");
  }
}

// Example usage with custom URL:
const customUrl = "@Kostadin.official";
getChannelIdByCustomUrl(customUrl)
  .then((channelId) => {
    console.log("Channel ID:", channelId);
  })
  .catch((error) => {
    console.error("Error retrieving Channel ID:", error);
  });
