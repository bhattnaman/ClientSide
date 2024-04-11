/**
 * @file server.js
 * @description This is the server side code for the Authflow Authenticator application. It includes the routes for enrolling users, verifying passkeys, and fetching user accounts.
 * @author Naman Bhatt
 * @version 2.0
 * @license CMPSC 488 course project at Penn State University
 * @totalTime 18 hours
 * @totalLines 452 lines
 * @created 2/5/2024
 * @lastUpdated 3/27/2024
 * @credits Auth0, AWS, Express, MySQL, Node.js, Speakeasy, Winston, and other open-source libraries
 */

/**
 * Initializes the Express application and sets up middleware.
 */
const express = require('express');
const app = express();

/**
 * Imports necessary modules for the application.
 */
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const fs = require('fs');
const path = require('path');
const winston = require('winston');

/**
 * Defines the port on which the server will listen.
 */
const port = process.env.PORT || 3001;

/**
 * Specifies paths for log files.
 */
const errorLogPath = path.join(__dirname, 'error.log');
const combinedLogPath = path.join(__dirname, 'client_side.log');

/**
 * Clears the content of a specified log file.
 * @param {string} filePath - The path to the log file to be cleared.
 */
const clearLogFile = (filePath) => {
  fs.writeFileSync(filePath, '', (err) => {
    if (err) {
      console.error(`Error clearing log file ${filePath}: ${err}`);
    }
  });
};

// Clear log files on startup
clearLogFile(errorLogPath);
clearLogFile(combinedLogPath);

/**
 * Creates a logger instance with Winston.
 * The logger logs to files and the console.
 * The logger logs in JSON format.
 * The logger logs errors to error.log and all other logs to client_side.log.
 * The logger logs the service name as 'user-service'.
 * The logger logs at the 'info' level.
 * The logger logs the timestamp with each log entry.
 * 
 * @type {object}
 * @const logger
 * 
 */ 
const logger = winston.createLogger({
  // Change to 'debug' for more verbose logging
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  
  // Log to console and files
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'client_side.log' })
  ],
});
app.use(cors());
app.use(bodyParser.json());
// MySQL connection

/**
 * Establishes a connection to the MySQL database.
 * The connection is established with the following parameters:
 * - Host: localhost
 * - User: naman
 * - Password: authflow
 * - Database: account_manager
 * 
 * @type {object}
 * @const connection
 * 
 * @throws {error} - Throws an error if the connection to the MySQL server fails.
 * 
 */
const connection = mysql.createConnection({
  host: '35.192.117.103',
  user: 'naman',
  password: 'authflow',
  database: 'accounts',
  port: 3306
});
  connection.connect(err => {
    if (err) {
      console.error('Error connecting: ' + err.stack);
      return;
    }
  
    console.log('Connected as id ' + connection.threadId);
  });


const { auth, requiresAuth } = require('express-openid-connect');

/**
 * Configures the Auth0 authentication settings for the application.
 * The configuration includes the following parameters:
 * - authRequired: false
 * - auth0Logout: true
 * - secret: '
 * - baseURL: 'http://localhost:3001'
 *  - clientID: '238YoLjdvjDA7nNO3HJ6gTwlan8N7Fcv'
 * - issuerBaseURL: 'https://authflowauthenticator.us.auth0.com'
 * 
 * @type {object}
 * @const config
 * 
 */
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: 'a long, randomly-generated string stored in env',
  baseURL: 'http://localhost:3001',
  clientID: '238YoLjdvjDA7nNO3HJ6gTwlan8N7Fcv',
  issuerBaseURL: 'https://authflowauthenticator.us.auth0.com'
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

const AWS = require('aws-sdk');

/**
 * Configures the AWS SDK with the necessary credentials and region.
 * The credentials are obtained from the AWS Management Console.
 * The region is set to 'us-east-1'.
 * 
 * @type {object}
 * @const AWS
 * 
 * @throws {error} - Throws an error if the AWS SDK configuration fails.
 * 
 */
AWS.config.update({
  accessKeyId: 'AKIA6GBMGOWRSZ6MI7TB',
  secretAccessKey: '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',
  region:'us-east-1'
});

/**
 * Handles the GET request to the root URL.
 * Sends the index.html file as the response.
 * 
 * @param {string} path - The path to the root URL.
 * @param {function} callback - The callback function to execute.
 * 
 */
