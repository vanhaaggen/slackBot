const { App } = require("@slack/bolt");
const { MongoClient } = require("mongodb");
const mongoose = require("mongoose");
const SlackUser = require("./database/schemas/index");

require("dotenv").config();

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

// Slack app setup
const TEST_CHAN = process.env.TEST_CHANNEL_ID;
const TEAM_CHAN = process.env.F_TEAM_CHANNEL_ID;

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.APP_TOKEN,
});

//--------Fisher & Yates shuffle algorithm-------------------------
const shuffle = (userId, members) => {
  const botId = "U03LC3W2936";
  // const filteredMembers = members.filter((n) => n !== botId && n !== userId);

  // if (!filteredMembers?.length) {
  //   return {
  //     error:
  //       "Sorry, Unable to select a reviewer. You are the only one in this group",
  //   };
  // } else {
  const names = [userId]; // [...filteredMembers];
  let currentIndex = names.length,
    temporaryValue,
    randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    temporaryValue = names[currentIndex];
    names[currentIndex] = names[randomIndex];
    names[randomIndex] = temporaryValue;
  }
  return { name: names[0] };
  // }
};

const adaptURL = (url) => {
  const adaptedUrl = url.split(">").shift().split("/");
  const pullNum = adaptedUrl.pop();
  return `${adaptedUrl.join("/")}/${pullNum}|${pullNum}>`;
};

const adaptName = (name) => {
  const firstName = name.split(".").shift();
  return `${firstName.charAt(0).toUpperCase() + firstName.slice(1)}'s`;
};

// Slack bold method
app.command("/prfront", async ({ command, ack, say }) => {
  try {
    await ack();

    const channelInfo = await app.client.conversations.members({
      channel: TEST_CHAN,
    });
    console.log("USER---", channelInfo);
    // search for user in the databes
    const user = await SlackUser.findOne({ slackUserId: command.user_id });
    let selectedUserForPr;
    if (user) {
      // if user exist, get users assignedNames and selectUserForPr
      selectedUserForPr = shuffle(user.slackUserId, user.assignedNames);
      // remove the selected user from the assignedNames array and update collection
      await SlackUser.updateOne(
        { slackUserId: user.slackUserId },
        { $pull: { assignedNames: selectedUserForPr } }
      );
    } else {
      // if user Not exist, create user and assign names to assignedNames
      selectedUserForPr = shuffle(command.user_id, channelInfo.members);
      // if error we return and break the execution
      if (selectedUserForPr.name.length) {
        // Update the list of members to only the not selected ones
        const updatedUserList = channelInfo.members.filter(
          (user) => user !== selectedUserForPr
        );
        // create and add a new user to the collection
        const newUser = new SlackUser({
          name: command.user_name,
          slackUserId: command.user_id,
          assignedNames: updatedUserList,
        });
        await newUser.save();
      }
    }

    const sendResponse = (textRes) =>
      say({
        text: "Selected person for reviewing a pull request on github",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: textRes,
            },
          },
        ],
      });

    if (selectedUserForPr?.error?.length) {
      return sendResponse(selectedUserForPr?.error);
    } else {
      console.log("reviewersInfo", selectedUserForPr);
      const reviewersInfo = await app.client.users.info({
        user: selectedUserForPr?.name,
      });

      const prLink = command.text;

      const myName = "U01K2011NE6";

      const responseText = `<@${
        reviewersInfo.user.id
      }>, you have been choosed to review *${adaptName(
        command?.user_name
      )}* PR ---> ${adaptURL(prLink)}`;

      return sendResponse(responseText);
    }
  } catch (error) {
    console.log("err");
    console.error(error);
  }
});

(async () => {
  const port = 3000;
  await app.start(process.env.PORT || port);
  console.log(`⚡️ Slack Bolt app is running on port ${port}!`);
})();
