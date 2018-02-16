
/**
 * curryFileCheck - curries a function that checks certain parameters of a file
 *
 * @param {object} checks is an object that contains the parameters that need to
 * be check. Checks supported:
 *  - maxSize: in bits
 *  - fileTypeRegExp: a RegExp with the supported extensions
 *
 * @return {function} returns curriedFileCheck
 */
export default function curryFileCheck(checks) {
  /**
   * curriedFileCheck - Takes a file and checks its parameters agaisnt the curried checks
   *
   * @param {object} file A file object. I think a blob. :)
   *
   * @return {boolean, string} If a checks fails, returns a string with the reason.
   * If the checks succeeds returns true.
   */
  return function curriedFileCheck(file) {
    if (checks.maxSize && file.size > checks.maxSize) {
      return 'exceed-max-allowed-size';
    }
    if (checks.fileTypeRegExp && !checks.fileTypeRegExp.test(file.extension || file.type)) {
      return 'invalid-file-type';
    }
    return true;
  };
}
