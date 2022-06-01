let io = require("socket.io-client");
let SimpleMediasoupPeer = require("./SimpleMediasoupPeerServerSide");

let url = "https://afewdeepbreaths.livelab.app";

const startBroadcaster = () => {
    console.log('Starting server-side broadcaster');
    let socket = io("http://localhost:8080", {
        path: "/socket.io",
    });
    socket.on("connect", () => {
        console.log("Socket ID: ", socket.id); // x8WIv7-mJelg7on_ALbx
    });

    mediasoupPeer = new SimpleMediasoupPeer(socket);




    //   console.log(socket);

}

module.exports = startBroadcaster;