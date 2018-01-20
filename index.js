const fs = require('fs');
const md = require('node-id3');

const dir = 'C:/Users/Elena/Downloads/2002 Songs About Jane/';
const extensions = /.+\.mp3/i;

var files = fs.readdirSync(dir);
files.filter(f => f.match(extensions))
    .forEach(filename => {
      let path = dir + filename;
      let meta = md.read(path);
      if (meta) {
        updateMetadata(meta, path);
        updateFilename(meta, dir, filename);
      }
    });

function updateMetadata(meta, path) {
  if (needsToUpdateMD(meta)) {
    meta.title = setFirstUpperCase(meta.title);
    meta.album = setFirstUpperCase(meta.album);
    meta.comment = { text: '' };
    meta.performerInfo = '';

    let success = md.update(meta, path);
    console.log('metadata', success ? 'updated' : 'error', '-', path);
  } else {
    console.log('metadata up to date - ', path);
  }
}

function updateFilename(meta, dir, filename) {
  let oldName = dir + filename;
  let newName = needsToUpdateFN(meta, filename);
  if (newName) {
    newName = dir + newName + getExtension(filename);
    if (!fs.existsSync(newName)) {
      fs.rename(oldName, newName, err => {
        console.log('filename', err ? `error - ${oldName}` : `updated - ${newName}`);
      });
    } else {
      console.log('name already exists, could not update! - ', newName);
    }
  } else {
    console.log('filename up to date - ', dir + filename);
  }
}

function needsToUpdateMD(meta) {
  return !!(
    !isFirstUpperCase(meta.title) ||
    !isFirstUpperCase(meta.album) ||
    (meta.comment && meta.comment.text) ||
    meta.performerInfo
  );
}

function needsToUpdateFN(meta, filename) {
  let actualName = filename.replace(getExtension(filename), '');
  let desiredName = `${meta.artist} - ${meta.title}`;

  if (actualName !== desiredName) {
    return desiredName;
  }
}

function setFirstUpperCase(str) {
  return str ? str.charAt(0) + str.slice(1).toLowerCase() : '';
}

function isFirstUpperCase(str) {
  return /^[A-Z][^A-Z]*$/.test(str);
}

function getExtension(filename) {
  return filename.substring(filename.lastIndexOf('.'));
}
