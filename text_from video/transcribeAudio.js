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
    await storage.bucket(bucketName).upload(filePath, {
      destination: filePath,
    });

    console.log(`${filePath} uploaded to ${bucketName} as ${filePath}`);
  } catch (error) {
    console.error("ERROR:", error);
  }
}

async function transcribeAudio(filePath) {
  const audioName = path.basename(filePath); 
  const baseName = path.parse(audioName).name; 

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
    response.results.forEach((result) => {
      result.alternatives.forEach((alternative) => {
        transcript += ` ${alternative.transcript}\n`;
      });
    });
    
    const outputFilePath = path.join(__dirname, 'temp',`${baseName}.txt`);
    fs.writeFileSync(outputFilePath, transcript);
    console.log(`Transcription for ${audioName} saved to ${outputFilePath}`);
  } catch (error) {
    console.error('Error during transcription:', error);
  }
}


async function transcriber() {
  const filesForUpload = ["./temp/audio.mp3", "./temp/audio1.mp3", "./temp/audio2.mp3"];
  for (const filePath of filesForUpload) {
    await uploadFile(filePath);
    await transcribeAudio(filePath);
  }
}


const res = transcriber();
