import {TSRIController} from "./controllers/TSRIController";
import {TSRIWindow} from "./models/TSRIWindow";

const controller: TSRIController = new TSRIController();

const win = window as TSRIWindow;
win.TSRI = controller;
win.onSpotifyWebPlaybackSDKReady = () => controller.spotifyApiReady();

require("../providers/spotify/spotify-playback-sdk");
require("../providers/youtube/youtube-iframe_api");
