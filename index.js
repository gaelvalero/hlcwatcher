const fs = require('fs');
const readline = require('readline');
const {
  google
} = require('googleapis');

const Discord = require('discord.js');
const client = new Discord.Client();

var arrayTimes = new Object;
var newTimes = [];

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

var spreadsheet = process.argv[2];
var sheet = process.argv[3];

// Load client secrets from a local file.
fs.readFile('/home/hiteam/Documents/hlcwatcher/credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Sheets API.
  authorize(JSON.parse(content), listTimes);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {
    client_secret,
    client_id,
    redirect_uris
  } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function listTimes(auth) {
  const sheets = google.sheets({
    version: 'v4',
    auth
  });
  sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheet,
    range: sheet + '!A2:I',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    if (rows.length) {

      var arrayFH4HLC = new Array();
      var arrayFM7HLC = new Array();
      var arrayFH4DRIFT = new Array();

      rows.map((row) => {
        let timestamp = `${row[0]}`;
        let nickname = `${row[1]}`;
        let fh4time = `${row[2]}`;
        let fh4proof = `${row[3]}`;
        if (fh4time != '' && fh4time != 'undefined' && fh4time != '.') {
          arrayFH4HLC.push({
            time: timestamp,
            name: nickname,
            score: fh4time,
            proof: fh4proof
          });
        }
      });
      arrayTimes['fh4hlc'] = arrayFH4HLC;

      rows.map((row) => {
        let timestamp = `${row[0]}`;
        let nickname = `${row[1]}`;
        let fm7time = `${row[4]}`;
        let fm7proof = `${row[5]}`;

        if (fm7time != '' && fm7time != 'undefined' && fm7time != '.') {
          arrayFM7HLC.push({
            time: timestamp,
            name: nickname,
            score: fm7time,
            proof: fm7proof
          });
        }
      });
      arrayTimes['fm7hlc'] = arrayFM7HLC;

      rows.map((row) => {
        let timestamp = `${row[0]}`;
        let nickname = `${row[1]}`;
        let fh4drift = `${row[6]}`;
        let fh4proof = `${row[7]}`;

        if (fh4drift != '' && fh4drift != 'undefined' && fh4drift != '.') {
          arrayFH4DRIFT.push({
            time: timestamp,
            name: nickname,
            score: fh4drift,
            proof: fh4proof
          });
        }
      });
      arrayTimes['fh4drift'] = arrayFH4DRIFT;
    } else {
      console.log('No data found.');
    }
    if (Object.keys(arrayTimes).length === 0 && arrayTimes.constructor === Object) {
      console.log("Error retrieving the data");
      client.destroy();
      return;
    }
    console.log(`Comparing new data`);
    var fileData = {};
    if (fs.existsSync(spreadsheet + '.txt')) {
      fs.readFile(spreadsheet + '.txt', 'utf8', function (err, data) {
        if (err) throw err;
        fileData = JSON.parse(data);
        if (JSON.stringify(fileData) === JSON.stringify(arrayTimes)) {
          console.log(`No differences found`);
          client.destroy();
        } else {
          console.log(`Differences found - Checking values`);

          var arrayNewFH4HLC = arrayTimes.fh4hlc;
          var arrayNewFM7HLC = arrayTimes.fm7hlc;
          var arrayNewFH4DRIFT = arrayTimes.fh4drift;

          var arrayOldFH4HLC = fileData.fh4hlc;
          var arrayOldFM7HLC = fileData.fm7hlc;
          var arrayOldFH4DRIFT = fileData.fh4drift;


          if (!arraysEqual(arrayNewFH4HLC, arrayOldFH4HLC)) {
            console.log(`Checking FH4 HLC values`);
            for (let x = 0; x < arrayNewFH4HLC.length; x++) {
              var check = 0;
              for (let y = 0; y < arrayOldFH4HLC.length; y++) {
                if (JSON.stringify(arrayNewFH4HLC[x]) === JSON.stringify(arrayOldFH4HLC[y])) {
                  check = 1;
                }
              }
              if (check != 1) {
                console.log('+ New FH4 HLC entry found');
                newTimes.push(arrayNewFH4HLC[x]);
              }
            }
          }

          if (!arraysEqual(arrayNewFM7HLC, arrayOldFM7HLC)) {
            console.log(`Checking FM7 HLC values`);
            for (let x = 0; x < arrayNewFM7HLC.length; x++) {
              var check = 0;
              for (let y = 0; y < arrayOldFM7HLC.length; y++) {
                if (JSON.stringify(arrayNewFM7HLC[x]) === JSON.stringify(arrayOldFM7HLC[y])) {
                  check = 1;
                }
              }
              if (check != 1) {
                console.log('+ New FM7 HLC entry found');
                newTimes.push(arrayNewFM7HLC[x]);
              }
            }
          }

          if (!arraysEqual(arrayNewFH4DRIFT, arrayOldFH4DRIFT)) {
            console.log(`Checking FH4 Drift values`);
            for (let x = 0; x < arrayNewFH4DRIFT.length; x++) {
              var check = 0;
              for (let y = 0; y < arrayOldFH4DRIFT.length; y++) {
                if (JSON.stringify(arrayNewFH4DRIFT[x]) === JSON.stringify(arrayOldFH4DRIFT[y])) {
                  check = 1;
                }
              }
              if (check != 1) {
                console.log('+ New FH4 Drift entry found');
                newTimes.push(arrayNewFH4DRIFT[x]);
              }
            }
          }
          console.log(`Creating new Backup`);
          var json = JSON.stringify(arrayTimes);
          fs.writeFile(spreadsheet + '.txt', json, function (err) {
            if (err) return console.log(err);
          });
          client.login('your_discord_token');
        }
      });
    } else {
      console.log(`Backup file not found - creating one`);
      var json = JSON.stringify(arrayTimes);
      fs.writeFile(spreadsheet + '.txt', json, function (err) {
        if (err) return console.log(err);
      });
      client.destroy();
      return;
    }
  });
}