app.get('/', (req, res) => {
  logger.info('Serving index.html');
  res.sendFile(__dirname + '/index.html');
});

/**
 * Handles the GET request to the /login URL.
 * Redirects the user to the Auth0 login page.
 * 
 * @param {string} path - The path to the /login URL.
 * @param {function} callback - The callback function to execute.
 * 
 */
app.get('/profile', requiresAuth(), (req, res) => {
  // Send the user information as response
  res.send(JSON.stringify({ user: req.oidc.user }));
});

/**
 * /is-authenticated route
 * Checks if the user is authenticated
 * 
 * @param {string} path - The path to the /is-authenticated URL.
 * @param {function} callback - The callback function to execute.
 * 
 * @returns {object} - Returns a JSON object with the authentication status.
 * 
 * @throws {error} - Throws an error if the authentication check fails.
 * 
 */
app.get('/is-authenticated', (req, res) => {
  // Assuming `req.oidc.isAuthenticated()` returns true if the user is authenticated
  if (req.oidc.isAuthenticated()) {
    const email = req.oidc.user.email;
    res.json({ isAuthenticated: true , email: email});

    // Set all users as logged out
    const setAllUsersLoggedOutQuery = 'UPDATE authflowusers SET is_logged_in = FALSE';
    connection.query(setAllUsersLoggedOutQuery, (logoutErr, logoutResults) => {
      if (logoutErr) {
        logger.error('Database error when setting all users to logged out:', logoutErr);
      }
  
      // Set the current user as logged in
      const setUserLoggedInQuery = 'UPDATE authflowusers SET is_logged_in = TRUE WHERE email = ?';
      connection.query(setUserLoggedInQuery, [email], (loginErr, loginResults) => {
        if (loginErr) {
          logger.error('Database error when setting user to logged in:', loginErr);
        }
      });
      });
    
  } else {
    res.json({ isAuthenticated: false });
  }
});

const request = require("request");

/**
 * Obtains an access token for the Auth0 Management API.
 * The access token is used to fetch user profiles from Auth0.
 * 
 * @param {function} callback - The callback function to execute.
 * 
 * @returns {string} - Returns the access token for the Auth0 Management API.
 * 
 * @throws {error} - Throws an error if the access token cannot be obtained.
 * 
 */
function getAuth0ManagementApiToken(callback) {
    var options = {
        method: 'POST',
        url: 'https://authflowauthenticator.us.auth0.com/oauth/token',
        headers: { 'content-type': 'application/json' },
        body: '{"client_id":"M7slc0oJkdTNs694qnroNnnT52N6xOb9","client_secret":"K3ETVYdkbjmdNgEjCnZjonjqe1mp5qNhrCPlvskHZppcP6nJ2qhbszpUqyopc2Ym","audience":"https://authflowauthenticator.us.auth0.com/api/v2/","grant_type":"client_credentials"}'
    };

    request(options, function (error, response, body) {
        if (error) {
            console.error("Error obtaining Management API token:", error);
            return callback(error);
        }
        const responseBody = JSON.parse(body);
        callback(null, responseBody.access_token);
    });
}

/**
 * Fetches the user profile from Auth0 using the Auth0 Management API.
 * The user profile is fetched using the user ID and access token.
 * 
 * @param {string} userId - The user ID to fetch the profile for.
 * @param {string} accessToken - The access token for the Auth0 Management API.
 * @param {function} callback - The callback function to execute.
 * 
 * @returns {object} - Returns the user profile fetched from Auth0.
 * 
 * @throws {error} - Throws an error if the user profile cannot be fetched.
 * 
 */
function getUserProfileFromAuth0(userId, accessToken, callback) {
  var options = {
      method: 'GET',
      url: `https://authflowauthenticator.us.auth0.com/api/v2/users/${userId}`,
      headers: {
          authorization: `Bearer ${accessToken}`
      }
  };

  request(options, function (error, response, body) {
      if (error) {
          console.error("Error fetching user profile from Auth0:", error);
          return callback(error);
      }
      const userProfile = JSON.parse(body);
      callback(null, userProfile);
  });
}

