# clubhouse-to-linear-exporter
Pulls Clubhouse tickets and creates them back in Linear

## Setup 

You'll need to get a few detail first:

- Your Clubhouse API key from the [settings page](https://app.clubhouse.io/pleo/settings/account/api-tokens)

- Your Linear API key from the [settings page](https://linear.app/pleo/settings/api)

- Fill-in the workflow ids and Linear type mapping by making these curl requests:


First to get your Linear team uuid:

```bash
curl \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: <your linear api key>" \
  --data '{ "query": "{ teams { nodes { id name } } }" }' \
  https://api.linear.app/graphql
```

Then, with the team id, collect the labels and states:

```bash
curl \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: <your linear api key>" \
  --data '{ "query": "team(id: "<your_team_id>") { labels { nodes { id name } } states { nodes { id name } } }" }' \
  https://api.linear.app/graphql

```

Update the settings in the code and you are good to go!


## Running

```bash

CLUBHOUSE_API_TOKEN=<your clubhouse token> LINEAR_API_TOKEN=<your linear token> TEAM_NAME=<team name> node .
```

The script will run through all open tickets for that team and sequentially ask if this ticket should be migrated to Linear.

## What's missing

- Screenshots seem broken, Linear tries to upload from the clubhouse url instead of simply embedding it
- Assignees
- Comments
- Upserting in Linear instead of jsut creating