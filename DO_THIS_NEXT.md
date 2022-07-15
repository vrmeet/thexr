TODO:

Bug: releasing gun, moves the hand on the inline 2d avatar
- should make a class handing grabbing and releasing objects

Refactor - remove left/right from member state

add release entity state handling



Transient items - items that are temporarily moved, the state is stored for this session
but when the session is over, the state returns to the original setting

- items that are picked up/grabbed
- items that are released
- ammo left in a gun
- ammo that is collected and assigned to a gun
- health that is collected
- keys that are picked up
- doors that are opened
- switches that are opened/closed
- enemies

if in genserver, automatically cleans up when session terminates



Create utility for placing a shootable in any avatar's hand
Probably need more member_state info for a held entity to know it's pos and rot, if not a shootable



- if someone grabs a gun and is holding it,
  but then someone joins, they will not receive the grab event, so don't have updated
  info about who is holding what

  - extend member state to include left_holding, right_holding entity_id 
  - about_members then when you join you can parent the entity to the member's hand


- on release, it permanently changes the future position of the gun

  - add a state column to components
  - entity_transformed event -> state => 'base'
  - entity_released save new components position/rotation state => 'session'

= when gen_server terminates => delete all components with state == 'session'


entities
   components (rotation, position)
      id, type, entity_id, state/session: "base" | "session" 



The way we are moving the enemies, looking around based randomly, and intersecting vision code with an avatar, we might not actually need the navigation mesh

We just need to send out rays in each direction, once it hits a mesh, you know where the limits of exploration are.  (you still have to raise them up over steps and small obstacles).  soo... agents might need a rewrite.  But it might simplify things if we can do without a navigation mesh.  We'll see...


teleporting a member when in XR leads to an error:

TypeError: Failed to construct 'PointerEvent': Failed to read the 'screenX' property from 'MouseEventInit': The provided double value is non-finite.

but it worked when there were no attacking agents

there seems to be a huge number of agent movement messages, despite me not moving out of the way



guns should have limited number of bullets

drawing new avatar head

sculpting anything in VR


doors, ammo, guns have some state (how many bullets left).  and ammo is collected or not and transfers bullets to the member.  health is connected or not and gives health back to the member.  it is session state.  temporary.



when designing a space, set it's initial state as position, open/closed, energy etc.

when playing, update those components temporarily.  After the session is over, clear those variables.

- create an edit mode toggle
    - when in edit mode, your events don't include session
    - when not in edit mode, your events include session: true

- snapshot of events without session go into entity and components
     components have type, state for unique constraint, then data
    event with state of session go into components as well

- when genserver terminates (or just when all members leave), all component with state of session is deleted
   
- create events for temporarily moving something, as opposed to permanently editing the scene
  

create box, cone, cylinder, ribbon (has a good graphql api for individual mutations)
create a light
color a mesh
combine meshes
parent mesh
subtract meshes
group meshes
ungroup meshes
create enemy spawner
gltf placed
created ammo spawner


other concepts:

audio recorder
image uploader
gltf uploader
sound uploader
animation recorder
avatar designer
triggerable designer
sword designer



combine prims into a combined mesh

serialized scene ->
   lights
   meshes
      - optimized for performance

- create prim
    menu -> prim -> event
    graphQL -> create entity command handler

  ==> 

  create box, create cone, 

- frontend gets spawner through serialization or
  event broadcast

- if leader, 
    navigation of enemies
   -- creation, make one.


- verify functionality still works with refactor

- added jest

- write some js tests

- functions should take simple primitives as arguments


Create a story of doom game creation.  
  - create the events
  - playback the events
  - backend check that the correct snapshot is created
  - frontend check that babylon infrastructure is created




1. create a set of events to design the 'map' of a game
    - DOOM (first person shooter)
    - Red light / Green light
    - A bridge crew
    - A solo fighter jet

2. create event api for playing said game
   - recognizes when things are picked up
   - when guns are fired
   - when enemies are hit
   - when joy stick is pulled on

