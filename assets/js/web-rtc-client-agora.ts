import AgoraRTC, { ConnectionState, IAgoraRTCClient, IAgoraRTCRemoteUser, ILocalVideoTrack, IMicrophoneAudioTrack, IRemoteAudioTrack, IRemoteVideoTrack } from 'agora-rtc-sdk-ng'
import type { WebRTCClient, RemoteStreamPublishedCallback, RemoteStreamUnpublishedCallback } from "./web-rtc-client"

export class WebRTCClientAgora implements WebRTCClient {
    public appId: string
    public client: IAgoraRTCClient
    public localAudioTrack: IMicrophoneAudioTrack
    public localVideoTrack: ILocalVideoTrack
    public otherMemberAudioTracks: { [member_id: string]: IRemoteAudioTrack }
    public otherMemberVideoTracks: { [member_id: string]: IRemoteVideoTrack }
    public onPublishedCallbacks: RemoteStreamPublishedCallback[]
    public onUnpublishedCallbacks: RemoteStreamUnpublishedCallback[]
    public joined: boolean
    public audioIsPublished: boolean
    public screenIsPublished: boolean
    public cameraIsPublished: boolean


    constructor(public channelId: string, public userId: string) {
        this.joined = false
        this.audioIsPublished = false
        this.screenIsPublished = false
        this.cameraIsPublished = false
        this.otherMemberAudioTracks = {}
        this.otherMemberVideoTracks = {}
        this.onPublishedCallbacks = []
        this.onUnpublishedCallbacks = []
        AgoraRTC.setLogLevel(0)
        this.client = AgoraRTC.createClient({ mode: "live", codec: "vp8" })
        // this.client.enableAudioVolumeIndicator()
        this.client.setClientRole("host")
        this.setupClientSubscriptions()

    }





    setupClientSubscriptions() {
        this.client.on("exception", event => { console.error(event) })

        this.client.on("user-published", async (otherMember, mediaType) => {
            await this.client.subscribe(otherMember, mediaType)
            if (mediaType === "video") {
                this.otherMemberVideoTracks[otherMember.uid] = otherMember.videoTrack
                const playerContainer = this.createVideoPlayerContainer(otherMember)

                this.onPublishedCallbacks.forEach(fn => {
                    fn(
                        otherMember.uid.toString(),
                        mediaType,
                        {
                            play: () => {
                                this.otherMemberVideoTracks[otherMember.uid].play(playerContainer)
                            }
                        },
                        otherMember.videoTrack.getMediaStreamTrack()
                    )
                })

            }
            if (mediaType === "audio") {
                this.otherMemberAudioTracks[otherMember.uid] = otherMember.audioTrack
                this.onPublishedCallbacks.forEach(fn => {
                    fn(
                        otherMember.uid.toString(),
                        mediaType,
                        {
                            play: () => {
                                this.otherMemberAudioTracks[otherMember.uid].play()
                            }
                        },
                        otherMember.audioTrack.getMediaStreamTrack()
                    )

                })
            }
        })
        this.client.on("user-unpublished", async (otherMember, mediaType) => {
            if (mediaType === "video") {
                this.destroyVideoPlayerContainer(otherMember)
                if (this.otherMemberVideoTracks[otherMember.uid]) {
                    this.otherMemberVideoTracks[otherMember.uid].stop()
                    delete this.otherMemberAudioTracks[otherMember.uid]
                }
            }
            if (mediaType === "audio") {
                if (this.otherMemberAudioTracks[otherMember.uid]) {
                    this.otherMemberAudioTracks[otherMember.uid].stop()
                    delete this.otherMemberAudioTracks[otherMember.uid]
                }
            }
            this.onUnpublishedCallbacks.forEach(fn => {
                fn(otherMember.uid.toString(), mediaType)
            })
        })
    }


    async join(appId: string) {
        if (this.joined) {
            return
        }
        try {
            await this.client.join(appId, this.channelId, null, this.userId)
            this.joined = true
        } catch (err) {
            this.joined = false
            console.error(err)
        }
    }
    async leave() {
        if (this.joined === false) {
            return
        }
        this.joined = false
        await this.client.leave()
    }
    async getInputMicrophones(): Promise<MediaDeviceInfo[]> {
        return AgoraRTC.getMicrophones()
    }

    async getInputCameras(): Promise<MediaDeviceInfo[]> {
        return AgoraRTC.getCameras()
    }
    async getOutputPlaybackDevices(): Promise<MediaDeviceInfo[]> {
        return AgoraRTC.getPlaybackDevices()
    }
    async publishAudio(): Promise<void> {
        if (this.joined) {
            if (!this.localAudioTrack) {
                this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack()
                await this.client.publish([this.localAudioTrack])
                console.log("publishing local track audio")
                this.audioIsPublished = true
            }
        }
    }
    async unpublishAudio(): Promise<void> {
        console.log('in unpublish audio')
        if (this.joined) {
            if (this.localAudioTrack) {
                await this.client.unpublish([this.localAudioTrack])
                this.localAudioTrack.close()
                this.localAudioTrack = null
                console.log("UN-publishing local track audio")
                this.audioIsPublished = false
            }
        }
    }
    async publishCamera(): Promise<void> {
        if (this.joined) {
            if (!this.localVideoTrack) {
                this.localVideoTrack = await AgoraRTC.createCameraVideoTrack()
                await this.client.publish([this.localVideoTrack])
                console.log("publishing camera")
                this.screenIsPublished = false
                this.cameraIsPublished = true
            }
        }
    }
    async publishScreen(): Promise<void> {
        if (this.joined) {
            if (!this.localVideoTrack) {
                this.localVideoTrack = await AgoraRTC.createScreenVideoTrack({}, "disable")
                await this.client.publish([this.localVideoTrack])
                console.log("publishing screen")
                this.screenIsPublished = true
                this.cameraIsPublished = false
            }
        }
    }
    async unpublishVideo(): Promise<void> {
        if (this.joined) {
            if (this.localVideoTrack) {
                await this.client.unpublish([this.localVideoTrack])
                this.localVideoTrack.close()
                this.localVideoTrack = null
                console.log("Un- publishing video")
                this.screenIsPublished = false
                this.cameraIsPublished = false
            }
        }
    }
    addRemoteStreamPublishedCallback(callback: RemoteStreamPublishedCallback) {
        this.onPublishedCallbacks.push(callback)
    }
    addRemoteStreamUnpublishedCallback(callback: RemoteStreamUnpublishedCallback) {
        this.onUnpublishedCallbacks.push(callback)
    }

    createVideoPlayerContainer(otherMember: IAgoraRTCRemoteUser) {
        // in case it exists (some defensive programming)
        this.destroyVideoPlayerContainer(otherMember)

        let playerContainer = document.createElement("div");
        // Specify the ID of the DIV container. You can use the `uid` of the remote user.
        playerContainer.id = "agoraVideo_" + otherMember.uid.toString();
        playerContainer.style.width = "640px";
        playerContainer.style.height = "480px";

        document.body.append(playerContainer);

        return playerContainer
    }

    destroyVideoPlayerContainer(otherMember: IAgoraRTCRemoteUser) {
        let theID = "agoraVideo_" + otherMember.uid
        const playerContainer = document.getElementById(theID);
        if (playerContainer) {
            playerContainer.remove();
        }
    }


}