# hlcwatcher

Node.js Discord Bot to retrieve data out of a Google Sheet document to a Discord leaderboard text

You'll need a Discord Bot token, and a Google Sheet API token

Requires node, npm, discord.js, googleapis

- Google Sheet API : https://developers.google.com/sheets/api/quickstart/nodejs
- Discord applications : https://discordapp.com/developers/applications/

You have to paste your bot token in index.js, line 236.
On first launch, googleapis will ask for authorization to read the tied Google account's spreadsheets by visiting a link.
After accepting, the key given is to be sent where you launched the command.

Install dependencies with npm : install

Launch data retrieval with the command : node . <sheetId> <sheetName>

Example : https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0

1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms is the Spreadsheet ID
Class Data is the sheet name

v1 : avoid spaces or "/" character in sheet's name
To do : handle first retrieval, do not delete the last 3 messages

Invite link : https://discordapp.com/oauth2/authorize?client_id=your_client_bot_id&scope=bot&permissions=8192

Requires permission (and 2FA from user adding the bot): 
  - Manage Messages
