const fs = require('fs');
const md = require('node-id3');

const dir = 'C:/Users/Elena/Downloads/2002 Songs About Jane/';

var files = fs.readdirSync(dir);
files.filter(f => f.match(/.+/i))
    .forEach(file => {
      let path = dir + file;
      let meta = md.read(path);
      if (meta) {
        updateMetadata(meta, path);
        // updateFilename(meta, path);
      }
    });

function updateMetadata(meta, path) {
  if (needsToUpdateMD(meta)) {
    console.log('updating metadata - ', path);
    meta.title = setFirstUpperCase(meta.title);
    meta.album = setFirstUpperCase(meta.album);
    meta.comment = { text: '' };
    meta.performerInfo = '';
    // console.log(meta);
    // console.log('---------------------');

    let success = md.update(meta, path);
    console.log(success ? 'updated' : 'error', '-', path);
  } else {
    console.log('metadata up to date - ', path);
  }
}

// function updateFilename(meta, file) {
//   if (needsToUpdateFN(meta, file)) {
//     fs.existsSync(path)
//   }
// }

function needsToUpdateMD(meta) {
return !!(!isFirstUpperCase(meta.title) ||
     !isFirstUpperCase(meta.album) ||
     (meta.comment && meta.comment.text) ||
     meta.performerInfo);
}

// function needsToUpdateFN(meta, file) {
// let actualName = file.substring(0, file.lastIndexOf('.'));
// let desiredName = `${meta.artist} - ${meta.title}`;
// console.log('       ', actualName, '---', desiredName);
// return actualName !== desiredName;
// }

function setFirstUpperCase(str) {
  return str ? str.charAt(0) + str.slice(1).toLowerCase() : '';
}

function isFirstUpperCase(str) {
  return /^[A-Z][^A-Z]*$/.test(str);
}
