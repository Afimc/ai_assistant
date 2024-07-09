const { Storage } = require("@google-cloud/storage");
const { SpeechClient } = require('@google-cloud/speech');
const config = require('./config');
const path = require("path");
const fs = require('fs'); 

const storage = new Storage({keyFilename: config.JSON_key_file_path});
const client = new SpeechClient({ keyFilename: config.JSON_key_file_path });
const bucketName = config.bucketName;
const gcsUri = `gs://${config.bucketName}/`;


async function uploadFile(filePath) {
  try {
    // Upload the file to the specified bucket
    await storage.bucket(bucketName).upload(filePath, {
      destination: filePath,
    });

    console.log(`${filePath} uploaded to ${bucketName} as ${filePath}`);
  } catch (error) {
    console.error("ERROR:", error);
  }
}

async function transcribeAudio(audioName) {
  const request = {
    audio: {
      uri: gcsUri + audioName
    },
    config: {
      encoding: 'MP3',
      sampleRateHertz: 16000,
      languageCode: 'en-US', 
    },
  };

  try {
    const [operation] = await client.longRunningRecognize(request);
    console.log('Processing audio...');
    const [response] = await operation.promise();
    console.log('Transcription Results:');

    let transcript = '';
    response.results.forEach((result, index) => {
      // transcript += `\nTranscript ${index + 1}:\n`;
      result.alternatives.forEach((alternative, altIndex) => {
        transcript += ` ${alternative.transcript}\n`;
      });
    });
    
    const outputFilePath = path.join(__dirname, `${audioName}.txt`);
    fs.writeFileSync(outputFilePath, transcript);
    console.log(`Transcription for ${audioName} saved to ${outputFilePath}`);
  } catch (error) {
    console.error('Error during transcription:', error);
  }
}

async function transcriber() {
  const filesForUpload = ["audio.mp3", "audio1.mp3", "audio2.mp3"];
  for (const audioName of filesForUpload) {
    await uploadFile(audioName);
    await transcribeAudio(audioName);
  }
}

const res = transcriber();
