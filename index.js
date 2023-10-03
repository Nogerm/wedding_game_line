'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const messageFactory = require('./message');

// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

// create Express app
// about Express itself: https://expressjs.com/
const app = express();
app.use(express.json());

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

// api for get messages template
app.get('/msgTemplate', (req, res) => {
  console.log("[Main] get message template");
  const temp = {
    "data": [
      {
        "isText": true,
        "text": "訊息"
      },
      {
        "isText": false,
        "pkgId": 6632,
        "stkrId": 11825376
      }
    ]
  };
  res.send(JSON.stringify(temp));
})

// api for send push messages
app.post('/pushMsg', (req, res) => {
  console.log("[Main] push message req:\n" + JSON.stringify(req.body));
  messageFactory.sendMsgs(req.body.data)
    .then(() => {
      res.send("[Main] push message successed: " + JSON.stringify(req.body.data));
    })
    .catch(err => {
      res.status(500).end();
    })
})

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});

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
      if (event.message.type === 'text') {
        //get response

        const content = event.message.text
        console.log("get text: " + content + "\nfrom user: " + event.source.userId)

        return true;
      }
      break;
  }
}


//-----------
// Utility
//-----------
function getRandom(max_value, seed) {
  seed = Math.sin(seed) * 10000;
  const result = seed - Math.floor(seed);
  return Math.floor(result * max_value);
};

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