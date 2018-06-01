import _ from 'lodash';
import mime from 'mime';
import path from 'path';
import gm from 'gm';

const calculateAspectRatio = dimensions => (dimensions.width / dimensions.height);

const needToResize = (originalSize, newSize) => {
  if ((!_.has(originalSize, 'width') || !_.has(originalSize, 'height'))
  && (_.has(newSize, 'width') || _.has(newSize, 'height'))) {
    // If originalSize.width or originalSize.height are undefined and neWsize if
    // defined then whe should resize.
    return true;
  } else if (newSize.width && newSize.height) {
    return (
      originalSize.width > newSize.width ||
      originalSize.height > newSize.height ||
      calculateAspectRatio(originalSize) !== calculateAspectRatio(newSize)
    );
  } else if (newSize.width) {
    return originalSize.width > newSize.width;
  } else if (newSize.height) {
    return originalSize.height > newSize.height;
  }
  // if no dimensions specified no need to resize
  return false;
};


/**
 * processImage - it processes and image given a request. Right now it supports mainly resizing.
 *
 * @param {object} fileRef        This fileRef object needs to contain a path
 * property pointing to the image that wants to be processed.
 * @param {object} processRequest It details the settings and some metadata of
 * the processing request. The object needs to have this structure:
 * {
 *  version: 'versionName',
 *  nameSuffix: string, // optional
 *  filePath: string, // optional
 *  dimensions: {
 *    width: 100, // optional
 *    height: 100, // optional
 *    options: !, // optional, see GM resize options
 *  },
 *  quality: 80,
 * }
 *
 * @return {object} it returns an object with the metadata of the new image.
 * It has this structure:
 * {
 * name,
   path,
   type,
   extension,
   hasBeenResized,
   dimensions,
   size,
 * }
 */
const processImage = (fileRef, processRequest) => new Promise((resolve) => {
  // Extracting general information
  const file = fileRef.path;
  const type = mime.lookup(file);
  const extension = path.extname(file); // fileRef.extension; //
  const originalName = path.basename(file, extension); // fileRef.name; //
  const originalFilePath = path.dirname(file);
  const originalSize = fileRef.size;

  // Extract settings from request
  const { version, nameSuffix, filePath, dimensions, quality = 80 } = processRequest;

  // Preparing new file metadata
  const newName = nameSuffix ? `${originalName}-${nameSuffix}` : `${originalName}-${version}`;
  const newFilePath = filePath ? `${filePath}/${newName}${extension}` : `${originalFilePath}/${newName}${extension}`;

  const info = {
    name: newName,
    path: newFilePath,
    type,
    extension: extension.replace('.', ''),
    version,
    hasBeenResized: false,
  };

  gm(file).size((retImgSizeError, originalDimensions) => {
    if (retImgSizeError) {
      // TODO LOG error log to collection
      // console.error('Error retrieving the image dimensions:', newName, retImgSizeError.message);
    }

    if (needToResize(originalDimensions, dimensions)) {
      // resize image
      // Clone file to process it
      const newFile = _.clone(file);
      // Start processing
      gm(newFile)
        .resize(dimensions.width, dimensions.height, dimensions.options)
        .gravity('Center')
        .autoOrient()
        .quality(quality)
        .write(newFilePath, (imageProcessingError) => {
          // once the processing has finished
          if (imageProcessingError) {
            // TODO LOG error log to collection
            // console.error('Error processing the image:', newName, imageProcessingError.message);
          } else {
            info.hasBeenResized = true;
            gm(newFilePath).identify((retMetadataError, metadata) => {
              if (retMetadataError) {
                // TODO LOG error log to collection
                // console.error(
                // 'Error retrieving metadata from the image:', newName, retMetadataError.message
                // );
              }
              info.dimensions = metadata.size;
              info.size = metadata.Filesize;
              // TODO LOG remove console.log and add it to a log collection
              // console.log(`${newName}: resized`);
              resolve(info);
            });
          }
        });
    } else {
      // If no need to resize, we just write the original file to the newFilePath
      gm(file).quality(quality).write(newFilePath, (imageWritingError) => {
        if (imageWritingError) {
          // TODO LOG error log to collection
          // console.error('Error processing the image:', newName, imageWritingError.message);
        } else {
          info.dimensions = originalDimensions;
          info.size = originalSize;
          // TODO remove console.log and add it to a log collection
          // console.log(`${newName}: not resized`);
          resolve(info);
        }
      });
    }
  });
});

export default processImage;
