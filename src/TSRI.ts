import {TSRIController} from "./controllers/TSRIController";
import {TSRIWindow} from "./models/TSRIWindow";

const controller: TSRIController = new TSRIController();
export const sleep = (m: number) => new Promise(r => setTimeout(r, m));

const win = window as TSRIWindow;
win.TSRI = controller;
win.onSpotifyWebPlaybackSDKReady = () => controller.spotifyApiReady();

const _global = (window || global) as any;
_global.onYouTubeIframeAPIReady = () => controller.youtubeApiReady();

// require("../providers/spotify/spotify-playback-sdk");
require("../providers/youtube/youtube-iframe_api");
