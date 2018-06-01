import processImage from './processImage';

let bound;

if (Meteor.isServer) {
  bound = Meteor.bindEnvironment(callback => (callback()));
}

/**
 * curryUpdateVersionToDoc - curries updateVersionToDoc with a collection
 *
 * @param {Collection} Collection The collection you want to curry the function with
 *
 * @return {function} returns curriedUpdateVersionToDoc
 */
function curryUpdateVersionToDoc(Collection) {
  /**
   * curriedUpdateVersionToDoc - updates a version to a document
   *
   * @param {string} docId            The document that needs to be updated
   * @param {object} versionReference The version information that will be updated
   * to the doc
   *
   * @return {promise} it return a promise - resolve: same versionReference -
   * reject: the error that caused it
   */
  return function curriedUpdateVersionToDoc(docId, versionReference) {
    return new Promise((resolve, reject) => {
      bound(() => {
        Collection.collection.update(docId, {
          $set: { [`versions.${versionReference.version}`]: versionReference },
        }, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve(versionReference);
          }
        });
      });
    });
  };
}


/**
 * curryProcessImagesAndUpload - curries processImagesAndUpload with a function
 * to upload files to a 3rd party storage and the requests to process the images
 *
 * @param {function} uploadTo3rdParty function to upload a file to a 3rd party storage
 * @param {array} [requests=[]]     Array of requests to process the image.
 * It should follow this format:
 *  [
 *  {
 *    version: 'versionName',
 *    dimensions: {
 *      width: 100
 *      height: 100
 *      options: '!'
 *    },
 *    quality: 80,
 *  },
 *  ]
 *
 * @return {function} returns curriedProcessImagesAndUpload
 */
export default function curryProcessImagesAndUpload(uploadTo3rdParty, requests = []) {
  /**
   * curriedProcessImagesAndUpload - First it uploads the originals to the 3rd party,
   * then it process the images and it uploads the new versions to the 3rd party storage.
   * It also updates the doc in the collection with the new metadata
   *
   * @param {collection} FileCollection - Collection from where the fileRef is coming.
   * It is used to update the new metadata to the file
   * @param {type} fileRef    A fileRef from the file that need to be processed
   * and uploaded. This fileRef can be optained from a doc in the FilesCollection.
   * It is also provided by the collection hook `onAfterUpload`.
   *
   * @return {none} returns nothing
   */
  return function curriedProcessImagesAndUpload(FileCollection, fileRef) {
    // In onAfterUpload callback we process the images and we move file to AWS:S3;

    // curry upload function to improve readability
    const uploadVersionTo3rdParty = _.partial(uploadTo3rdParty, FileCollection, fileRef._id);
    const updateVersionToDoc = _.partial(curryUpdateVersionToDoc(FileCollection), fileRef._id);

    Promise.all(
      // First we process the images
      _.map(requests, request => new Promise((resolve) => {
        processImage(fileRef, request)
          .then(updateVersionToDoc)
          .then(uploadVersionTo3rdParty)
          .then((info) => {
            // TODO remove console.log and add it to a log collection
            console.log(`Full process for ${info.name} completed`);
            resolve(info);
          })
          .catch((error) => {
            // TODO remove console.log and add it to a log collection
            console.error('Error, something went wrong with the images', error.message);
            resolve(error); // resolve even if there is an error
          });
      })),
    ).then(() => {
    // Then we upload the version not uploaded yet e.g original version
      _.each(fileRef.versions, (versionReference, version) => {
        if (!versionReference.uploadedTo3rdParty) {
          uploadVersionTo3rdParty({ ...versionReference, version });
        }
      });
    });
  };
}
