const { SpeechClient } = require("@google-cloud/speech");
const config = require("./config");

const client = new SpeechClient({ keyFilename: config.JSON_key_file_path });
const gcsUri = `gs://${config.bucketName}/audio.mp3`;
const request = {
  audio: {
    uri: gcsUri,
  },
  config: {
    encoding: "MP3", // Specify the audio encoding (e.g., MP3, LINEAR16, FLAC)
    sampleRateHertz: 16000, // Specify the sample rate in Hz (adjust if necessary)
    languageCode: "en-US", // Specify the language of the audio
  },
};

async function transcribeAudio() {
  try {
    const [operation] = await client.longRunningRecognize(request);
    console.log("Processing audio...");
    const [response] = await operation.promise();
    console.log("Transcription Results:");

    response.results.forEach((result, index) => {
      console.log(`\nTranscript ${index + 1}:`);
      result.alternatives.forEach((alternative, altIndex) => {
        console.log(`Alternative ${altIndex + 1}: ${alternative.transcript}`);
      });
    });
  } catch (error) {
    console.error("Error during transcription:", error);
  }
}

transcribeAudio();
