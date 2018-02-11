const { Console } = require('console');
const fs = require('fs');
const md = require('node-id3');

const Dir = 'C:/Users/Elena/Desktop/musica/!!!';
const extensions = /.+\.mp3$/i;
const ftBase = 'f(ea)?t\\.? [^\\(\\[]+';
const ftRegex = new RegExp(`(\\(${ftBase}\\)|\\[${ftBase}\\]| ${ftBase})`);

const logger = setupLogger();

start(Dir);

function setupLogger() {
  let date = new Date();
  date = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}.${date.getMinutes()}`;
  const output = fs.createWriteStream(`./logs/${date}.log`);
  const errorOutput = fs.createWriteStream(`./logs/${date} err.log`);
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
        // updateFilename(meta, dir, filename);
        // moveFile(dir, filename);
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
    let hadFeat = checkFeat(meta);
    meta.title = setFirstUpperCase(meta.title);
    meta.album = setFirstUpperCase(meta.album);
    meta.artist = formatArtist(meta.artist);
    meta.comment = { text: '' };
    meta.performerInfo = '';
    meta.trackNumber = cleanTrackNumber(meta.trackNumber);
    meta.partOfSet = '';
    meta.encodedBy = '';
    // console.log(meta);

    let success = md.update(meta, path);
    if (success) {
      logger.log(`***** metadata updated - ${path}`);
      if (hasBrackets(meta.title) || hasBrackets(meta.album)) {
        logger.warn(`HEADS UP! metadata has brackets - ${path}`);
      }
      if (hadFeat) {
        logger.warn(`HEADS UP! title had 'feat' - ${path}`);
      }
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
  if (!meta.artist && !meta.title) return;

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
          logger.log(`***** filename updated - ${newName}`);
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

function moveFile(dir, filename) {
  let oldName = `${dir}/${filename}`;
  let newDir = dir.replace(Dir, `${Dir}/!DONE`);
  let newName =  `${newDir}/${filename}`;

  if (!fs.existsSync(newDir)) {
    fs.mkdirSync(newDir);
  }

  fs.rename(oldName, newName, err => {
    if (err) {
      logger.error(`filename ERROR - ${oldName}`);
      logger.error(err);
      logger.error('----------------------');
    } else {
      logger.log(`***** file moved - ${newName}`);
    }
  });
}

function needsToUpdateMD(meta) {
  return !!(
    !isFirstUpperCase(meta.title) ||
    !isFirstUpperCase(meta.album) ||
    (meta.comment && meta.comment.text) ||
    meta.performerInfo ||
    (meta.trackNumber && meta.trackNumber.indexOf('/') !== -1) ||
    meta.partOfSet ||
    meta.encodedBy
  );
}

function needsToUpdateFN(meta, filename) {
  let actualName = filename.replace(getExtension(filename), '');
  let desiredName = `${meta.artist} - ${meta.title}`;
  desiredName = desiredName.replace(/[\\/:*?"<>|]/g, '-');

  if (actualName !== desiredName) {
    return desiredName;
  }
}

function setFirstUpperCase(str) {
  return str ? stripSpaces(str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()) : '';
}

function isFirstUpperCase(str) {
  return /^[A-Z][^A-Z]*$/.test(str);
}

function stripSpaces(str) {
  return str.replace(/  +/, ' ').trim();
}

function formatArtist(artist) {
  return !artist ? '' : artist
    .split(' ')
    .map(function (name) {
      return name !== 'ft.' ? setFirstUpperCase(name) : name;
    }).join(' ');
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

function hasBrackets(str) {
  return /[\[\]\{\}]/.test(str);
}

function checkFeat(meta) {
  if (meta.title) {
    let ft = meta.title.match(ftRegex);
    if (ft && ft.length) {
      ft = ft[0];
      meta.title = meta.title.replace(ft, '');
      ft = ft.substring(ft.indexOf(' ', 1) + 1).replace(/[\)\]]/, '');
      meta.artist += ` ft. ${ft}`;
      return true;
    }
  }

  return false;
}
