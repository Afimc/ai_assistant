const { exec } = require("child_process");
const path = require("path");

async function downloadAudio(url, outputPath) {

  const baseName = url.replace('https://www.youtube.com/watch?v=', '');
  const audioFile = baseName + '.mp3';
  try {
    const output = path.join(outputPath, audioFile);
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
const tempFolder = 'temp2';
const outputFilePath = path.join(__dirname, tempFolder);
downloadAudio('https://www.youtube.com/watch?v=MpPar8dHWk8', outputFilePath);
