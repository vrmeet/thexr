TODO:

only enter a space after you click a button (if you don't join, then you haven't joined the channel)
  set focus to the canvas


hubs does this:
  when page loads, there is a modal with 3 buttons: "join room", "enter on device", "spectate"
  when clicking "join room", the entire page becomes a form:
    top bar has a "< Back" link.  title is "Avatar setup"
    there is text input for an avatar name
    a 3d avatar preview, a change button avatar
    an accept button
  when accepting an avatar 
    top bar has a "< Back" which takes you back to avatar setup
    title is microphone setup
    two panel layout
    on left are microphone choices and levels (an option to mute)
    on right is speaker choice and option to test
  
  if you click "enter on device", a modal says you can go to another link inside headset to hubs.link and enter a 4 digit code which will take you to the full url.  (not a bad idea if all your urls are insanely long) maybe have a private spaces tab and in there you can browse, but you need the code

  if i refresh i need to answer all the questions again, should save it in session storage

  but i like the idea of not joining the room (automatically) until you take some action

- consider getting rid of the edit 'slug' for a space.  people don't know what it means.  and it is subject to 
  abuse if people reserve the best short slugs or spell things we don't want.  What if every space was
  browsible but was public or private.  the slug is still there but not changable except by admin.

- when sending presence diff or presence state, there is no initial position so we have no idea where to draw
  the other person

- add back teleportation
- restore audio webrtc (but to create the UI, would we use react?)
   - svelte is promising, let's try to add a splash screen to 'Enter' the room, and only when
   they click do we track them with phoenix presence

- build a UI to manage muting/ and audio/video state
- also need a way to select the mic and cam and submit it to agora
- render skybox behind everything


- add cylinder type

- animate changes
- have edit mode where you can click and move with the pointer

- batch broadcast message to all connected users
- mobile movement joystick


- make a hamburger menu button (in VR make mounted to left hand)
- menu button pulls up advanced dynamic texture for a mesh : https://doc.babylonjs.com/divingDeeper/gui/gui#texture-mode

- learn how to hook up button events to code
- click a primative button to place it in the scene
- as long as 

- add point to pick / select an entity
- add gizmos so can edit by click and dragging
- test editing in oculus
- add thexr.space domain to gigalixr
- add some intro text about how this is beta test

