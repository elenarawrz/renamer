const fs = require('fs');
const md = require('node-id3');

const Dir = 'C:/Users/Elena/Downloads/!musica';
const extensions = /.+\.mp3$/i;

start(Dir)

function start(baseDir) {
  console.log('     ', baseDir);
  let files = fs.readdirSync(baseDir);
  files.forEach(file => {
    let fullPath = `${baseDir}/${file}`;
    let isDir = fs.statSync(fullPath).isDirectory();

    if (isDir) {
      start(fullPath);
    } else {
      rename(baseDir, file);
    }
  });
}

function rename(dir, filename) {
  if (extensions.test(filename)) {
    let path = `${dir}/${filename}`;
    try {
      let meta = md.read(path);
      if (meta) {
        updateMetadata(meta, path);
        updateFilename(meta, dir, filename);
      }
    } catch (e) {
      console.log('ERROR could not read metadata - ', path, e);
    }
  }
}

function updateMetadata(meta, path) {
  if (needsToUpdateMD(meta)) {
    meta.title = setFirstUpperCase(meta.title);
    meta.album = setFirstUpperCase(meta.album);
    meta.comment = { text: '' };
    meta.performerInfo = '';

    let success = md.update(meta, path);
    console.log('metadata', success ? 'updated' : 'ERROR', '-', path);
  } else {
    console.log('metadata up to date - ', path);
  }
}

function updateFilename(meta, dir, filename) {
  let oldName = `${dir}/${filename}`;
  let newName = needsToUpdateFN(meta, filename);
  if (newName) {
    newName = `${dir}/${newName}${getExtension(filename)}`;
    if (!fs.existsSync(newName)) {
      fs.rename(oldName, newName, err => {
        if (err) {
          console.log(`filename ERROR - ${oldName}`, err);
        } else {
          console.log(`filename updated - ${newName}`);
        }
      });
    } else {
      console.log('name already exists, could not update! - ', newName);
    }
  } else {
    console.log('filename up to date - ', oldName);
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
