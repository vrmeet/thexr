TODO:


- enable VR multiplayer presence
  - camera (created at fixed location) -> create at at user's location
  - if user has no location (use spawn point), if they do, reuse the previous location

On camera move, send camera pos, rot to others
throttle using rxjs
  every 100 ms, send over websocket posrot
  save posrot to sessionStorage

- store position/rotation updates in ETS table
- broadcast message to all connected users

- Receive all messages in client using a pattern matching library (match toy)

==

buffer pos rotation messages so less chatty

- restore audio webrtc

- add about us section

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