/**
 * Handles the POST request to the /enroll-authflow URL.
 * Enrolls the user in the AuthFlow Authenticator.
 * 
 * @param {string} path - The path to the /enroll-authflow URL.
 * @param {function} callback - The callback function to execute.
 * 
 * @returns {object} - Returns a JSON object with the enrollment status.
 * 
 * @throws {error} - Throws an error if the user cannot be enrolled.
 * 
 * @requires {function} - Requires the user to be authenticated.
 * 
 */
app.post('/enroll-authflow', requiresAuth(), async (req, res) => {
    const user = req.oidc.user;
    const { email } = user;

    getAuth0ManagementApiToken((error, accessToken) => {
      if (error) return res.status(500).send({ message: 'Error obtaining Auth0 Management API token.' });

      getUserProfileFromAuth0(user.sub, accessToken, (error, userProfile) => {
          if (error) return res.status(500).send({ message: 'Error obtaining user profile from Auth0.' });
          const idp = userProfile.identities[0].provider; // Example: 'google-oauth2', 'facebook', etc.
    // First, check if the user exists in the database
    const checkQuery = 'SELECT * FROM authflowusers WHERE email = ?';
    connection.query(checkQuery, [email], (checkErr, checkResults) => {
      if (checkErr) {
        logger.error('Database error checking enrollment:', checkErr);
        return res.status(500).send({ message: 'Database error checking enrollment' });
      }
  
      // If user is found
      if (checkResults.length > 0) {
        if (checkResults[0].is_enrolled) {
          // If already enrolled
          return res.status(400).send({ message: 'User is already enrolled in AuthFlow Authenticator' });
        } 

        else if (!checkResults[0].is_enrolled) {
          // User exists but not enrolled, proceed with updating enrollment status
          const password = req.body.password; // Assuming password is sent securely
          const salt = crypto.randomBytes(16).toString('hex'); // Generate a salt
          const passwordHash = crypto.createHash('sha256').
          update(password + salt) 
          digest('hex');
          const pin = Math.floor(10000000 + Math.random() * 90000000).toString(); // Generate an 8-digit PIN

          // Update the database record to set is_enrolled to 0 and update password hash and pin
          const updateQuery = `UPDATE authflowusers SET password_hash = ?, pin = ?, idp = ?, is_enrolled = 0 WHERE email = ?`;
          connection.query(updateQuery, [passwordHash, pin, email, idp], (updateErr, updateResults) => {
            if (updateErr) {
              logger.error('Error updating user enrollment in AuthFlow Authenticator:', updateErr);
              console.error(updateErr);
              return res.status(500).send({ message: $(user.email) + 'chose to not enroll in AuthFlow' });
            }
            res.send({ message: 'You choose to not enroll in AuthFlow' });
            });
        }
        else {

          // User exists but not enrolled, proceed with updating enrollment status
          const password = req.body.password; // Assuming password is sent securely
          const salt = crypto.randomBytes(16).toString('hex'); // Generate a salt
          const passwordHash = crypto.createHash('sha256').update(password + salt).digest('hex');
          const pin = Math.floor(10000000 + Math.random() * 90000000).toString(); // Generate an 8-digit PIN
          const idp = userProfile.identities[0].provider;
  
          // Update the database record to set is_enrolled to 1 and update password hash and pin
          const updateQuery = `UPDATE authflowusers SET password_hash = ?, pin = ?, is_enrolled = 1 WHERE email = ?`;
          connection.query(updateQuery, [passwordHash, pin, email], (updateErr, updateResults) => {
            if (updateErr) {
              console.error('Error updating user enrollment in AuthFlow Authenticator:', updateErr);
              return res.status(500).send({ message: 'Error updating enrollment in AuthFlow Authenticator:', updateErr });
            }

            const { question1, answer1, question2, answer2, question3, answer3 } = req.body;
            const insertQuestionsQuery = `INSERT INTO user_info (email, question1, answer1, question2, answer2, question3, answer3) VALUES (?, ?, ?, ?, ?, ?, ?)`;

            connection.query(insertQuestionsQuery, [email, question1, answer1, question2, answer2, question3, answer3], (err, results) => {
            if (err) {
              console.log(err, err.stack); // an error occurred
              return res.status(500).send({ message: 'Error storing security questions.' });
            } else {
            // Continue to send the email
            const ses = new AWS.SES({ apiVersion: '2010-12-01' });
            const params = {
            Destination: {
              ToAddresses: [email] // User's email address
            },
            Message: {
              Body: {
                Text: { Data: `Thank you for using Authflow Authenticator. Your AuthFlow enrollment PIN is: ${pin}` }
              },
              Subject: { Data: "AuthFlow Authenticator Enrollment" }
            },
            Source: "authflowauthenticator@gmail.com" // Must be a verified email in SES
          };
          }

          
          ses.sendEmail(params, function(err, data) {
            if (err) {
              console.log(err, err.stack); // an error occurred
              res.status(500).send({ message: 'Error sending enrollment email.' });
            } else {
                  console.log(data); // successful response
                  res.send({ message: 'Check your email for the enrollment PIN.' });
                }
              });

        });
          });
        }
      } 
      else {
        // No user found, proceed with inserting new user record
        const password = req.body.password;
        const salt = crypto.randomBytes(16).toString('hex'); // Generate a salt
        const passwordHash = crypto.createHash('sha256').update(password + salt).digest('hex');
        const pin = Math.floor(10000000 + Math.random() * 90000000).toString(); // Generate an 8-digit PIN
  
        // Insert into the database (email, passwordHash, pin, is_enrolled)
        const insertQuery = `INSERT INTO authflowusers (email, password_hash, pin, is_enrolled, is_logged_in, idp) VALUES (?, ?, ?, 1, 1, ?)`;
        connection.query(insertQuery, [email, passwordHash, pin, idp], (insertErr, insertResults) => {
          if (insertErr) {
            console.error('Error enrolling user in AuthFlow Authenticator:', insertErr);
            logger.error('Error enrolling user in AuthFlow Authenticator:', insertErr);
            return res.status(500).send({ message: 'Error enrolling in AuthFlow Authenticator' });
          }

        const { question1, answer1, question2, answer2, question3, answer3 } = req.body;
        const insertQuestionsQuery = `INSERT INTO user_info (email, question1, answer1, question2, answer2, question3, answer3) VALUES (?, ?, ?, ?, ?, ?, ?)`;

        connection.query(insertQuestionsQuery, [email, question1, answer1, question2, answer2, question3, answer3], (err, results) => {
          if (err) {
            console.log(err, err.stack); // an error occurred
            return res.status(500).send({ message: 'Error storing security questions.' });
          } else {
            // Continue to send the email
            const ses = new AWS.SES({ apiVersion: '2010-12-01' });
            const params = {
            Destination: {
            ToAddresses: [email] // User's email address
            },
            Message: {
              Body: {
                Text: { Data: `Your AuthFlow Authenticator enrollment PIN is: ${pin}` }
              },
              Subject: { Data: "AuthFlow Authenticator Enrollment" }
            },
            Source: "authflowauthenticator@gmail.com" // Must be a verified email in SES
            };

            ses.sendEmail(params, function(err, data) {
              if (err) {
                console.log(err, err.stack); // an error occurred
                res.status(500).send({ message: 'Error sending enrollment email.' });
              } else {
                console.log(data); // successful response
                res.send({ message: 'Check your email for the enrollment PIN.' });
              }
              });
          }
        });
        });
      }
    });
  });
});
});

