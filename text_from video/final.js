const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const ytdl = require("ytdl-core");
const config = require("./config");
const { exec } = require("child_process");
const { Storage } = require("@google-cloud/storage");
const { SpeechClient } = require("@google-cloud/speech");

const storage = new Storage({ keyFilename: config.JSON_key_file_path });
const bucketName = config.bucketName;
const API_KEY = config.APIkey;
const client = new SpeechClient({ keyFilename: config.JSON_key_file_path });
const gcsUri = `gs://${bucketName}/`;
const youtube = google.youtube({
  version: "v3",
  auth: API_KEY,
});

async function getChannelIdByCustomUrl(url) {
  try {
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
  } catch (error) {
    console.error("Error fetching channel ID:", error);
    throw error;
  }
}

async function getChannelVideos(channelId, searchQuery = null) {
  try {
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
  } catch (error) {
    console.error("Error fetching channel videos:", error);
    throw error;
  }
}

async function downloadAudio(videoUrl) {
  const _audioName = videoUrl.replace("https://www.youtube.com/watch?v=", "");
  const audioName = _audioName + ".mp3";
  const tempFolder = "temp";
  const tempFolderPath = path.join(__dirname, tempFolder);

  if (!fs.existsSync(tempFolderPath)) {
    fs.mkdirSync(tempFolderPath);
  }

  const audioOutputPath = path.join(tempFolderPath, audioName);

  return new Promise((resolve, reject) => {
    const command = `yt-dlp --extract-audio --audio-format mp3 --output "${audioOutputPath}" ${videoUrl}`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error downloading audio: ${error.message}`);
        reject(error);
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        reject(new Error(stderr));
      }
      console.log(`Audio downloaded successfully to ${audioOutputPath}`);
      resolve(audioOutputPath);
    });
  });
}

async function uploadFile(filePath) {
  const audioName = path.basename(filePath);
  try {
    await storage.bucket(bucketName).upload(filePath, {
      destination: audioName,
    });
    console.log(`${filePath} uploaded to ${bucketName} as ${audioName}`);
    return audioName;
  } catch (error) {
    console.error("ERROR:", error);
    throw error;
  }
}

async function uploadAllFilesInTempFolder() {
  const tempFolderPath = path.join(__dirname, "temp");

  try {
    const files = fs.readdirSync(tempFolderPath);
    const uploadPromises = files.map((file) => {
      const filePath = path.join(tempFolderPath, file);
      return uploadFile(filePath);
    });

    const uploadedFiles = await Promise.all(uploadPromises);
    return uploadedFiles;
  } catch (error) {
    console.error("Error uploading files:", error);
    return [];
  }
}

async function transcribeAudio(fileName) {
  const request = {
    audio: {
      uri: `${gcsUri}${fileName}`,
    },
    config: {
      encoding: "MP3",
      sampleRateHertz: 16000,
      languageCode: "en-US",
    },
  };

  try {
    const [operation] = await client.longRunningRecognize(request);
    console.log("Processing audio...");
    const [response] = await operation.promise();
    console.log("Transcription Results:");

    let transcript = "";
    response.results.forEach((result) => {
      result.alternatives.forEach((alternative) => {
        transcript += ` ${alternative.transcript}\n`;
      });
    });

    const outputFilePath = path.join(
      __dirname,
      "temp",
      `${path.parse(fileName).name}.txt`
    );
    fs.writeFileSync(outputFilePath, transcript);
    console.log(`Transcription for ${fileName} saved to ${outputFilePath}`);
  } catch (error) {
    console.error("Error during transcription:", error);
  }
}

async function final(url) {
  try {
    const channelID = await getChannelIdByCustomUrl(url);
    console.log({ channelID });
    const videoUrlArray = await getChannelVideos(channelID);
    console.log({ videoUrlArray });

    const downloadedFiles = [];
    for (const videoUrl of videoUrlArray) {
      const audioPath = await downloadAudio(videoUrl);
      downloadedFiles.push(audioPath);
    }

    const uploadedFiles = await uploadAllFilesInTempFolder();
    console.log({ uploadedFiles });

    if (Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
      for (const fileName of uploadedFiles) {
        await transcribeAudio(fileName);
      }
    } else {
      console.error("Uploaded files list is not an array or is empty");
    }
  } catch (error) {
    console.error("Error in final function:", error);
  }
}

const channelUrl = "@Kostadin.official";
final(channelUrl);