client.on('ready', () => {

  console.log(`Logged in as ${client.user.tag}!`);

  // notify admins of new entries
          /*var channel = client.channels.find('name','admin');
          channel.send(`There's ` + newTimes.length + ` entries on the HLC leaderboards`);*/
          if(newTimes.length > 0)
          {
            const channel = client.channels.find('name','forza-hot-lap-challenge');

            if(!channel){
              console.log('HLC channel not found');
              return;
            }
  
            channel.fetchMessages({
              limit: 3
            }).then(messages => channel.bulkDelete(messages));
        
            arrayTimes['fh4drift'] = arrayTimes['fh4drift'].sort(dynamicSort('-score'));
            arrayTimes['fh4hlc'] = timeSort(arrayTimes['fh4hlc']);
            arrayTimes['fm7hlc'] = timeSort(arrayTimes['fm7hlc']);
        
            var messageLeaderboardFH4Drift = '';
            var index = 1;
            if(arrayTimes['fh4drift'].length > 0)
            {
              arrayTimes['fh4drift'].forEach(element => {
                messageLeaderboardFH4Drift += "**" + index + '**. ' + element['name'] + ' - ' + element['score'] + '\n';
                index++;
              });
            }
            else
            {
              messageLeaderboardFH4Drift = "There's no entries in this leaderboard !"
            }
        
            var messageLeaderboardFH4HLC = '';
            index = 1;
            if(arrayTimes['fh4hlc'].length > 0)
            {
              arrayTimes['fh4hlc'].forEach(element => {
                messageLeaderboardFH4HLC += "**" + index + '**. ' + element['name'] + ' - ' + element['score'] + '\n';
                index++;
              });
            }
            else
            {
              messageLeaderboardFH4HLC = "There's no entries in this leaderboard !"
            }
        
            var messageLeaderboardFM7HLC = '';
            index = 1;
            if(arrayTimes['fm7hlc'].length > 0)
            {
              arrayTimes['fm7hlc'].forEach(element => {
                messageLeaderboardFM7HLC += "**" + index + '**. ' + element['name'] + ' - ' + element['score'] + '\n';
                index++;
              });
            }
            else
            {
              messageLeaderboardFM7HLC = "There's no entries in this leaderboard !"
            }

            channel.send({
              embed: {
                title: "Current leaderboards for FH4 HLC",
                color: 0xe67e22,
                timestamp: new Date(),
                fields: [{
                  name: "FH4 HLC",
                  value: messageLeaderboardFH4HLC
                }, ]
              }
            }).then(() => channel.send({
              embed: {
                title: "Current leaderboards for FM7 HLC",
                color: 0x2980b9,
                timestamp: new Date(),
                fields: [{
                  name: "FM7 HLC",
                  value: messageLeaderboardFM7HLC
                }, ]
              }
            })).then(() => channel.send({
              embed: {
                title: "Current leaderboards for FH4 Drift",
                color: 0x8e44ad,
                timestamp: new Date(),
                fields: [{
                  name: "FH4 Drift",
                  value: messageLeaderboardFH4Drift
                }, ]
              }
            })).then(() => console.log("All message are sent")).then(() => client.destroy());
          }
});

/*client.on('message', message => {
  if (message.content === '!update') {
    message.delete(1);
    /*newTimes.forEach(element => {
      message.channel.send({
        embed: {
          title: "New Entry",
          color: 282745,
          timestamp: new Date(),
          image: {
            url: element['proof']
          },
          fields: [{
            name: "Player : " + element['name'],
            value: element['score']
          }, ]

        }
      });
    });*/
  /*}
})*/


function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length)
    return false;
  for (var i = arr1.length; i--;) {
    if (arr1[i] !== arr2[i])
      return false;
  }
  return true;
}

function dynamicSort(property) {
  var sortOrder = 1;
  if (property[0] === "-") {
    sortOrder = -1;
    property = property.substr(1);
  }
  return function (a, b) {
    var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
    return result * sortOrder;
  }
}

function timeSort(array) {
  for (var i = 0; i < array.length; i++) {
    //set min to the current iteration of i
    var min = i;
    for (var j = i + 1; j < array.length; j++) {
      if (array[j]['score'].replace(":", "").replace(":", "").replace(".", "").replace(",", "") < array[min]['score'].replace(":", "").replace(":", "").replace(".", "").replace(",", "")) {
        min = j;
      }
    }
    swap(array, i, min);
  }
  return array;
}

function swap(array, firstIndex, secondIndex) {
  var temp = array[firstIndex];
  array[firstIndex] = array[secondIndex];
  array[secondIndex] = temp;
};