/**
 * Handles the GET request to the /is-enrolled URL.
 * Checks if the user is enrolled in the AuthFlow Authenticator.
 * 
 * @param {string} path - The path to the /is-enrolled URL.
 * @param {function} callback - The callback function to execute.
 * 
 * @returns {object} - Returns a JSON object with the enrollment status.
 * 
 * @throws {error} - Throws an error if the enrollment status cannot be checked.
 * 
 * @requires {function} - Requires the user to be authenticated.
 * 
 */
  app.get('/is-enrolled', (req, res) => {
    const user = req.oidc.user;
    const { email } = user;
  
    // Check if the user is enrolled in AuthFlow Authenticator
    const checkQuery = 'SELECT * FROM authflowusers WHERE email = ?';
    connection.query(checkQuery, [email], (checkErr, checkResults) => {
      if (checkErr) {
        logger.error('Database error checking enrollment:', checkErr);
        return res.status(500).send({ message: 'Database error checking enrollment' });
      }
  
      if (checkResults.length > 0) {
        if (checkResults[0].is_enrolled) {
          res.send({ isEnrolled: true });
        } else {
          res.send({ isEnrolled: false });
        }
      } else {
        res.status(404).send({ message: 'User not found' });
      }
    });
  });

  let userAttempts = {};

