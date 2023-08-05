const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
    playerName: dbObject.player_name,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//API 1
app.get("/players/", async (request, response) => {
  const getPlayerDetails = `SELECT 
  *
   FROM
    player_details;`;
  const initialPlayerDetails = await db.all(getPlayerDetails);

  //const playerArray = initialPlayerDetails.map((eachPlayer) => ({
  //playerId: eachPlayer.player_id,
  //playerName: eachPlayer.player_name,
  //})
  //);
  response.send(
    initialPlayerDetails.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
});

//API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetails = `SELECT *
   FROM player_details
    WHERE player_id=${playerId};`;
  const playerDetails = await db.get(getPlayerDetails);
  const playerArray = convertDbObjectToResponseObject(playerDetails);
  response.send(playerArray);
});

//API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;

  const updatePlayer = `UPDATE player_details
    SET
    player_name='${playerName}'
    WHERE
    player_id=${playerId};`;

  await db.run(updatePlayer);
  response.send("Player Details Updated");
});

//API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  // const {matchId,match,year}=request.body;

  const getMatchDetails = `SELECT match_id AS matchId,
  match,year
   FROM 
   match_details
    WHERE 
    match_id=${matchId};
    `;
  const playerMatch = await db.get(getMatchDetails);
  // const playerArray = convertDbObjectToResponseObject(playerMatch);
  response.send(playerMatch);
});

//API 5

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerMDetails = `
  SELECT
   *
  FROM 
  player_match_score.player_id 
  NATURAL JOIN 
  player_details.player_id
  WHERE 
  player_id='${playerId}';`;

  const playerMatchScoreDetails = await db.all(getPlayerMDetails);
  response.send(
    playerMatchScoreDetails.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
  //response.send(playerDetails);
});

//API 6

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;

  const getApiSixDetails = `SELECT  player_details.player_id AS playerId,
	      player_details.player_name AS playerName
   FROM player_details 
   NATURAl JOIN
    player_match_score
    WHERE
     match_id='${matchId}';`;
  const matchPlayerDetails = await db.all(getApiSixDetails);
  //const playerArray = convertDbObjectToResponseObject(matchPlayerDetails);
  response.send(
    matchPlayerDetails.map(
      (eachPlayer) => ({
        playerId: eachPlayer.player_id,
        playerName: eachPlayer.player_name,
      })
      //convertDbObjectToResponseObject(eachPlayer)
    )
  );
});

//API 7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
     FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    
    WHERE player_details.player_id = ${playerId};
    `;
  const matchDetails = await db.get(getPlayerScored);
  //const playerArray = convertDbObjectToResponseObject(matchDetails);
  response.send(matchDetails);
});

module.exports = app;
