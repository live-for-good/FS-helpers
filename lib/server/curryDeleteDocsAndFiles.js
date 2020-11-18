import _each from "lodash/each";
import _isEmpty from "lodash/isEmpty";
import _map from "lodash/map";

/**
 * curryDeleteDocsAndFiles - curries the deleteDocsAndFiles function with a
 * deleteFrom3rdParty function.
 *
 * @param {function} deleteFrom3rdParty Function that deletes a file from a 3rd Party.
 * Ideally the one that is hosting the file that you want to delete.
 *
 * @return {function} returns curriedDeleteDocsAndFiles
 */
export default function curryDeleteDocsAndFiles(deleteFrom3rdParty) {
   /**
    * curriedDeleteDocsAndFiles - deletes docs and its associated files from the
    * internal FS or a 3rd party storage, provided in the currying of the function.
    *
    * @param {FilesCollection} FilesCollection FilesCollection from Meteor-Files
    * from where to delete the doc.
    * @param {function} removeOriginal  Original FilesCollection.remove
    * @param {object} search          Object to search the document to be deleted
    *
    * @return {none} It doesn't return anything
    */
  return function curriedDeleteDocsAndFiles(FilesCollection, removeOriginal, search) {
    // Abstracting a function to delete from collection
    const removeFromCollection = docId => new Promise((resolve, reject) => {
      removeOriginal.call(FilesCollection, { _id: docId }, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve(true);
        }
      });
    });
    // Here is where the process starts
    const cursor = FilesCollection.collection.find(search).fetch();
    _each(cursor, ((fileRef) => {
      if (!_isEmpty(fileRef.versions)) {
        Promise.all(_map(fileRef.versions, (versionReference, version) =>
          deleteFrom3rdParty(FilesCollection, fileRef._id, { ...versionReference, version }),
        ))
          .then(() => removeFromCollection(fileRef._id))
          .then(() => {
            // TODO remove console.log and add it to a log collection
            //console.info(`Success! Deleted ${fileRef._id} from ${FilesCollection.collectionName} and 3rd Party Storage`);
          })
          .catch((error) => {
            // TODO remove console.log and add it to a log collection
            //console.error(`Error while deleting the ${fileRef._id} from ${FilesCollection.collectionName} and 3rd party:`, error);
          });
      } else {
        // This covers the edge case of not having versions
        removeFromCollection(fileRef._id)
          .then(() => {
            // TODO remove console.log and add it to a log collection
            //console.info(`Success! Deleted ${fileRef._id} from ${FilesCollection.collectionName}`);
          })
          .catch((error) => {
            // TODO remove console.log and add it to a log collection
            //console.error('Error while deleting the file from collection:', error);
          });
      }
    }));
  };
}
