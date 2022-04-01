TODO:

local events should happen immediately in the client
  - tricky becauses it requires locally mapping command to event which is redundant to
    backend.  

- create procedural (deterministically random), embellishment of environments
  - e.g., create trees, grass, rocks, continuously when you go near a place

handle joining and leaving a space separately then joining a space channel
 - and turn joining and leaving a space into explicit events

- frontend:
    1) js -> signalHub -> channel.push 
    2) graphQL -> mutation -> command
    - folder of command interfaces/types
    - folder of event interfaces/types

Both can send a command struct to a handler
  - multiple function heads {command_name, payload} -> {event_name, payload}
  - persist events to DB
  - create snapshots every X events
  - doesn't need type, just pattern match on the value in the tuple to create snapshot


use quaternion_rotation every where
store as array everywhere

send all updates via events, including member join, member leave, mic mutes, entity creation

create a web page for viewing list of events
remove id from list of events, remove inserted at and updated at

create a snap shot mechanism so can load prior state quickly, and without member movements



context has api for commands: 
  member_join_space
  member_move
  member_mute
  ...

The context creates the event -> sends to the space genserver
  - genserver forward them to queued_broadcaster (producer)
  - 

Use genstage consumer that subscribes to the producer (above), and write to a db

genserver - appends the event to a log
  - first in memory
  - then to disk (maybe use genstage when the consumer gives producer a demand)

subscribers:
  - eventstream to disk writer
  - member states (could be either memory (:ets) or db)
  - member positions/rotations (hands)



Event sourcing

events are the 1st class citizen
- persist the events




UI Tools
  - List of tools that are one click away
  - after selecting the tool, there is sometimes a parameter(s)
     - maintained by the tool
  - a primitive is a kind of brush tip, so you paint with it


- way to delete and color primitives
  tools
    primitives
    delete
    color
    pen
    thicken

- console log button presses on controllers

- delete menu, delete the mesh you click on

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

- create new entities in front end fast by choosing the uuid

- create scene level double pick observable
- delete menu
- change color menu

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
add audio profile for agora

(improvement) show nickname over avatar
show mic muted status

(new feature)
add color picker

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

(features)
- animate changes so we see things slide into place

(feature)
- mobile movement joystick

(explore)
- consider getting rid of the edit 'slug' for a space.  people don't know what it means.  and it is subject to 
  abuse if people reserve the best short slugs or spell things we don't want.  What if every space was
  browsible but was public or private.  the slug is still there but not changable except by admin.

(cleanup)
- remove template and plugin models/migrations