3. the environment is always shared and interactive
   - if one person is editing (soft rule: can't be attacked)
   - another person can be playing

3. event hander to parse events needed to persist the game and load it
   - currently is entities -> components
   maybe want:
     - lights
     - meshes
     - spawn points
     - scenes
     
4. create db schema to persist the game, and load the game with
5. create the js engine to load the game and be able to emit runtime events to broadcast

6. create a pipeline to test the flow of these events.
   - create an event list as if they are being emitted (spaces are always recording)
   - play the events back in compressed time and observe the results from a browser
   - playback should not produce new events, so we can run the test over and over.



- create a visual mesh representation of a spawn point (add to primitive menu)
disambiguate:
  asset: (glb)
  sounds:
  nav_mesh:
  meshes - things you render in the scene that you can move around (color, scale, move)
  lights - move
  spawn_points - move
  enemies - place
  settings - occur globally, fog, background music

- api, place an enemy agent into the space
   - decision:
       - is it part of the entity graph?
           it does have position, rotation, scale and an id
  - so initially i think yes, the monster has an initial position

====

  Add override field for components

  - there are also interactable objects that might have two forms of initial position
    - the 'reset' position
    - the 'runtime' position, moved but only temporarily, but needs to be synced with other players

  then we need a genserver to keep track of enemy state
     - new location, damage, visiblity, potentially also rotation and scale



- client:
     a navigation manager
        - a baked cache (from db)
            Y -> load the nav mesh from binary data
            N -> create new nav mesh from meshes, and bake -> DB

    - db NavMesh, space 1:1 nav_mesh
        - space_id, data 

===

leader
  create nav mesh commands,  send to server
    then server will (moveTo x,y,z)
     


bake the nav mesh after you change the scene

handle client, storing leader status

select a client leader
  member connected (join a channel)
  member disconnect (leave a channel)

space server
  member_joined
  member_left

  state.leader 

  ets.member_states



- space server should always have a leader, back channeled message

- member is editing, true | false

- graphQL is the most "pure" edit mode (you are not embodied)

- need a command to bake a nav mesh and combine locked entities

- a command to place a monster

- menu needs to persist edit mode true | false
  - persisted on server
  - used for showing you editable things (menus)

- extend the types of components for overrides
- agent events

====

fill in missing graphQL operations

  
===

Doom like game:

gun, shoot
enemy 


space has many entities

  an entity has many components

===
as a host
editing a space
   modify entities (create | delete)
      update or create components for entities

as a player
  - when modify entity (visibility component)
       update components (pos, rot, scale etc)
  
  populating 
    override_components

===
reset the world (have a button | after all members have left)
  delete entries from override tables

===
 rwx read (visible), write (edit permission to change | delete it), execute (interact )

===
player initial load of scene
  - load original entities (optimize mesh, load navmesh)
  - load the override entities
    - grab, release
       (save in override tables)

player goes into edit mode (reset the scene, with entity_id and alt_entity_id)
  - modifications to the space only happen on entity_id
    transform, color
      grab, release
        (save in the entity/component tables)
  - a member in non-edit mode only sees the alt_entity_id version
     grabs the entity




- we need better edit menu
  - needs an edit mode
  - vs a play mode

- which means we need better events
  - event for going into edit mode

- going to need way better js tests to test all the scenarios

- basic scripting using
   triggers (things that send events, click on a box)
   on message
     "string1" and "string2" or "stringb"
    
    state1:
      sound: once: condinuous: url...wave
      thing2: stopped
      thing: rotating
      door left: pos
      door right: pos
    state2:
      door left: pos
      door right: pos


- a common shared space at all times even between players and editors
   There is a URL for each space, all you need is a URL to specify a shared location
- a clear difference between creation and playing
   - a toggle gives you access to edit controls
   - ability to create new objects and edit properties of objects
   - changes are persisted (auto-saved)
   - can fork a new space_id (clones into a new space_id)
      - artifacts are copied into the new space_id
         - it gets it's own history/logging from that point on
   - if you lack permissions, objects that you pick-up and move etc will behave in player-mode
      - in fact, maybe in edit mode all the players turn into ghosts
   - things that have behaviors like
       - monsters
       - guns
       have a policy for how they are persisted and edited
         - there is the position, rotation, of where you placed it as the editor
         -, if a player takes it and moves it around it does not affect the persisted version
            they get a ghost version (copy on write), when they die, the version comes back from your version



- create a space ->
   immediately put into design mode 

- space/edit/:space_id
   - no nav mesh
   - no monster movement


logs:
  events 
    - building things
    - movements
    - communications
    - logs

    ===> eventbus
       - filter by movement to get
           space/member/movements
       - filter by logs to troubleshoot

edit an experience -> saves image


== we need all the logs to come in so I can see them,
need a logging solution
-> send all events to eventbridge
     - send to FIFO SQS
        -- lambda collect and write to dynamoDB (logs and events)
        -- batch archive records to s3 large files

create primitive is not obvious, they don't know where they go
   -- something that works for VR and 2d
   -- we need to white board out the UI
  

=== 

allow typing
allow creating of text signs
image planes





The UI still sucks:

  - a menu to draw enclosed rooms,
  - then cut windows and door holes

  

  But I really like not having to deal with another software to save an artifact,
  upload it and import it into the space

  Perhaps add better menu to create spaces

  Click and draw a path to form outline 


  HTML menu -> Live view -> holds state, share messages with 
  JS Land and canvas

  ===

  Menu is a declarative tree:, 
    {root: {
      [{}, {}, {}]
    }}

The entire state is maintained in the tree
  - on click of 'inspector'
     - pointer becomes an inspector tool
     - in VR, pointer becomes an inspector tool
     anything you click becomes highlighted
     the menu shows component details about the item
     - clicking on an input brings up an input and keyboard
      - or brings up a 2D form overlay, and submitting it will update that component
  - cut and extrude tool
    - first corner, 2nd corner, 3rd click sets height or cuts hole

  When open menu -> make a call to server to get HTML
  HTML to texture -> interactivity sends local signal

server side target spawner

- remove the client side spawner

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