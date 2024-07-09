const { google } = require("googleapis");
const config = require("./config");

const API_KEY = config.APIkey;

async function getChannelVideos(channelId, searchQuery = null) {
  const youtube = google.youtube({
    version: "v3",
    auth: API_KEY,
  });

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

// Example usage:
const channelId = "UCe_Vt7z-8Aojewpry8xL5aA";
const searchQuery = null;

getChannelVideos(channelId, searchQuery)
  .then((videos) => {
    console.log("Videos found:");
    videos.forEach((video) => {
      console.log(video);
    });
  })
  .catch((error) => {
    console.error("Error retrieving videos:", error);
  });
