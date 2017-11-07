let socket = io.connect(`http://${document.location.hostname}:${document.location.port}`, { "forceNew": true });

socket.on("restart", () => {
    location.reload(true);
});

$(() => {
    console.log("loaded");
});