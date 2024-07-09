const fs = require('fs');
const ytdl = require('ytdl-core');

const videoUrl = 'https://www.youtube.com/watch?v=zAPDWD4tp_o';
const audioOutput = 'audio2.mp3';

ytdl(videoUrl, { quality: 'highestaudio' })
  .pipe(fs.createWriteStream(audioOutput))
  .on('finish', () => {
    console.log('Audio extraction completed.');
  })
  .on('error', (err) => {
    console.error('Error during audio extraction:', err);
  });


