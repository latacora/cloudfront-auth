const { execSync } = require('child_process');
// stderr is sent to stderr of parent process
// const AWS = require("aws-sdk")
var AWS = require('aws-sdk'),
    region = "us-east-2",
    secretName = "CETUS_GCP_OAUTH2_CREDENTIALS",
    secret,
    decodedBinarySecret;
const fs = require("fs")
// you can set options.stdio if you want it to go elsewhere
// Create a Secrets Manager client
var secrets_client = new AWS.SecretsManager({
    region: region
});
try {
  data = await secrets_client.getSecretValue({SecretId: secretName});
  secret = JSON.parse(data.SecretString)
} catch (err) {
  if (err.code === 'DecryptionFailureException')
      // Secrets Manager can't decrypt the protected secret text using the provided KMS key.
      // Deal with the exception here, and/or rethrow at your discretion.
      throw err;
  else if (err.code === 'InternalServiceErrorException')
      // An error occurred on the server side.
      // Deal with the exception here, and/or rethrow at your discretion.
      throw err;
  else if (err.code === 'InvalidParameterException')
      // You provided an invalid value for a parameter.
      // Deal with the exception here, and/or rethrow at your discretion.
      throw err;
  else if (err.code === 'InvalidRequestException')
      // You provided a parameter value that is not valid for the current state of the resource.
      // Deal with the exception here, and/or rethrow at your discretion.
      throw err;
  else if (err.code === 'ResourceNotFoundException')
      // We can't find the resource that you asked for.
      // Deal with the exception here, and/or rethrow at your discretion.
      throw err;
}

});
//Expect payload on the event object
exports.handler =  async function(event, context) {
  process.env[`PATH`] = process.env[`PATH`] + `:` + process.env[`LAMBDA_TASK_ROOT`]
  //console.log("EVENT: \n" + JSON.stringify(event, null, 2))
  //return context.logStreamName
	// Since this is not parameterized its is very dangerous
  const lambdas_bucket_name = "cetus-auth-lambdas"
  // return execSync("openssl version")
  let stdout = execSync(`node build/build-cli.js --distributionName ${event.client_codename} --authenticationMethod 1 --clientId ${secret_data.GCP_OAUTH2_CLIENT_ID} --clientSecret ${secret_data.GCP_OAUTH2_CLIENT_SECRET} --redirectURI https://${event.domain_name}/_callback --hostedDomain latacora.com --sessionDuration 1 --authz 1`);
  let s3 = new AWS.S3({apiVersion: "2006-03-01"})
  let zipfilePath = `/tmp/distributions/${event.client_codename}/${event.client_codename}.zip` // This is hardcoded for now but we should return this with the build-cli.js script
  let fileStream = fs.createReadStream(zipfilePath)
  fileStream.on('error', function(err) {
    console.log("File Error, err")
  })
  const path = require("path")
  let uploadParams = {Bucket: lambdas_bucket_name, Body: fileStream, Key:path.basename(zipfilePath)}
  try {
    let request = await s3.upload(uploadParams).promise()
    console.log("We did it!")
    console.log(request)
  } catch(err) {
    console.log(err)
  }
  return "It's uploaded!"
}
