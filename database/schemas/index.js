const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema({
  name: {
    type: String,
    reqired: true,
  },
  slackUserId: {
    type: String,
    required: true,
  },
  assignedNames: {
    type: Array,
    required: true,
  },
  createdAt: { type: Date, default: Date.now() },
});

const SlackUser = mongoose.model("SlackUser", usersSchema);

module.exports = SlackUser;
