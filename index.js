const { Console } = require('console');
const fs = require('fs');
const md = require('node-id3');

const Dir = 'C:/Users/Elena/Downloads/!musica/Garbage';
const extensions = /.+\.mp3$/i;

const logger = setupLogger();

start(Dir);

function setupLogger() {
  let date = new Date();
  date = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}.${date.getMinutes()}`;
  const output = fs.createWriteStream(`./${date}.log`);
  const errorOutput = fs.createWriteStream(`./${date} err.log`);
  return new Console(output, errorOutput);
}

function start(baseDir) {
  logger.log(`     ${baseDir}`);
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
    } catch (err) {
      logger.error(`ERROR could not read metadata - ${path}`);
      logger.error(err);
      logger.error('----------------------');
    }
  }
}

function updateMetadata(meta, path) {
  if (needsToUpdateMD(meta)) {
    meta.title = setFirstUpperCase(meta.title);
    meta.album = setFirstUpperCase(meta.album);
    meta.comment = { text: '' };
    meta.performerInfo = '';
    meta.trackNumber = cleanTrackNumber(meta.trackNumber);
    meta.partOfSet = '';

    let success = md.update(meta, path);
    if (success) {
      logger.log(`metadata updated - ${path}`);
    } else {
      logger.error(`metadata ERROR - ${path}`);
      logger.error(success);
      logger.error('----------------------');
    }
  } else {
    logger.log(`metadata up to date - ${path}`);
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
          logger.error(`filename ERROR - ${oldName}`);
          logger.error(err);
          logger.error('----------------------');
        } else {
          logger.log(`filename updated - ${newName}`);
        }
      });
    } else {
      logger.error(`filename ERROR, name already exists - ${newName}`);
      logger.error('----------------------');
    }
  } else {
    logger.log(`filename up to date - ${oldName}`);
  }
}

function needsToUpdateMD(meta) {
  return !!(
    !isFirstUpperCase(meta.title) ||
    !isFirstUpperCase(meta.album) ||
    (meta.comment && meta.comment.text) ||
    meta.performerInfo ||
    meta.trackNumber.indexOf('/') !== -1 ||
    meta.partOfSet
  );
}

function needsToUpdateFN(meta, filename) {
  let actualName = filename.replace(getExtension(filename), '');
  let desiredName = `${meta.artist} - ${meta.title}`;
  desiredName = desiredName.replace(/[^\w- \.,'\(\)\[\]]/g, '-');

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

function cleanTrackNumber(trackNumber) {
  if (trackNumber) {
    let slashIndex = trackNumber.indexOf('/');
    return slashIndex == -1 ? trackNumber : trackNumber.substring(0, slashIndex)
  }
}
