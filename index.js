'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
//const messageFactory = require('./message');
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
// about Express itself: https://expressjs.com/
const app = express();
//app.use(express.json());

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// api for send push messages
// app.post('/pushMsg', (req, res) => {
//   console.log("[Main] push message req:\n" + JSON.stringify(req.body));
//   messageFactory.sendMsgs(req.body.data)
//     .then(() => {
//       res.send("[Main] push message successed: " + JSON.stringify(req.body.data));
//     })
//     .catch(err => {
//       res.status(500).end();
//     })
// })

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`express listening on ${port}`);
});

//---------------
// socket server
//---------------
const wss = new WebSocket.Server({ port: 8080 });
let _ws = null
wss.on('connection', function connection(ws) {
  console.log('socket connected');
  _ws = ws

  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });

  ws.on('error', console.error);

  ws.send('something from server');
});

//---------------
// static web
//---------------
app.use(express.static(path.join(__dirname, 'public')));

//---------------
// event handler
//---------------
function handleEvent(event) {
  console.log("Event : " + JSON.stringify(event));

  switch (event.type) {
    case 'join':
    case 'follow':
      break;
    case 'memberJoined':
      break;
    case 'message':
      if (event.message.type == 'text') {
        //get response

        const senderId = event.source.userId
        const content = event.message.text
        const contentTime = event.message.timestamp
        console.log("get text: " + content + "\nfrom user: " + senderId)

        // Send  msg to user
        const dataToEmit = {
          message: content,
          username: senderId,
          __createdtime__: contentTime,
        }

        if (ws) {
          console.log("data send: " + dataToEmit)
          ws.send(dataToEmit);
        } else {
          console.log("ws not exist")
        }

        return true;
      }
      break;
  }
}

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