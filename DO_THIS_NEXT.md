TODO:

x if log menu is open, whenever there is a new log, update the text

create a presence manager in js that keeps track of how many active users 
 and if they are muted or not, and what their nick name is

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


x. make emitter on signal Hub for edit gizmo on/off
add color picker
logs

add a listener for when dragging the bounding box gizmo
fix bug where agora voice would stop publishing
fix bug where when exiting XR, and edit toggle may be off but the gizmo remains

attach edit state to the toggle switch

X 1. (do we get rid of the svelte for the menu overlay)
X 2. inline 'start button' and 'mic mute/unmute' (full screen UI texture)
3. vr 'start button' and 'mic mute/unmute' (mesh texture)
X 4. when click on menu -> launch or close the menu
5. when click on mute/unmute, we'll toggle the mute/unmute text/status
when click on about, show the about info



- be able to edit / place primatives in VR (color, delete)
- VR Menu (open and close)
  - switch between pages (primative list, color picker)

  - need to fix bug or uncleaned up observers accumulating when switching menu pages

the svelte side needs access to edit settings (we lost this functionality when we removed the iframe)


- edit mode should have a tools overlay in inline mode, a collapsable
  hand menu in immersive-vr
- add point to pick / select an entity
- add gizmos so can edit by click and dragging

- add back teleportation
- keep track of teleporatable floors   
- track left and right hand controllers
- move the immersive button from right hand corner into the menu area
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
