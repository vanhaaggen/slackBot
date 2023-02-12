const { App } = require("@slack/bolt");
require("dotenv").config();

const TEST_CHAN = process.env.TEST_CHANNEL_ID;
const TEAM_CHAN = process.env.F_TEAM_CHANNEL_ID;

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  // socketMode: true,
  appToken: process.env.APP_TOKEN,
});

//--------Fisher & Yates shuffle algorithm-------------------------
const shuffle = (userId, members) => {
  const botId = "U03LC3W2936";
  const filteredMembers = members.filter((n) => n !== botId && n !== userId);
  const names = [...filteredMembers];
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
  console.log("SHUFFLE-NAMES", names);
  return names[0];
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

app.command("/prfront", async ({ command, ack, say }) => {
  try {
    await ack();
    const channelInfo = await app.client.conversations.members({
      channel: TEST_CHAN,
    });
    const reviewersInfo = await app.client.users.info({
      user: shuffle(command.user_id, channelInfo.members),
    });

    const prLink = command.text;
    const myName = "U01K2011NE6";
    say({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<@${
              reviewersInfo.user.id
            }>, you have been choosed to review *${adaptName(
              command.user_name
            )}* PR ---> ${adaptURL(prLink)}`,
          },
        },
      ],
    });
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
