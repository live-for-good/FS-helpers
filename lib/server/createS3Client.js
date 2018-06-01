import knox from 'knox';

import curryUploadToS3 from './curryUploadToS3';
import curryDeleteFromS3 from './curryDeleteFromS3';

/**
 * Creates an S3 client and curries the
 *
 * @param {{key: String, secret: String, region: String, bucket: String}} config
 * @param {String} cfdomain
 * @return {{bucket: Object, upload: curriedUploadToS3, delete: curriedDeleteFromS3}}
 */
export default function createS3Client(config, cfdomain) {
  // Fix CloudFront certificate issue Read:
  // https://github.com/chilts/awssum/issues/164
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

  const bucket = knox.createClient(config);

  return {
    bucket,
    upload: curryUploadToS3(bucket, cfdomain),
    delete: curryDeleteFromS3(bucket),
  };
}
