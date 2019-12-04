console.log("\n\n=====\nExecute 'init('jwt','websocket-api-uri')' to connect to the API.\n=====\n\n");
const init = (jwt, api) => window.TSRI.init(jwt, api, {
    enableSpotifyAuth: function (p1) {
        console.log("Spotify Authentication is now %s.", (p1 ? "enabled" : "disabled"));
        if (p1) console.log("\n\n=====\nExecute 'auth()' to connect to spotify.\n=====\n\n");
        else document.getElementsByTagName("body")[0].classList.add("ready");
    },
    initialized: function (p1) {
        // console.log("STATUS: %s.", JSON.stringify(p1))
    }, pause: function () {
        console.log("PAUSE");
    }, play: function () {
        console.log("PLAY")
    }, position: function (p1) {
        console.log("Progress: %s", p1.toFixed(4));
        document.getElementById("slider").value = p1 * 1000;
    }, song: function (p1) {
        console.log("SONG: %s", JSON.stringify(p1))
    }, stop: function () {
        console.log("STOP")
    }, volume: function (p1) {
        console.log("Volume Change: %s", p1.toFixed(2))
    }
});
const auth = () => window.TSRI.spotifyAuth.init();
