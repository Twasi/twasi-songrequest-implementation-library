import {TSRIController} from "./models/Controller";
import {TSRIWindow} from "./models/TSRIWindow";

require("../providers/spotify-playback-sdk");
require("../providers/youtube-iframe_api");

const controller: TSRIController = new TSRIController();
const win = window as TSRIWindow;



win.TSRI = controller;
