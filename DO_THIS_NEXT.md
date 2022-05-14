TODO:

- make it easier to create primitive on js side, create reusable function
  for target spawner and primitive

- update graphQL create entity to take components, pos, rot, scale

--- create new primitive: target spawner
-- upon initial load, construct the spawner and wait for leader signal,
   -- stop


client - setTimeout, random position, create a new cylinder event
client2 - setTimeout, random position, create cylinder

----
choose a leader: invoke the target spawner


target is spawned in random place with random frequency 
  - consistent appearance for all members

target moves toward closest member as long as they can see them
  - one member asked to control movement for target for a certain duration


- figure out navmesh
  - use for crowd agents (monsters moving toward members)
  - use for teleportable mesh, create "walkable" area

 - add a sound effect


- create entity library
  - the donut gun is kind of ugly, let's design a better looking gun
  - create a new space
     - position some cubes and color them
     - try merging them and see what happens
  - can export a space into an entity by merging what's in the space into one thing, sans the floor
  - make a default space come with a grid with arrows
  - the entity gets a uuid, and the json data of the saved scene (babylon.js format)
  - browse, search entity library
  - use the ID, to add that mesh to your scene

- optimization of member movements
  - gather and send all member movements together every 1s
  - update members in frustum list every 1s
  - only get member movements 100ms for those in the frustum

- detect a hit of projectile to self
  - emit some kind of projectile hit member event
    - red overlay for pain
    - dispose of projectile

- server side random creation of target to shoot
  - entities marked target
  - entity is removed if hit by projectile

- create message handlers for entity_trigger_squeezed and entity_grabbed, entity_released
   taking the entity tags into consideration

- apply a physics imposter and an impulse when a throwable object is released

- late joiner needs to know that the entity that was picked up was moved
   - each entity grabbed, or released should update the position on the entity (server side)
   - released with impulse coul update 
   - (server side can't predict final position though, so maybe added a delay then query a user for final position)



try out the hand tracking or physics controllers for features manager
  - we can get velocity and angular velocity out of it

  check out this throw playground https://playground.babylonjs.com/#K1WGX0#36

- you probably stilll want to be able to throw everything like a gun, so if it's marked throwable
  then apply an impulse when you release it.  what about a fixed turret, it's a gun
  but you can't pick it up, you can't throw it

  interactable
  shootable
  joystick
  lever
  pull-switch
  restricted-y
  swevelable
  pickupable
  throwable
  ??



xr-manager sets up signals for raw hand movement, button changes
xr-grip-manager interpreted the grab when there was an intersecting mesh

   the message deepends on context
     - interactable
         -- entity grabbed, tag: "interactable"
     - gun
         -- entity grabbed, tag: "gun"
    - sword
    -ball
    - bow and arrow (subscribe to grab or trigger on other hand for pulling arrow back)
    - grenade (subscribe to trigger on other hand for pulling pin)
     - are we scaling an object?
     - are we grabbing a monsters face
     - are we grippig the throttle on a space ship
     - are we cranking a lever

need a system to interpret higher level interactions

a series of different pipes that are mutually exclusive
  each pipeline is responsible for the emitting of context relevant events
  unsubscribing, at release


- the grip is squeezed
   - there is an intersection of mesh during squeeze with object of interest
      
      - send local message 'squeezed_entity', { member_id, hand, entity_id, squeeze payload, entity_tags }


= the fact that you care about grip released is predicated by the fact that grip squeeze happened first
- the grip is released
   - was previously gripping something
      - send local message 'released_entity', {}
            (which may be ignored if no longer holding it)




  - add or remove listeners based on the entity tags or context
    - if object has  "two hand scalable" tag


  

- the other grip squeezed
  - intersection of interest
    -
    

bug: to release the gun we need different logic because there is no intersection check when you assume an entity

- create a gun
   - some visual thing to grab / collect
- tool assumed
  - when you're holding the gun
  - trigger message (trigger while holding gun)
  - projectile fired message

- projectile hits player
- projectile hits monster


editing and playing are two mutually exclusive things:
  - you're either designing the level and game mechanics, using scripting or whatever
     - the editing page allows you to see invisible elements such as: (menu is overlay of iframe)
        - spawn points
        - music/sound nodes
        - invisible trip areas
        - list entities
        - modify component attributes
        - reposition and scale entities like in maya
        - upload files
        - manage animations
        - save assets
        - place new entities into the space
        - access builder tools like drawing and
  - or you are spawning into the spawn point of the game and must also adhere to the permissions of the space
        - execute scripts
        - grab and throw
        - resume/pause
        - restart


you change your environment as you play (throw things, create things, destroy things)
  - the question is which abilities are allowed in the space
    - there are widgets with power (there is a list of widgets allowed in the space)
    - if you have the widget then you can:
      color something
      delete something
      shoot something

Main uses cases:
play a free game together with friends, accomplish some goal.  Platform can support many use cases.

  play doom together
    - environment
    - doors / keys (perhaps only allow sophisticated menus on Desktop)
      - in VR you can reposition and scale and draw
      - but any creation or editing, where you tune parameters is done in a webpage
    -  guns
    - ammo
    - inventory
    - health
    - monsters, AI

  star trek bridge crew
    - primarily a pre-made game, each ship is a URL
      all ships define a shared universe namespace, the ships will be placed in shared universe map, with sections
    - start as an ensign on someones ship, earn playing experience and level up

  squadren/battlestar/wing-commander
    - individual x-wing fighters
    - return to base ship
  

  drawing class in VR



===
need to cache that in ETS

environemtn settings should also be event sourced


tools - menu ui diagram

- have a button to exit the space


test member leave 
  - what happens if person refreshes page before the kick check?
    - it will still generate member_enter, with no member_leave
    - maybe member_entered should also be generated server side?
    - OR... just allow omnipotent member_enter events?

add text chat

heads up display messaging

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

- (enhancement) skip select mic and output if on quest 

- lock/unlock property (freeze matrix)
  - property manager of objects

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

- (improvement) remove immersive VR browse texture until menu is open (create the plane only if menu is opened)

- parent, unparent an object in VR

(feature) show spawn points when entering edit mode
  - need better edit mode to see constructs that you can't see
  - or maybe make it something that you see
  - and something you hide with a checkbox
    (view hidden items on|off)

(feature/improvement)- pick avatar


(refactor: after we request publishing audio, determine if successful or unsuccessful, our agora wrapper api
may need a callback or listen for errors )

(improvement)
add audio profile for agora - for sampling rate and encoder

(improvement) show nickname over avatar - collect nickname in svelte

(improvement)
add a listener for when dragging the bounding box gizmo

(feature)
- be able to delete a selected object 
- select should be a tool

(feature)
Easy way to add image wall

(feature)
add some simple behavior (cause and effect)

add some sound
add a monster

(remove skybox)
- when skybox distance is set too far (10000 meters), then fog covers everything
- when skiybox is set too close to make fog reasonable, then it can clip local objects
- render skybox behind everything (sky box has corners, don't really like it that much)


(feature)
- add video/cam and screen sharing 

(feature)
- mobile movement joystick, so that when people open up a world they are not stuck in one place

-- for PROD
-- add DB on AWS, so that we can have additional write connections
-- 