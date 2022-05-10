/* eslint-disable no-console */
const express = require("express");
const { MongoClient } = require("mongodb");
const SocketServer = require("ws").Server;
const uuid = require("uuid");
const { applyOp } = require("./op");

const defaultData = {
  name: "Demo",
  id: uuid.v4(),
  celldata: [{ r: 0, c: 0, v: null }],
};

const dbName = "fortune-sheet";
const collectionName = "workbook";
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

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
    } else if (msg.req === "op") {
      await applyOp(client.db(dbName).collection(collectionName), msg.data);
      broadcastToOthers(ws.id, data.toString());
    } else if (msg.req === "addPresence") {
      ws.userId = msg.data.userId;
      ws.username = msg.data.username;
      broadcastToOthers(ws.id, data.toString());
    } else if (msg.req === "removePresence") {
      broadcastToOthers(ws.id, data.toString());
    }
  });

  ws.on("close", () => {
    broadcastToOthers(
      ws.id,
      JSON.stringify({
        req: "removePresence",
        data: { userId: ws.userId, username: ws.username },
      })
    );
    delete connections[ws.id];
  });
});
