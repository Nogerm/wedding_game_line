'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
//const messageFactory = require('./message');
const http = require('http');
const path = require('path');
const expressWs = require('express-ws');

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
expressWs(app);
app.ws('/', function (ws, req) {
  console.log('socket running');
  ws.send('hello')

  ws.on('message', function (msg) {
    console.log(`Receive message: ${msg}`);
  });
  ws.onopen = function () {
    console.log('app connected to websocket!');
  };
  ws.onmessage = function (message) {
    console.log(message);
  };

});



// const socket_server = http.createServer(app);
// const io = socket(socket_server);

// io.on('connection', (socket) => {
//   console.log('Socket.io init success');

//   socket.on('disconnect', () => {
//     console.log('user disconnected');
//   });
// });

// socket_server.listen(3001, () => {
//   console.log(`socket listening on ${port}`);
// });

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
        // const dataToEmit = {
        //   message: content,
        //   username: senderId,
        //   __createdtime__: contentTime,
        // }
        // io.sockets.emit('receive_message', dataToEmit);
        // console.log("data emitted: " + JSON.stringify(dataToEmit))

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