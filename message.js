'use strict';

const line = require('@line/bot-sdk');
// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

//-------------
// Functions
//-------------
const sendMsgs = function (msgsInput, username) {
  return new Promise(function (resolve, reject) {
    console.log("[Message] Push message start");
    let msgsToSend = [];
    for (const msg of msgsInput) {
      if (msg.isText) {
        //is text
        let output_string = msg.text.replace(/\[USER\]/gi, username);;
        console.log("[Message] Prepare text message : " + output_string);
        msgsToSend.push(getTextMsg(output_string));
      } else {
        //is sticker
        console.log("[Message] Prepare sticker message : package : " + msg.pkgId + ", id : " + msg.stkrId);
        msgsToSend.push(getStickerMsg(msg.pkgId, msg.stkrId));
      }
    }

    console.log("[Message] Start push message");
    client.pushMessage(process.env.GROUP_ID, msgsToSend)
      .then(() => {
        //result
        console.log("[Message] Push message Success !");
        resolve();
      })
      .catch((err) => {
        // error handling
        console.log("[Message] Push message Error : " + err);
        reject("Send message error");
      });
  });
}

const replyMsgs = function (msgsInput, reply_token, username) {
  return new Promise(function (resolve, reject) {
    console.log("[Message] Reply message start");
    let msgsToSend = [];
    for (const msg of msgsInput) {
      if (msg.isText) {
        //is text
        let output_string = msg.text.replace(/\[USER\]/gi, username);;
        console.log("[Message] Prepare text message : " + output_string);
        msgsToSend.push(getTextMsg(output_string));
      } else {
        //is sticker
        console.log("[Message] Prepare sticker message : package : " + msg.pkgId + ", id : " + msg.stkrId);
        msgsToSend.push(getStickerMsg(msg.pkgId, msg.stkrId));
      }
    }

    console.log("[Message] Start reply message");
    client.replyMessage(reply_token, msgsToSend)
      .then(() => {
        //result
        console.log("[Message] Reply message success !");
        resolve();
      })
      .catch((err) => {
        // error handling
        console.log("[Message] Reply message error : " + err);
        reject(err);
      });
  });
}

//-------------
// Export Functions
//-------------
exports.sendMsgs = sendMsgs;
exports.replyMsgs = replyMsgs;

//-------------
// Messages Object
//-------------
function getTextMsg(text) {
  return {
    type: 'text',
    text: text
  };
}

function getStickerMsg(pkgId, stkId) {
  return {
    type: 'sticker',
    packageId: Number(pkgId),
    stickerId: Number(stkId)
  };
}

function getConfirmMsg() {
  return {
    type: "template",
    altText: "在不支援顯示樣板的地方顯示的文字",
    template: {
      type: "confirm",
      text: "標題文字",
      actions: [{
        type: "message",
        label: "第一個按鈕",
        text: "1"
      },
      {
        type: "message",
        label: "第二個按鈕",
        text: "2"
      }
      ]
    }
  }
}

function getButtonsMsg() {
  return {
    type: "template",
    altText: "在不支援顯示樣板的地方顯示的文字",
    template: {
      type: "buttons",
      text: "標題文字",
      actions: [{
        type: "message",
        label: "第一個按鈕",
        text: "1"
      },
      {
        type: "message",
        label: "第二個按鈕",
        text: "2"
      },
      {
        type: "message",
        label: "第三個按鈕",
        text: "3"
      },
      {
        type: "message",
        label: "第四個按鈕",
        text: "4"
      }
      ]
    }
  }
}