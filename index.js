'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

//---------------
// line sdk
//---------------
// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

//---------------
// express server
//---------------
// create Express app
const app = express();
//app.use(express.json());

// register a webhook handler with middleware
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// listen on port
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`express listening on ${port}`);
});

//---------------
// socket server
//---------------
// const server = http.createServer(app);
const wss = new WebSocket.Server({ server: server });

let BULLETS = '';
let USER_AVATAR = '';
wss.on('connection', function connection(ws) {
  console.log('[WS] socket connected');

  // Send global message to Client in the schedule.
  const sendNowTime = setInterval(() => {
    ws.send(JSON.stringify({ text: BULLETS, avatar: USER_AVATAR }));
    BULLETS = '';
    USER_AVATAR = ''; // Refresh
    console.log("interval triggered")
  }, 2000);

  ws.on('message', function message(data) {
    data = data.toString()
    console.log('[WS] received: '+ data);
    ws.send(data);//echo
  });

  ws.on('error', (e) => {
    console.log('[WS] socket error: ' + JSON.stringify(e));
  });

  ws.on('close', () => {
    wss.clients.clear;
    clearInterval(sendNowTime);
    console.log('[WS] socket closed');
  });

  ws.send('[WS] connection initialized');
});

// server.listen(4000, () => {
//   console.log(`websocket listening on ${port}`);
// });

//---------------
// static web
//---------------
app.use(express.static(path.join(__dirname, 'public')));

//---------------
// event handler
//---------------
let index = 0;
async function handleEvent(event) {
  console.log("Event : " + JSON.stringify(event));
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  const user = await client.getProfile(event.source.userId);
  const context = await event.message.text;
  const contentTime = event.message.timestamp
  const echo = {
    type: 'text',
    text: '問題' + (index +1) + '\n已收到你的答案: ' + context
  };

  BULLETS  = context
  USER_AVATAR = await user.pictureUrl;
  console.log("get text: " + context + "\nfrom user: " + user + '\nuser pic: ' + USER_AVATAR)

  return client.replyMessage(event.replyToken, echo);
}

// const handleEvent = (event) => {
//   console.log("Event : " + JSON.stringify(event));

//   switch (event.type) {
//     case 'join':
//     case 'follow':
//       break;
//     case 'memberJoined':
//       break;
//     case 'message':
//       if (event.message.type == 'text') {
//         //get response

//         const senderId = event.source.userId
//         const content = event.message.text
//         const contentTime = event.message.timestamp
//         console.log("get text: " + content + "\nfrom user: " + senderId)

//         // Send  msg to user
//         const dataToEmit = {
//           message: content,
//           username: senderId,
//           __createdtime__: contentTime,
//         }

//         console.log("connections: " + connections)
//         connections.forEach(client => {
//           console.log("connections client: " + client)
//           client.send(dataToEmit)
//         });

//         console.log("wss client num: " + wss.clients.size)
//         wss.clients.forEach(client => {
//           console.log("wss.clients client: " + client)
//           client.send(dataToEmit);
//        });

//         return true;
//       }
//       break;
//   }
// }

// Message event example

// {
//   "type": "message",
//   "replyToken": "8bacc0234a5147eaa80f493fc4a74aeb",
//   "source": {
//     "userId": "U911be356817fdf027cdda8352cea59cb",
//     "type": "user"
//   },
//   "timestamp": 1540801124273,
//   "message": {
//     "type": "text",
//     "id": "8785838735289",
//     "text": "1"
//   }
// }

//{
//  "type": "message",
//  "replyToken": "6603176c7a1442908bd4b4ee6815d3e7",
//  "source": {
//    "groupId": "C779658f5ee9d3375736f89bd6c364440",
//    "userId": "U911be356817fdf027cdda8352cea59cb",
//    "type": "group"
//  },
//  "timestamp": 1540801146468,
//  "message": {
//    "type": "text",
//    "id": "8785840232605",
//    "text": "test"
//  }
//}