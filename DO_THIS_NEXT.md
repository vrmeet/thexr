TODO:

move default member state  from space-broker to be a function from member-manager?

---

bug: open browser a, open browser b, look for avatar from a (it is missing)

not sure we need to maintain all the member states as an observable 
if we only need the member count and unmic count, we just need
an object of 
{ "id1": "on", "id2": "off" }
... hmmm

after unmuting, menu should say 'mute' to go back to muting, store actual publish status
webrtc manager should update a audioActual eventbus emitter
when it is changed then broadcast a new state again to space channel
which will update own state

menu can subscribe to own state and update menu upon member state change, mapping it to menu state change

verify click mute or unmute sends new state to server and everyone else

grab a nickname from user if there isn't one in session storage

move camera movements and hand movements out of signal hub and into dedicated observables (too much noise for every subscriber of signal hub)

create new ets_refs table for space_server so we can store member state
about mic, nickname, avatar etc, so that when a new user joins the space
we can tell them all about the existing members in the space

(or, when a new user joins, they can query about existing members once)

We can create a table for member info, when a new user joins, ask for the previous state of all members

add audio profile for agora

===

create a member manager in js that keeps track of how many active users 
 and if they are muted or not, and what their nick name is

web rtc manager - initialize agora app, when channel is connected

only join agora channel only when more than 1 umuted member
leave agora channel if no unmuted member


This will allow us to join the agora channel at the last minute, no need to join for one person
allow us to display labels over head people's head
show an indicator if they are muted
show an indicator over who is talking

localMicAndvideo_prefs

{
  mic_pref: "on" | "off"
  video_pref: "screen" | "camera" | "off"
  audio_actual: {volume: 0} | "unpublished" | {error: msg}
  video_actual: "published" | "unpublished" | {error: msg}
  nickname: string
  handraised: boolean
  avatar: {...}
}

only join an agora channel if there is someone else unmuted
disconnect if countOfOtherPublishingMembers is 0

add color picker


add a listener for when dragging the bounding box gizmo
fix bug where agora voice would stop publishing

be able to add (color, delete) in VR


- add pick/up and throwable objects

Easy way to add image wall
add some simple behavior
add some sound
add a gun
add a monster




 
- render skybox behind everything

- add video/cam and screen sharing 

- add cylinder type

- animate changes so we see things slide into place
- have edit mode where you can click and move with the pointer (on hover pull up menu to launch gizmos)

- mobile movement joystick


- make a hamburger menu button (in VR make mounted to left hand)
- menu button pulls up advanced dynamic texture for a mesh : https://doc.babylonjs.com/divingDeeper/gui/gui#texture-mode

- learn how to hook up button events to code
- click a primative button to place it in the scene
- as long as 




- consider getting rid of the edit 'slug' for a space.  people don't know what it means.  and it is subject to 
  abuse if people reserve the best short slugs or spell things we don't want.  What if every space was
  browsible but was public or private.  the slug is still there but not changable except by admin.

- remove template and plugin models/migrations
