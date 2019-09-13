const { execSync } = require('child_process');
// stderr is sent to stderr of parent process
const AWS = require("aws-sdk")
const fs = require("fs")
// you can set options.stdio if you want it to go elsewhere
//
//Expect payload on the event object
exports.handler =  async function(event, context) {
  process.env[`PATH`] = process.env[`PATH`] + `:` + process.env[`LAMBDA_TASK_ROOT`]
  //console.log("EVENT: \n" + JSON.stringify(event, null, 2))
  //return context.logStreamName
	// Since this is not parameterized its is very dangerous
  const lambdas_bucket_name = "cetus-auth-lambdas"
  // return execSync("openssl version")
  let stdout = execSync(`node build/build-cli.js --distributionName ${event.client_codename} --authenticationMethod 1 --clientId ${process.env.CLIENT_ID} --clientSecret ${process.env.CLIENT_SECRET} --redirectURI https://${event.domain_name}/_callback --hostedDomain latacora.com --sessionDuration 1 --authz 1`);
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
