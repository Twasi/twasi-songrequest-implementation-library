import {PlaybackPreviewEvents} from "./PlaybackPreviewEvents";
import {SpotifyPlaybackController} from "../SpotifyPlaybackController";
import {YouTubePlaybackController} from "../YouTubePlaybackController";
import {PlaybackMasterController} from "../PlaybackMasterController";

export interface PreviewSong {
    song: {
        name: string,
        artist: string,
        cover: string,
        youtube: string,
        spotify: string
    },
    startAt: {
        spotify: number,
        youtube: number
    },
    duration: number,
}

const songs: Array<PreviewSong> = [
    {
        song: {
            name: "Thüringer Klöße - Radio Version",
            artist: "Fritz",
            cover: "https://i.scdn.co/image/ab67616d0000b273ddeb565d7d2261a769ea5d03",
            spotify: "spotify:track:6x9SYGliCfaIDf1GGpgceV",
            youtube: "qJe3cdM7f1c",
        },
        duration: 4000,
        startAt: {youtube: 20000, spotify: 20000}
    }, {
        song: {
            name: "Later Bitches",
            artist: "The Price Karma",
            cover: "https://i.scdn.co/image/ab67616d0000b2737d40694c21bdedb87d6ba976",
            spotify: "spotify:track:6x9SYGliCfaIDf1GGpgceV",
            youtube: "qJe3cdM7f1c",
        },
        duration: 4000,
        startAt: {youtube: 20000, spotify: 20000}
    }, {
        song: {
            name: "Shooting Stars",
            artist: "Bag Raiders",
            cover: "https://i.scdn.co/image/ae14de5997fea355757a17c26fb0e26b76fc8f86",
            spotify: "spotify:track:0UeYCHOETPfai02uskjJ3x",
            youtube: "feA64wXhbjo"
        },
        duration: 4000,
        startAt: {youtube: 20000, spotify: 20000}
    }, {
        song: {
            name: "We Are Number One (Remix)",
            artist: "SayMaxWell",
            cover: "https://i.scdn.co/image/ab67616d0000b2734c906c8ced99f4861ebc0b64",
            spotify: "spotify:track:4C64ZXG24vRJ4lwkxCA24G",
            youtube: "Lr1FsM1EhMI"
        },
        duration: 4000,
        startAt: {youtube: 20000, spotify: 20000}
    }
];

export class PlaybackPreviewController {

    constructor(
        private events: PlaybackPreviewEvents,
        private spotify: SpotifyPlaybackController,
        private youtube: YouTubePlaybackController,
        private master: PlaybackMasterController
    ) {

    }

    public setEvents(events: PlaybackPreviewEvents) {
        this.events = events;
    }

    public async startPreview() {
        if (this.master.shouldPlay) return;
        const randomPreview: PreviewSong = PlaybackPreviewController.getRandomPreview();
        // @ts-ignore
        await this.spotify.play({uri: randomPreview.song.spotify});
        setTimeout(() => {
            this.spotify.pause();
            // @ts-ignore
            this.youtube.play({uri: randomPreview.song.youtube}, true);
            setTimeout(() => {
                this.youtube.pause();
            }, randomPreview.duration)
        }, randomPreview.duration)
    }

    private static getRandomPreview(): PreviewSong {
        return songs[Math.floor(Math.random() * songs.length)]
    }
}