/**
 * Handles the POST request to the /verify-passkey URL.
 * Verifies the passkey entered by the user.
 * 
 * @param {string} path - The path to the /verify-passkey URL.
 * @param {function} callback - The callback function to execute.
 * 
 * @returns {object} - Returns a JSON object with the verification status.
 * 
 * @throws {error} - Throws an error if the passkey verification fails.
 * 
 * @requires {function} - Requires the user to be authenticated.
 * 
 */
app.post('/verify-passkey', (req, res) => {
  const { email, passkey } = req.body;
  logger.info(`Request received at /verify-passkey for email: ${email}`);

  // Initialize attempt tracking for the user if it doesn't exist.
  if (!userAttempts[email]) {
    userAttempts[email] = { attempts: 0, suspendedUntil: null };
    logger.info(`Initializing attempt tracking for ${email}`);
  }
  
  // Check if the user is currently suspended.
  const now = new Date();
  if (userAttempts[email].suspendedUntil && userAttempts[email].suspendedUntil > now) {
    logger.warn(`Account for ${email} is suspended. Denying access.`);
    return res.status(403).json({ message: 'Your account is suspended for 1 minute. Try again later.', suspended: true });
  }

  // Proceed with passkey verification...
  const query = 'SELECT secret FROM users WHERE email = ?';
  connection.query(query, [email], async (err, results) => {
    if (err) {
      logger.error(`Error fetching user data for ${email}: ${err}`);
    }
    if (err) {
      console.error(err);
      res.status(500).send({ message: 'Error fetching user data' });
    } 
    else if (results.length > 0 && results[0].secret !== null) {
      const userSecret = results[0].secret;
      logger.info(`Secret fetched for ${email}, proceeding to verify passkey.`);
      const verified = speakeasy.totp.verify({
        secret: userSecret,
        encoding: 'base32',
        token: passkey,
        window: 1 // Allows for some time drift.
      });

      if (verified) {
      // Reset attempt counter on successful verification.
      userAttempts[email] = { attempts: 0, suspendedUntil: null };
      logger.info(`Passkey verified successfully for ${email}`);
      res.send({ message: 'Passkey verified successfully' });
    } else {
      // Increment attempt counter on failure.
      userAttempts[email].attempts += 1;
      logger.warn(`Invalid passkey attempt for ${email}. Attempts: ${userAttempts[email].attempts}`);
      if (userAttempts[email].attempts >= 3) {
        // Suspend the user for 1 minute after 3 failed attempts.
        const suspendedUntil = new Date(now.getTime() + 60 * 1000); // 1 minute suspension
        userAttempts[email] = { attempts: 0, suspendedUntil };
        logger.warn(`Account for ${email} is suspended for 1 minute after 3 failed attempts.`);

        // Update the database with suspension info
        const suspendUserQuery = `UPDATE users SET is_suspended = TRUE, suspended_until = ? WHERE email = ?`;
        connection.query(suspendUserQuery, [suspendedUntil, email], (err, results) => {
        if (err) {
            logger.error(`Database error when suspending user: ${err}`);
        }
      });
      res.status(401).json({ message: 'Invalid passkey. Your account is suspended for 1 minute.', suspended: true });
      } else if (userAttempts[email].attempts === 2) {
        // Refresh the passkey logic here if needed before the final attempt.
        logger.warn(`Invalid passkey for ${email}. Last attempt before suspension.`);
        res.status(401).json({ message: 'Invalid passkey. Last attempt before suspension.', lastAttempt: true });
      } else {
        logger.info(`No user found with email ${email} or user is not enrolled.`);
        res.status(401).json({ message: 'Invalid passkey. Please try again.', retry: true });
      }
    }
  }
});
});

/**
 * Handles the GET request to the /profile-page URL.
 * Redirects the user to the profile.html page.
 * 
 * @param {string} path - The path to the /profile-page URL.
 * @param {function} callback - The callback function to execute.
 * 
 * @requires {function} - Requires the user to be authenticated.
 * 
 * @returns {object} - Redirects the user to the profile.html page.
 * 
 */
app.get('/profile-page', (req, res) => {
  logger.info('Serving profile.html');
  window.location.href = '/profile.html';
});
  
 
app.listen(port, () => {
    logger.info(`Server running at http://localhost:${port}`);
    console.log(`Server running at http://localhost:${port}`);
});
