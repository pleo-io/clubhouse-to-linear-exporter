const axios = require('axios');
const readline = require('readline');

const { TEAM_NAME, CLUBHOUSE_API_TOKEN, LINEAR_API_TOKEN } = process.env;

const clubHouseUrl = 'https://api.clubhouse.io/api/v3';
const linearUrl = 'https://api.linear.app/graphql';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const teamMap = {
  phoenix: {
    clubhouse: {
      id: '8',
      states: {
        500000053: 'todo',
        500000051: 'in_progress',
        500000863: 'awaiting_review',
      },
    },
    linear: {
      id: '176367b8-3474-446b-8a81-07a2b5f4865a',
      labels: {
        chore: '288526d2-bca9-4774-aced-adb649dff0dc',
        bug: '14f2f2b7-c427-4fa0-a91b-248d319dac65',
        feature: 'c4f28ecc-71e8-48e3-bc87-1cf0a0a47627',
      },
      states: {
        todo: 'a951c950-67b6-452f-ba28-dde08d4649f1',
        in_progress: 'd9ff6f99-9249-4627-a245-5b3c45c96887',
        awaiting_review: 'd9ff6f99-9249-4627-a245-5b3c45c96887',
      },
    },
  },
};

let storiesFound = 0;
let storiesReviewed = 0;
let storiesImported = 0;

function sequence(array, operation) {
  return array.reduce((promiseChain, item, index) => {
    return promiseChain.then((chainResults) => {
      return operation(item, index).then((currentResult) => [...chainResults, currentResult]);
    });
  }, Promise.resolve([]));
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function loadStories() {
  return axios.post(`${clubHouseUrl}/stories/search`, {
    archived: false,
    workflow_state_types: ['unstarted', 'started'],
    project_ids: [teamMap[TEAM_NAME].clubhouse.id],
  }, {
    headers: { 'Clubhouse-Token': CLUBHOUSE_API_TOKEN },
    params: {
      token: CLUBHOUSE_API_TOKEN,
    },
  }).then(null, (err) => console.log(JSON.stringify(err.response.data)));
}

function createLinearStory(story) {
  const { promise, resolve, reject } = deferred();

  console.clear();
  console.log(`Story ${++storiesReviewed} / ${storiesFound}\n\n`);

  axios.get(`${clubHouseUrl}/stories/${story.id}`, {
    headers: { 'Clubhouse-Token': CLUBHOUSE_API_TOKEN },
    params: {
      token: CLUBHOUSE_API_TOKEN,
    },
  }).then((storyDetails) => {
    const currentState = teamMap[TEAM_NAME].clubhouse.states[story.workflow_state_id];

    rl.question(`\t#${story.id}\t[${story.story_type}]\t[${currentState}]\t${story.name}\n\n\t${storyDetails.data.description}\n\n\t${story.created_at}\n\n\t${story.app_url}\n\n${'-'.repeat(80)}\nImport this ticket (Y/N)?: `, (answer) => {
      if (answer[0] && answer[0].toLowerCase() === 'y') {
        console.log('\nImporting...');

        return axios.post(linearUrl, { query: `
          mutation {
            issueCreate(
              input: {
                title: ${JSON.stringify(storyDetails.data.name)}
                description: ${JSON.stringify(storyDetails.data.description + `\n\n Clubhouse Ticket: ${story.app_url}`)}
                teamId: "${teamMap[TEAM_NAME].linear.id}"
                stateId: "${teamMap[TEAM_NAME].linear.states[currentState]}"
                labelIds: ["${teamMap[TEAM_NAME].linear.labels[story.story_type]}"]
              }
            ) {
              success
              issue {
                id
                title
              }
          } }
          `
        }, { headers: { Authorization: LINEAR_API_TOKEN } })
          .then(() => {
            storiesImported++;
            resolve(story.id);
          }, (err) => {
            console.log(err.response.data);
            process.exit(1);
          });
      }

      resolve(story.id);
    });

  }, reject);

  return promise;
}

function init() {
  if (!TEAM_NAME) throw new Error(`Missing TEAM_NAME env variable. Must be one of [${Object.keys(teamMap)}]`);
  if (!CLUBHOUSE_API_TOKEN) throw new Error(`Missing CLUBHOUSE_API_TOKEN env variable.`);
  if (!LINEAR_API_TOKEN) throw new Error(`Missing LINEAR_API_TOKEN env variable.`);

  return loadStories().then((stories) => {
    stories = stories.data.filter((story) => story.story_type === 'bug')
    storiesFound = stories.length;
    return sequence(stories, createLinearStory)
      .then(() => {
        console.clear();
        console.log(`Imported ${storiesImported} stories out of ${storiesFound}`);
        process.exit();
      });
  });
}

process.on('SIGINT', () => {
  process.exit();
});

init();
