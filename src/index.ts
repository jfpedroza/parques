
import * as express from "express";
import * as http from "http";
import * as socketio from "socket.io";
import * as path from "path";
import * as dotenv from "dotenv";
import {Server} from "./Server";

dotenv.config({ path: ".env" });

const app = express();
const httpServer = new http.Server(app);
const io = socketio(httpServer);

app.set("port", process.env.PORT || 3000);

app.use(express.static(path.join(__dirname, "public")/*, { maxAge: 31557600000 }*/));

let server = new Server();

io.on("connection", (socket) => {
    server.onConnection(socket);
});

httpServer.listen(app.get("port"), () => {
    console.log("Server running at http://localhost:" + app.get("port"));
});