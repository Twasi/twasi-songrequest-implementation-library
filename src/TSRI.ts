import {TSRIController} from "./models/Controller";
import {TSRIWindow} from "./models/TSRIWindow";

const controller: TSRIController = new TSRIController();

const win = window as TSRIWindow;
win.TSRI = controller;
win.onSpotifyWebPlaybackSDKReady = () => {
    controller.spotifyStatus(true);
};

require("../providers/spotify/spotify-playback-sdk");
require("../providers/youtube/youtube-iframe_api");
