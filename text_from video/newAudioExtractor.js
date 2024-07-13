const { exec } = require("child_process");
const path = require("path");

async function downloadAudio(url, outputPath) {
  try {
    const output = path.join(outputPath, "audiofile.mp3");

    const command = `yt-dlp --extract-audio --audio-format mp3 --output "${output}" ${url}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error downloading audio: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }
      console.log(`Audio downloaded successfully to ${output}`);
    });
  } catch (error) {
    console.error("Error downloading audio:", error);
  }
}

const outputFilePath = "./";
downloadAudio(youtubeUrl, outputFilePath);
