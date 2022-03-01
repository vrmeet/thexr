TODO:

create a member manager in js that keeps track of how many active users 
 and if they are muted or not, and what their nick name is

web rtc manager - initialize agora app, when channel is connected

only join agora channel only when more than 1 umuted member
leave agora channel if no unmuted member


This will allow us to join the agora channel at the last minute, no need to join for one person
allow us to display labels over head people's head
show an indicator if they are muted
show an indicator over who is talking

localMicAndVideoPrefs

{
  micPref: "on" | "off"
  videoPref: "screen" | "camera" | "off"
  audioActual: {volume: 0} | "unpublished" | {error: msg}
  videoActual: "published" | "unpublished" | {error: msg}
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
