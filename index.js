'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const cors = require('cors');

let qId = 0;
let qTotal = 10;

let userPool = [];
let responsePool = [
  [],//1
  [],//2
  [],//3
  [],//4
  [],//5
  [],//6
  [],//7
  [],//8
  [],//9
  []//10
];
const answerArray = [
  'A',//1
  'B',//2
  'C',//3
  'C',//4
  'A',//5
  'B',//6
  'C',//7
  'D',//8
  'A',//9
  'A'//10
]

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

app.use(cors({
  origin: 'http://localhost:3000'
}));

// register a webhook handler with middleware
app.post('/webhook', line.middleware(config), (req, res) => {
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
app.listen(port, () => {
  console.log(`express listening on ${port}`);
});

//---------------
// api
//---------------

app.get('/qid', (req, res) => {
  console.log("[Express] Get qid: " + qId + "\nq total: " + qTotal);
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.status(200).json({ qid: qId, qtotal: qTotal });
});

app.get('/qsammary', (req, res) => {
  //const id = req.query.id;//target question id
  const qStatus = responsePool[qId];
  const resCount = {
    a: qStatus.filter(item => item.ans == 'A').length,
    b: qStatus.filter(item => item.ans == 'B').length,
    c: qStatus.filter(item => item.ans == 'C').length,
    d: qStatus.filter(item => item.ans == 'D').length
  }
  console.log("[Express] Get sammary: " + JSON.stringify(resCount));
  res.status(200).json({ qid: qId, resCount: resCount });
});

app.get('/qleader', async (req, res) => {
  let correctPool = [];
  responsePool.forEach((qResArray, index) => {
    const correctPeopleOfQ = qResArray.filter(item => item.ans == answerArray[index]);
    correctPool = [...correctPool, ...correctPeopleOfQ];
  });

  const correctPeople = correctPool.map(item => item.id);

  //count duplicated
  const counts = {};
  correctPeople.forEach(function (x) { counts[x] = (counts[x] || 0) + 1; });
  console.log(JSON.stringify(counts))

  const userIds = Object.keys(counts)

  const userCounts = userIds.map(userId => {
    const obj = {
      id: userId,
      avatar: getUserById(userId).avatarUrl,
      score: counts[userId]
    }
    return obj
  })

  console.log("[Express] Get leaderboard: " + JSON.stringify(userCounts));
  res.status(200).json({ qid: qId, qleader: userCounts });
});

app.post('/next', (req, res) => {
  //const id = req.body.id;//target question id
  qId = qId + 1;
  console.log("[Express] next page: " + qId);
  res.status(200).json({ qid: qId, qtotal: qTotal });
});

app.post('/prev', (req, res) => {
  qId = qId - 1;
  console.log("[Express] prev page: " + qId);
  res.status(200).json({ qid: qId, qtotal: qTotal });
});

//---------------
// socket server
//---------------
const server = http.createServer(app);
const wss = new WebSocket.Server({ server: server });
wss.on('connection', (ws) => {
  console.log('[WS] socket connected');

  ws.on('message', function message(data) {
    data = data.toString()
    console.log('[WS] received: ' + data);
    ws.send(data);//echo
  });

  ws.on('error', (e) => {
    console.log('[WS] socket error: ' + JSON.stringify(e));
  });

  ws.on('close', () => {
    wss.clients.clear;
    console.log('[WS] socket closed');
  });

  ws.send('[WS] connection initialized');
});

server.listen(4000, () => {
  console.log(`websocket listening on ${port}`);
});

//---------------
// static web
//---------------
app.use(express.static(path.join(__dirname, 'public')));

//---------------
// event handler
//---------------
const handleEvent = async (event) => {
  console.log("Event : " + JSON.stringify(event));
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    console.log("ignore non-text-message event")
    return Promise.resolve(null);
  }

  const context = await event.message.text;
  console.log("context: " + context)
  if (context !== 'A' && context !== 'B' && context !== 'C' && context !== 'D') {
    // irrelavent response
    console.log("irrelavent response")
    const echo = {
      type: 'text',
      text: '我看不懂你的回答\n請用下方的選單作答'
    };
    return client.replyMessage(event.replyToken, echo);
  }

  const userId = event.source.userId
  //const contentTime = event.message.timestamp

  await addUserIfNotExist(userId)
  await updateUserAnswer(userId, context)

  console.log("user pool: " + JSON.stringify(userPool));
  console.log("answer pool: " + JSON.stringify(responsePool));

  //reply user
  const echo = {
    type: 'text',
    text: '問題' + (qId + 1) + '\n已收到你的答案: ' + context
  };
  return client.replyMessage(event.replyToken, echo);
}

const addUserIfNotExist = (userId) => {
  return new Promise(async (resolve, reject) => {
    const idx = userPool.findIndex(item => item.id === userId);
    if (idx > -1) {
      //user exist
      const foundUser = userPool[idx];
      console.log("user found: " + JSON.stringify(foundUser))
      resolve(foundUser)
    } else {
      //add new user
      const user = await client.getProfile(userId);
      const userAvatarUrl = user.pictureUrl;
      const newUser = {
        id: userId,
        avatarUrl: userAvatarUrl
      }
      userPool.push(newUser);
      resolve(newUser)
    }
  })
}

const getUserById = (userId) => {
  return userPool.find(user => user.id == userId)
}

const updateUserAnswer = async (userId, response) => {
  return new Promise(async (resolve, reject) => {
    let lastAnswer = responsePool[qId]?.find(item => item.id === userId);
    if (lastAnswer != undefined) {
      //already answered, update answer
      if (lastAnswer.ans != response) {
        lastAnswer.ans = response
        console.log("update answer to: " + response)
        resolve(lastAnswer)
      } else {
        //same answer, no need update
        console.log("same answer, no need update")
        resolve()
      }
    } else {
      //add new answer
      const newAnswer = {
        id: userId,
        ans: response
      }
      responsePool[qId].push(newAnswer)
      console.log("add new answer: " + JSON.stringify(newAnswer))
      resolve(newAnswer)
    }
  });
}

const summaryOne = async (index) => {
  return new Promise(async (resolve, reject) => {

  });
}

const leaderBoard = async (index) => {
  return new Promise(async (resolve, reject) => {

  });
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