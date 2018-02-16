import _ from 'lodash';
import Request from 'request';

/**
 * serveFilesFrom3rdParty - it is used to server files from S3 instead of interal FS
 *
 * @param {object} http    ??? - provided by FilesCollection method
 * @param {object} fileRef The fileRef of the doc to be served
 * @param {string} version The version of the doc that wants to be served
 *
 * @return {boolean} returns true if the file is in
 */
export default function serveFilesFrom3rdParty(http, fileRef, version) {
  const path = _.get(fileRef, `versions.${version}.meta.pipeFrom`);

  if (path) {
    // If file is moved to S3 We will pipe request to S3 so, original link will stay
    // always secure
    Request({
      url: path,
      headers: _.pick(http.request.headers, 'range', 'accept-language', 'accept', 'cache-control', 'pragma', 'connection', 'upgrade-insecure-requests', 'user-agent'),
    }).pipe(http.response);
    return true;
  } else {
    // While file is not yet uploaded to S3 We will serve file from FS
    return false;
  }
}
