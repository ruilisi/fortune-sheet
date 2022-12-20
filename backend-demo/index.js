/* eslint-disable no-console */
const express = require("express");
const { MongoClient } = require("mongodb");
const SocketServer = require("ws").Server;
const uuid = require("uuid");
const _ = require("lodash");
const { applyOp } = require("./op");

const defaultData = {
  name: "Demo",
  id: uuid.v4(),
  celldata: [{ r: 0, c: 0, v: null }],
  order: 0,
  row: 84,
  column: 60,
  config: {},
  pivotTable: null,
  isPivotTable: false,
  status: 0,
};

const dbName = "fortune-sheet";
const collectionName = "workbook";
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
let presences = [];

async function initMongoDB() {
  await client.connect();
  await client.db("admin").command({ ping: 1 });
}

initMongoDB();

const app = express();
const port = process.env.PORT || 8081;

async function getData() {
  const db = client.db(dbName);
  const data = await db.collection(collectionName).find().toArray();
  return data;
}

// get current workbook data
app.get("/", async (req, res) => {
  res.json(await getData());
});

// drop current data and initialize a new one
app.get("/init", async (req, res) => {
  const db = client.db(dbName);
  const coll = db.collection(collectionName);
  await coll.deleteMany();
  await db.collection(collectionName).insertOne(defaultData);
  res.json({
    ok: true,
  });
});

const server = app.listen(port, () => {
  console.info(`running on port ${port}`);
});

const connections = {};

const broadcastToOthers = (selfId, data) => {
  Object.values(connections).forEach((ws) => {
    if (ws.id !== selfId) {
      ws.send(data);
    }
  });
};

const wss = new SocketServer({ server, path: "/ws" });

wss.on("connection", (ws) => {
  ws.id = uuid.v4();
  connections[ws.id] = ws;

  ws.on("message", async (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.req === "getData") {
      ws.send(
        JSON.stringify({
          req: msg.req,
          data: await getData(),
        })
      );
      ws.send(JSON.stringify({ req: "addPresences", data: presences }));
    } else if (msg.req === "op") {
      await applyOp(client.db(dbName).collection(collectionName), msg.data);
      broadcastToOthers(ws.id, data.toString());
    } else if (msg.req === "addPresences") {
      ws.presences = msg.data;
      broadcastToOthers(ws.id, data.toString());
      presences = _.differenceBy(presences, msg.data, (v) =>
        v.userId == null ? v.username : v.userId
      ).concat(msg.data);
    } else if (msg.req === "removePresences") {
      broadcastToOthers(ws.id, data.toString());
    }
  });

  ws.on("close", () => {
    broadcastToOthers(
      ws.id,
      JSON.stringify({
        req: "removePresences",
        data: ws.presences,
      })
    );
    presences = _.differenceBy(presences, ws.presences, (v) =>
      v.userId == null ? v.username : v.userId
    );
    delete connections[ws.id];
  });
});
