TODO:

- enable VR multiplayer presence
  - camera (created at fixed location) -> create at at user's location
  - if user has no location (use spawn point), if they do, reuse the previous location

  1. create an entity for a spawn point (X)
  2. pass the spawn point to the channel join api (X)
  2.5 need an owning process for an ETS table
  2.6 create an ETS table for user locations/rotation
  3. store the user's location in the backend (ETS)
  4. return the location to the channel join response (either spawn point or previous location)
  5. only after location is known do we draw camera
  6. only after camera is created do we start game engine

  New thought, we can store last known position in local variable to avoid server round trip before rendering our camera.  We probably still want the ETS table so we can batch position broadcasts to each player though.


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

