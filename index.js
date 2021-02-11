const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let CLUBHOUSE_API_TOKEN;
let CLUBHOUSE_TEAM_NAME;
let LINEAR_API_TOKEN;
let LINEAR_TEAM_NAME;

let storiesFound = 0;
let storiesImported = 0;

const clubHouseUrl = 'https://api.clubhouse.io/api/v3';
const linearUrl

function loadStories() {
  return Promise.all(['feature', 'bug', 'chore'].map((storyType) => {
    return axios(`${clubHouseUrl}/stories/search?token=${CLUBHOUSE_API_TOKEN}`, { headers: { story_type: storyType } });
  }));
}

function createLinearStory(story) {
  // Format from clubhouse to linear, filter out by team
  rl.question(`Import this ticket ?\n${'-'.repeat(80)}${JSON.stringify(story)}\n\nY/N\n`, (answer) => {
    if (answer.toLowerCase() === 'y') {
      // TODO
    }
  });
}

function init() {
  { TEAM_NAME, CLUBHOUSE_API_TOKEN, LINEAR_API_TOKEN, LINEAR_TEAM_NAME } = process.env;
  
  return loadStories().then((stories) => {
    storiesFound = stories.length;
    return Promise.all(stories.map(createLinearStory));
  });
}

init();
