

export interface IPlayable {
    play(): void
}

export type RemoteStreamPublishedCallback = (
    memberID: string,
    mediaType: "audio" | "video",
    playable: IPlayable,
    mediaStreamTrack: MediaStreamTrack) => void

export type RemoteStreamUnpublishedCallback =
    (memberID: string, mediaType: "audio" | "video") => void



export interface WebRTCClient {
    join(channelId: string, userId: string): Promise<any>
    leave(): Promise<void>

    // inputs and outputs
    getInputMicrophones(): Promise<MediaDeviceInfo[]>
    getInputCameras(): Promise<MediaDeviceInfo[]>
    // speakers, headphones etc
    getOutputPlaybackDevices(): Promise<MediaDeviceInfo[]>

    // mute and unmute yourself
    publishAudio(): Promise<void>
    unpublishAudio(): Promise<void>
    publishCamera(): Promise<void>
    publishScreen(): Promise<void>
    unpublishVideo(): Promise<void>

    // mute others?
    // adjust others volume?


    //current status
    audioIsPublished: boolean
    cameraIsPublished: boolean
    screenIsPublished: boolean

    // observables
    addRemoteStreamPublishedCallback(callback: RemoteStreamPublishedCallback)
    addRemoteStreamUnpublishedCallback(callback: RemoteStreamUnpublishedCallback)




}
