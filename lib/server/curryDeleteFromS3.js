import _ from 'lodash';

let bound;

if (Meteor.isServer) {
  bound = Meteor.bindEnvironment(callback => (callback()));
}

/**
 * curryDeleteFromS3 - curries a function that deletes a file from AWS S3 with
 * from an S3 client
 *
 * @param {object} S3Client A Knox S3 client or any client with similar API.
 *
 * @return {function} returns curriedDeleteFromS3
 */
export default function curryDeleteFromS3(S3Client) {
  /**
   * curriedDeleteFromS3 - Deletes a file from S3 and updates the doc's versions
   * that contains that file.
   *
   * @param {FilesCollection} FilesCollection Collection that needs to be updated
   * once the files is deleted from S3
   * @param {string} docId            The id of the doc that needs to be updated
   * once the file is deleted
   * @param {object} versionReference The information of the version that wants
   * to be deleted. The refernce of the file in S3 needs to be in `versionReference.meta.pipePath`
   *
   * @return {promise} returns a promise - resolve returns the same version reference
   *  - reject returns the error that caused it.
   */
  return function curriedDeleteFromS3(FilesCollection, docId, versionReference) {
    return new Promise((resolve, reject) => {
      if (_.has(versionReference, 'meta.pipePath')) {
        S3Client.deleteFile(versionReference.meta.pipePath, (deleteFromS3Error) => {
          bound(() => {
            if (deleteFromS3Error) {
              reject(deleteFromS3Error);
            } else {
              FilesCollection.collection.update({ _id: docId }, {
                $unset: { [`versions.${versionReference.version}`]: '' },
              }, (collectionUpadteError) => {
                if (collectionUpadteError) {
                  reject(collectionUpadteError);
                }
                // TODO remove console.log and add it to a log collection
                console.log(
                `${versionReference.name ||
                `${docId}-${versionReference.version}`}: deleted from S3`
                );
                resolve(versionReference);
              });
            }
          });
        });
      } else {
        // console.warn(`This ${versionReference.name} has no linked file in S3`);
        resolve(versionReference);
      }
    });
  };
}
