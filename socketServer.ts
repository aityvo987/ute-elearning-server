import { Server as SocketIOServer } from "socket.io";
import http from "http";


export const initSocketServer = (server: http.Server) => {
    const io = new SocketIOServer(server);

    io.on("connection", (socket) => {
        console.log("User connected");

        //Listen for 'notification' events from the FE
        socket.on("notification", (data) => {
            //Broadcast the notification data to all connected clients (admin dashboard)
            io.emit("notification", data);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected");
        });
    });
}