/**
 * app.js
 *
 * Use `app.js` to run your app without `sails lift`.
 * To start the server, run: `node app.js`.
 *
 * This is handy in situations where the sails CLI is not relevant or useful.
 *
 * For example:
 *   => `node app.js`
 *   => `forever start app.js`
 *   => `node debug app.js`
 *   => `modulus deploy`
 *   => `heroku scale`
 *
 *
 * The same command-line arguments are supported, e.g.:
 * `node app.js --silent --port=80 --prod`
 */


// Ensure we're in the project directory, so cwd-relative paths work as expected
// no matter where we actually lift from.
// > Note: This is not required in order to lift, but it is a convenient default.

const AWS = require('aws-sdk')
AWS.config.update({region:'us-east-1'})
const kms = new AWS.KMS()
const fs = require('fs')
const async = require('async')

async.parallel([
  (callback) => {
    const params = {CiphertextBlob: fs.readFileSync('.env-secret-dev')}

    kms.decrypt(params, function(err, data){
      if (err)
        callback("Could not Decrypt env-secret-dev .. Using defaults")
      else {
        if(process.env.CREATE_ENV){
          fs.writeFileSync('.env-dev', data.Plaintext)
          require('dotenv').config()
          console.log('.env-dev file created')
        }
        else {
          let parsedObj = require('dotenv').parse(Buffer.from(data.Plaintext, 'base64').toString())
          Object.keys(parsedObj).forEach(function (key) {
            if (!process.env.hasOwnProperty(key)) {
              process.env[key] = parsedObj[key]
            }
          })
        }
      }
      callback(null, null)
    })
  },
  (callback) => {
    const params = {CiphertextBlob: fs.readFileSync('.env-secret-prod')}

    kms.decrypt(params, function(err, data){
      if (err)
        callback("Could not Decrypt .env-secret-prod .. Using defaults")
      else {
        if(process.env.CREATE_ENV){
          fs.writeFileSync('.env-prod', data.Plaintext)
          require('dotenv').config()
          console.log('.env-prod file created')
        }
        else {
          let parsedObj = require('dotenv').parse(Buffer.from(data.Plaintext, 'base64').toString())
          Object.keys(parsedObj).forEach(function (key) {
            if (!process.env.hasOwnProperty(key)) {
              process.env[key] = parsedObj[key]
            }
          })
        }
        callback(null, null)
      }
    })
  },
], (err, results) => {
  if(err)
    console.log(err)
  // Start server
  sails.lift(rc('sails'));
})

process.chdir(__dirname);

// Attempt to import `sails`.
var sails;
try {
  sails = require('sails');
} catch (e) {
  console.error('To run an app using `node app.js`, you usually need to have a version of `sails` installed in the same directory as your app.');
  console.error('To do that, run `npm install sails`');
  console.error('');
  console.error('Alternatively, if you have sails installed globally (i.e. you did `npm install -g sails`), you can use `sails lift`.');
  console.error('When you run `sails lift`, your app will still use a local `./node_modules/sails` dependency if it exists,');
  console.error('but if it doesn\'t, the app will run with the global sails instead!');
  return;
}

// --•
// Try to get `rc` dependency (for loading `.sailsrc` files).
var rc;
try {
  rc = require('rc');
} catch (e0) {
  try {
    rc = require('sails/node_modules/rc');
  } catch (e1) {
    console.error('Could not find dependency: `rc`.');
    console.error('Your `.sailsrc` file(s) will be ignored.');
    console.error('To resolve this, run:');
    console.error('npm install rc --save');
    rc = function () { return {}; };
  }
}
