const { Storage } = require("@google-cloud/storage");
const { SpeechClient } = require('@google-cloud/speech');
const { exec, execSync} = require("child_process");
const config = require('./config');
const path = require("path");
const fs = require('fs'); 
const { file } = require("googleapis/build/src/apis/file");

const storage = new Storage({keyFilename: config.JSON_key_file_path});
const client = new SpeechClient({ keyFilename: config.JSON_key_file_path });
const bucketName = config.bucketName;
const gcsUri = `gs://${config.bucketName}/`;
const tempFolder = 'temp2';


async function downloadAudio(url, outputPath) {

  const baseName = url.replace('https://www.youtube.com/watch?v=', '');
  const audioFile = baseName + '.mp3';
  try {
    const output = path.join(outputPath, audioFile);
    const command = `yt-dlp --extract-audio --audio-format mp3 --output "${output}" ${url}`;
    execSync(command);
    console.log(`Audio downloaded successfully to ${output}`);

    // exec(command, (error, stdout, stderr) => {
    //   if (error) {
    //     console.error(`Error downloading audio: ${error.message}`);
    //     return;
    //   }
    //   if (stderr) {
    //     console.error(`stderr: ${stderr}`);
    //     return;
    //   }
    //   console.log(`Audio downloaded successfully to ${output}`);
    // });
  } catch (error) {
    console.error("Error downloading audio:", error);
  }
  return audioFile;
}


async function uploadFile(filePath) {
  try {
    const audioName = path.basename(filePath);
    const options = {destination: audioName};
    await storage.bucket(bucketName).upload(filePath, options);
    console.log(`${audioName} uploaded to ${bucketName}`);
  } catch (error) {
    console.error("ERROR:", error);
  }
}

async function transcribeAudio(filePath) {
  const audioFile = path.basename(filePath); 
  const baseName = path.parse(audioFile).name; 
  const request = {
    audio: {
      uri: gcsUri + audioFile
    },
    config: {
      encoding: 'MP3',
      sampleRateHertz: 16000,
      languageCode: 'en-US', 
    },
  };

  try {
    console.log('Processing audio...');
    const [operation] = await client.longRunningRecognize(request);
    const [response] = await operation.promise();

    let transcript = '';
    response.results.forEach((result) => {
      result.alternatives.forEach((alternative) => {
        transcript += ` ${alternative.transcript}\n`;
      });
    });
    
    const outputFilePath = path.join(__dirname, tempFolder,`${baseName}.txt`);
    fs.writeFileSync(outputFilePath, transcript);
    console.log(`Transcription for ${audioFile} saved to ${outputFilePath}`);
  } catch (error) {
    console.error('Error during transcription:', error);
  }
}

async function transcriber(urls) {
  const outputFilePath = path.join(__dirname, tempFolder);
  const filesForUpload = [];
  for (const url of urls){
    const name = await downloadAudio(url ,outputFilePath);
    filesForUpload.push(name);
  }
  for (const fileName of filesForUpload) {
    const filePath = path.join(__dirname, tempFolder, fileName)
    await uploadFile(filePath);
    await transcribeAudio(filePath);
  }
}
urls=['https://www.youtube.com/watch?v=3XOFY6mev3A'];
transcriber(urls);




// function Test (name, testFunction){

// for (let i = 0; i < 10; i++) {
//   if(i===5){
//     testFunction('test',i)
//   }
  
// }

// }

// Test("miro",(a,b)=>{console.log(a,b)})