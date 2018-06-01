import _ from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

let bound;

if (Meteor.isServer) {
  bound = Meteor.bindEnvironment(callback => (callback()));
}


/**
 * curryUploadToS3 - it curries the curriedUploadToS3 with an S3Client and a
 * CloudFront domain
 *
 * @param {Object} S3Client A Knox S3 client
 * @param {String} cfdomain A CloudFront domain linked to the S3 client
 *
 * @return {function} returns curriedUploadToS3
 */
export default function curryUploadToS3(S3Client, cfdomain) {

  /**
   * curriedUploadToS3 - Uploads a file to S3 and updates the collection with
   * the new metadata. It also unlinks the original file from the internal FS.
   *
   * @param {FileCollection} FilesCollection The FilesCollection from where the
   * reference docs belongs to. It is used to update the doc with the new metadata
   * @param {string} docId           The id from the reference doc that needs to be updated
   * @param {object} versionRef     The information of the version that will be
   * uploaded to S3. It need to contain the path of the file version that needs to be uploaded.
   *
   * @return {promise} returns a promise - resolve: returns the same versionRef
   * as the input - reject: returns the error that cause it
   */
  return function curriedUploadToS3(FilesCollection, docId, versionRef) {
    return new Promise((resolve, reject) => {
      const { version } = versionRef;
      // We use Random.id() instead of real file's _id to secure files from reverse
      // engineering as after viewing this code it will be easy to get access to
      // unlisted and protected files
      const filePath = `${_.snakeCase(FilesCollection.collectionName)}/${version}/${(Random.id())}-${version}.${versionRef.extension}`;
      // Here we upoload the file
      S3Client.putFile(versionRef.path, filePath, (S3error, res) => {
        bound(() => {
          if (S3error) {
            reject(S3error); // Reject
          } else {
            // If no error, update the mongo document
            const upd = {
              $set: {
                [`versions.${version}.uploadedTo3rdParty`]: true,
                [`versions.${version}.meta.pipeFrom`]: `${cfdomain}/${filePath}`,
                [`versions.${version}.meta.pipePath`]: filePath,
              },
            };
            // Here we perform the document update
            FilesCollection.collection.update({
              _id: docId,
            }, upd, (collectionError) => {
              if (collectionError) {
                reject(collectionError);
              } else {
                // Unlink original files from FS after successful upload to AWS:S3
                FilesCollection.unlink(FilesCollection.collection.findOne(docId), version);
                // TODO remove console.log and add it to a log collection
                console.log(`${versionRef.name || `${docId}-${version}`}: uploaded`);
                res.resume(); // Recommended in Knox docs.
                resolve(versionRef);
              }
            });
          }
        });
      });
    });
  };
}
