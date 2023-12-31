'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const cors = require('cors');

let currentQid = 0;

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
const qArray = [
  {//1
    qImg: "./images/Q1.png",
    ansImg: "./images/A1.png",
    ans: 'D'
  },
  {//2
    qImg: "./images/Q2.png",
    ansImg: "./images/A2.png",
    ans: 'A'
  },
  {//3
    qImg: "./images/Q3.png",
    ansImg: "./images/A3.png",
    ans: 'A'
  },
  {//4
    qImg: "./images/Q4.png",
    ansImg: "./images/A4.png",
    ans: 'C'
  },
  {//5
    qImg: "./images/Q5.png",
    ansImg: "./images/A5.png",
    ans: 'A'
  },
  {//6
    qImg: "./images/Q6.png",
    ansImg: "./images/A6.png",
    ans: 'B'
  },
  {//7
    qImg: "./images/Q7.png",
    ansImg: "./images/A7.png",
    ans: 'C'
  },
  {//8
    qImg: "./images/Q8.png",
    ansImg: "./images/A8.png",
    ans: 'D'
  },
  {//9
    qImg: "./images/Q9.png",
    ansImg: "./images/A9.png",
    ans: 'D'
  },
  {//10
    qImg: "./images/Q10.png",
    ansImg: "./images/A10.png",
    ans: 'C'
  },
  {//11
    qImg: "./images/Q11.png",
    ansImg: "./images/A11.png",
    ans: 'D'
  },
  {//12
    qImg: "./images/Q12.png",
    ansImg: "./images/A12.png",
    ans: 'D'
  },
  {//13
    qImg: "./images/Q13.png",
    ansImg: "./images/A13.png",
    ans: 'B'
  },
  {//14
    qImg: "./images/Q14.png",
    ansImg: "./images/A14.png",
    ans: 'C'
  },
  {//15
    qImg: "./images/Q15.png",
    ansImg: "./images/A15.png",
    ans: 'A'
  },
  {//16
    qImg: "./images/Q16.png",
    ansImg: "./images/A16.png",
    ans: 'B'
  },
  {//17
    qImg: "./images/Q17.png",
    ansImg: "./images/A17.png",
    ans: 'B'
  },
  {//18
    qImg: "./images/Q18.png",
    ansImg: "./images/A18.png",
    ans: 'D'
  },
  {//19
    qImg: "./images/Q19.png",
    ansImg: "./images/A19.png",
    ans: 'B'
  },
  {//20
    qImg: "./images/Q20.png",
    ansImg: "./images/A20.png",
    ans: 'C'
  },
  {//21
    qImg: "./images/Q21.png",
    ansImg: "./images/A21.png",
    ans: 'B'
  },
  {//22
    qImg: "./images/Q22.png",
    ansImg: "./images/A22.png",
    ans: 'A'
  },
  {//23
    qImg: "./images/Q23.png",
    ansImg: "./images/A23.png",
    ans: 'C'
  },
  {//24
    qImg: "./images/Q24.png",
    ansImg: "./images/A24.png",
    ans: 'B'
  },
  {//25
    qImg: "./images/Q25.png",
    ansImg: "./images/A25.png",
    ans: 'B'
  },
  {//26
    qImg: "./images/Q26.png",
    ansImg: "./images/A26.png",
    ans: 'C'
  },
  {//27
    qImg: "./images/Q27.png",
    ansImg: "./images/A27.png",
    ans: 'B'
  },
  {//28
    qImg: "./images/Q28.png",
    ansImg: "./images/A28.png",
    ans: 'B'
  },
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

//app.use(cors());

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
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

app.get('/init', (req, res) => {
  console.log("[Express] Get qid: " + currentQid + "\nq total: " + qArray.length);

  //reset question
  currentQid = 0;

  res.status(200).json({ qid: currentQid, qArray: qArray });
});

app.get('/qans', (req, res) => {
  res.status(200).json({ qid: currentQid, qans: qArray[currentQid] });
});

app.get('/qsammary', (req, res) => {
  //const id = req.query.id;//target question id
  const qStatus = responsePool[currentQid];
  const resCount = {
    A: qStatus.filter(item => item.ans == 'A').length,
    B: qStatus.filter(item => item.ans == 'B').length,
    C: qStatus.filter(item => item.ans == 'C').length,
    D: qStatus.filter(item => item.ans == 'D').length
  }
  const ans = qArray[currentQid].ans
  const rightNum = resCount[ans];
  const wrongNum = qStatus.length - rightNum;
  console.log("[Express] Get sammary: " + JSON.stringify(resCount));
  res.status(200).json({ qid: currentQid, resCount: resCount, ans: ans, right: rightNum, wrong: wrongNum });
});

app.get('/qleader', async (req, res) => {
  let correctPool = [];
  responsePool.forEach((qResArray, index) => {
    const correctPeopleOfQ = qResArray.filter(item => item.ans == qArray[index].ans);
    correctPool = [...correctPool, ...correctPeopleOfQ];
  });
  const correctPeople = correctPool.map(item => item.id);

  //count duplicated
  const counts = {};
  correctPeople.forEach(function (x) { counts[x] = (counts[x] || 0) + 1; });
  console.log("Correct answer count" + JSON.stringify(counts))

  //generate result
  const userIds = Object.keys(counts)
  const userCounts = userIds.map(userId => {
    const user = getUserById(userId)
    const obj = {
      id: userId,
      name: user.name,
      avatarUrl: user.avatarUrl,
      score: counts[userId]
    }
    return obj
  })

  //sort result
  userCounts.sort((a, b) => b.score - a.score);

  //add ranking
  let currentRank = 1;
  userCounts.forEach((user, index) => {
    if (index > 0 && user.score !== userCounts[index - 1].score) {
      currentRank += 1;
    }
    user.rank = currentRank;
  })

  console.log("[Express] Get leaderboard: " + JSON.stringify(userCounts));
  res.status(200).json({ qid: currentQid, qleader: userCounts });
});

app.post('/reset', (req, res) => {
  currentQid = 0;
});

app.post('/next', (req, res) => {
  //const id = req.body.id;//target question id
  currentQid = currentQid + 1;
  console.log("[Express] next page: " + currentQid);
  res.status(200).json({ qid: currentQid, qtotal: qArray.length });
});

app.post('/prev', (req, res) => {
  currentQid = currentQid - 1;
  console.log("[Express] prev page: " + currentQid);
  res.status(200).json({ qid: currentQid, qtotal: qArray.length });
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

  const context = parseContext(await event.message.text);
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
    text: '問題' + (currentQid + 1) + '\n已收到你的答案: ' + context
  };
  return client.replyMessage(event.replyToken, echo);
}

const parseContext = (input) => {
  const upperInput = input.toUpperCase();
  if (upperInput == 'Ａ') return 'A';
  if (upperInput == 'Ｂ') return 'B';
  if (upperInput == 'Ｃ') return 'C';
  if (upperInput == 'Ｄ') return 'D';
  return upperInput;
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
      const newUser = {
        id: userId,
        avatarUrl: user.pictureUrl,
        name: user.displayName
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
    let lastAnswer = responsePool[currentQid]?.find(item => item.id === userId);
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
      responsePool[currentQid].push(newAnswer)
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