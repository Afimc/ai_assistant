const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const ytdl = require("ytdl-core");
const config = require("./config");

const API_KEY = config.APIkey;
const youtube = google.youtube({
  version: "v3",
  auth: API_KEY,
});

async function getChannelIdByCustomUrl(url) {
  const response = await youtube.search.list({
    part: "snippet",
    q: url,
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

async function getChannelVideos(channelId, searchQuery = null) {
  const channelResponse = await youtube.channels.list({
    part: "contentDetails",
    id: channelId,
  });

  const uploadsPlaylistId =
    channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;

  let videos = [];
  let nextPageToken = null;

  do {
    const playlistResponse = await youtube.playlistItems.list({
      part: "snippet",
      playlistId: uploadsPlaylistId,
      maxResults: 50,
      pageToken: nextPageToken,
    });

    playlistResponse.data.items.forEach((item) => {
      const title = item.snippet.title;
      const videoId = item.snippet.resourceId.videoId;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

      if (searchQuery) {
        const regex = new RegExp(searchQuery, "i");
        if (regex.test(title)) {
          videos.push(videoUrl);
        }
      } else {
        videos.push(videoUrl);
      }
    });

    nextPageToken = playlistResponse.data.nextPageToken;
  } while (nextPageToken);

  return videos;
}

function downloadAudio(videoUrl) {
  const _audioName = videoUrl.replace("https://www.youtube.com/watch?v=", "");
  const audioName = _audioName + ".mp3";
  const tempFolder = "temp";
  const tempFolderPath = path.join(__dirname, tempFolder);
  if (!fs.existsSync(tempFolderPath)) fs.mkdirSync(tempFolderPath);
  const audioOutputPath = path.join(tempFolderPath, audioName);

  ytdl(videoUrl, { quality: "highestaudio" })
    .pipe(fs.createWriteStream(audioOutputPath))
    .on("finish", () => {
      console.log("Audio extraction completed.");
    })
    .on("error", (err) => {
      console.error("Error during audio extraction:", err);
    });
  // try {
  //     console.log({ videoUrl });
  //   ytdl(videoUrl, { quality: "highestaudio"})
  //   .pipe(fs.createWriteStream(audioOutputPath))
  //   .on("finish", () => {
  //     console.log("Audio extraction completed.");
  //     resolve(true);
  //   })
  //   .on("error", (err) => {
  //     console.log("Error during audio extraction:", err);
  //     reject(false);
  //   })
  //   .on('unpipe',()=>{console.log('unp')})

  // } catch (error) {
  //   console.log(error);
  //   reject(false);
  // }
}

async function final(url) {
  const channelID = await getChannelIdByCustomUrl(url);
  console.log({ channelID });
  const videoUrlArrey = await getChannelVideos(channelID);
  console.log({ videoUrlArrey });
  for (let i = 0; i < videoUrlArrey.length; i++) {
    const videoUrl = videoUrlArrey[i];
    downloadAudio(videoUrl);
  }
}

const channelUrl = "@Kostadin.official";

final(channelUrl);
