TODO:


- add animation to member_moved

- maybe playback does not create new events, it only broadcasts into the channel

- include hand_movement in member moved payload
- support playback

tools - menu ui diagram

- have a button to exit the space

hide immersive glasses, and vr menu until modal is dismissed
- create menu manager after the choice to enter a space is made
- and modal is dismissed

- convert observables back into events (for menu)

test member leave 
  - what happens if person refreshes page before the kick check?
    - it will still generate member_enter, with no member_leave
    - maybe member_entered should also be generated server side?
    - OR... just allow omnipotent member_enter events?


redo logic for joining webrtc 
  - when user 'enter', subscribe to channel if another person is entered and unmuted
  - when user 'observe', subscribe to channel if another person is entered and unmuted

- create procedural (deterministically random), embellishment of environments
  - e.g., create trees, grass, rocks, continuously when you go near a place
create a web page for viewing list of events
remove id from list of events, remove inserted at and updated at

- maybe tools are handheld things like paint brush, color wand, etc
  deleter

UI Tools
  - List of tools that are one click away
  - after selecting the tool, there is sometimes a parameter(s)
     - maintained by the tool
  - a primitive is a kind of brush tip, so you paint with it

- more tools
    pen
    thicken

- skip select mic and output if on quest (enhancement)

- create an entity gizmo that brings up all the menu
   - delete
   - color
   - lock/unlock
   - duplicate
   - parent to

- file upload
  - upload a glb file

- image upload
  - create a texture

- set sink id of audio output selection 
https://stackoverflow.com/questions/46523466/html-js-select-audio-output-device-in-browser'

- remove browse texture until menu is open

- parent, unparent an object in VR

show spawn points when entering edit mode

- show nickname
- pick avatar


may not need typed emitter, maybe can just use rxjs subject,
then usage of rxjs becomes more uniform

(feature)
log the logs into the backend so we can view them off line later
can log commands and event stream to correlate with log timestamps
- event sourcing

(refactor)
move default member state  from space-broker to somewhere else?

(refactor)
mic pref is sometimes boolean and sometimes "on" | "off" , consolidate?

---

(refactor)
not sure we need to maintain all the member states as an observable 
if we only need the member count and unmic count, we just need
an object of 
{ "id1": "on", "id2": "off" }
... hmmm


(refactor: after we request publishing audio, determine if successful or unsuccessful, our agora wrapper api
may need a callback or listen for errors )

(new feature)
grab a nickname from user if there isn't one in session storage

(improvement)
add audio profile for agora - for sampling rate and encoder

(improvement) show nickname over avatar - collect nickname in svelte

(improvement)
add a listener for when dragging the bounding box gizmo

(feature)
- be able to delete a selected object 

(feature)
- add pick/up and throwable objects

(feature)
Easy way to add image wall

(feature)
add some simple behavior (cause and effect)

add some sound
add a gun
add a monster

(remove skybox)
- when skybox distance is set too far (10000 meters), then fog covers everything
- when skiybox is set too close to make fog reasonable, then it can clip local objects
- render skybox behind everything (sky box has corners, don't really like it that much)

(explore)
- skydom (no seams), that renders behind everything

(feature)
- add video/cam and screen sharing 

(add primimitive feature)
- add cylinder type

(feature)
- mobile movement joystick

-- add DB on AWS
-- 