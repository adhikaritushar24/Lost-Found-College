const { Agenda } = require("agenda");

const agenda = new Agenda({
  db: { address: process.env.MONGO_URI, collection: "agendaJobs" },
  processEvery: "5 seconds",
  maxConcurrency: 5, // don't overload the AI service with too many jobs at once
});

module.exports = agenda;