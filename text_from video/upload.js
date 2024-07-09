const { Storage } = require('@google-cloud/storage');
const path = require('path');
const config = require('./config');

const storage = new Storage({ keyFilename: config.JSON_key_file_path });

const bucketName = config.bucketName;
const filePath = 'audio.mp3'; 
const destFileName = 'audio.mp3'; 

async function uploadFile() {
  try {
    await storage.bucket(bucketName).upload(filePath, {
      destination: destFileName,
    });

    console.log(`${filePath} uploaded to ${bucketName} as ${destFileName}`);
  } catch (error) {
    console.error('ERROR:', error);
  }
}

uploadFile();
