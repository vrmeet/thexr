NEXT:

- add button to emit an arbitrary event
- add component to receive arbitrary message then add or remove a component
- music sequencer with tonejs

3D slides built with some text description?  possible?

test: remove a component through signal hub, by setting to nil, 

bug: menu -> attendees and edit are broken

STILL need a better menu system

- add cause and effect



animation as components, only work as a mostly static attribute.  constant rotation.  bobbing up and down.  For dynamic movement, you would have to keep updating the component to the current state, like avatar movement.  Some movement is linear,
like a bullet, or procedural like an arc.  So we can just msg the remote procedure call to limit
messages.  But sometimes those animations can be interrupted.  For example two people playing catch with throwing an object.  If the item is not interrupted, let the person that threw it, continuously update the pos/rot like an animator until the object comes to a rest (times out) or until a second player or first player, grabs it.

BUT if the system you are updating (like transform), also repositions the object when the component is changed, then there is a fight between animating and updating a static position.  Either don't send the messages, or don't update the position when there is physics or animation going on for the object.

OR: animation can be part of the state as a component.  animate: { pos:, rot: , ttl: },
animate component is not stored in db.  but the animate system will apply the animation.
This will create an animation in the scene.
When there is an animation in the scene for an entity name, transform will not update position for it.

How holdable works:
  The system xr detects raw positions and button presses and emits them into the signal hub movements.

  holdable listens to all grip, on both hands and checks to see if rays intersect a mesh whose
  entity has a holdable component, then emits a mesh grip left event.  

  From the entity's point of view, the component is added which adds a subscription to listen to
  mesh grip left and mesh grip right.
    - in the subscription, 
    The holdable can have an optional offset.  If no position/rotation offset then the parenting is
    relative to dynamic data where the ever the users hands are now.
    
    1. emit outgoing event, so every and self can parent the mesh to the hand
    2. add a one time subscription that is triggered by a race between
       a. release of this hand grip
       b. mesh grip from the other hand on this mesh
       c. incoming event that upserts the transform of this mesh
       - if any of these are met, then 
          1. emit entity upsert that unparents the mesh
          2. if there is any throwable data, then impulse the mesh by sending system msg
            grabbable: { throwable: "discard" | "keep" }


  Depending on the shape of component data, the mesh should be parented to the left or right hand
    and an event should upsert the component transform to update the parentage of the mesh to the hand

  If both hands are grabbing, the distance and angle between the hands could be used to update rotation and scale of the mesh.  Of course the component data must specify this option, otherwise
  grabbing with second hand would unparent the mesh from the first hand.

a duplicate entity should just be a component that points at the original

an export saves to external file
an import uses an external url

a merge, intersect or subtract hides and disables the original and makes a component
boolean with the operation of "subtract(entity1, entity2)" and entity1 and entitey2 are hidden
with entity 3 created with a component of boolean on those 2.



move the gizmo stuff out of transform and into new service
  -- maybe it's only a inline feature
  - in VR we can move by grabbing

write test for:

when getting a message for entity created and contains both shape and transform
  make sure shape is processed first
  or allow transform to still work even if processed later

fix deep merge, or get rid of it.  enforce shallow keys
and a patch or put API.  usually it's just one entity or component that we want to update


do not persist avatars into db

TODO:
  - update ISystem to:
      enable systems to be loaded as script tags and will register themselves using a global object
      
      AFRAME.registerComponent('foo', {
  schema: {},
  init: function () {},
  update: function () {},
  tick: function () {},
  remove: function () {},
  pause: function () {},
  play: function () {}
});

       dependency: "name of system that needs to be done first"
       - remove order


linedef
  - start vertex
  - end vertex
  - front sidedef
  - back sidedef

sidedef
  - upper texture
  - middle texture
  - lower texture
  - x, y offset

sector
  - ceiling texture
  - floor texture
  - ceiling height
  - floor height

I get it now, but apart from sectors. the rest is kind of cumbersome to use
I like drawing shapes.  I like dropping items.


focus on the experience you'll have in this space that you won't have in other spaces:
- such as give things to other players
- have some inventory
- collect items
- wearables
- add own cause and effect (switches, basic building blocks)

- But FIRST: can you play doom yet?  Make that first, then learn how to extract an API for other games

What's next in DOOM?

  - give me large procedural environemnts to explore
    - not just uniform mazes, but interesting color pallet, sense of scale
    - algorithm:
        1. make a large floor

    - door and key mechanics
    - gun, health, armor mechanics
    - monster and monster throw fireball
    - spawn and respawn
    - start and end game concept
    - no attack while editing.  maybe for a game, you must export a snapshot in order to play it.
       - can't play and edit it at the same time.

    
        

- health system ->
    always present with attendance upon synergizer 'enter', creating avatar, attendance components on the create entity event
    - health can be persisted into sessionStorage on window unload, so multiple reloads don't recharge health
    - listen for bullet hit message, emit upsert health message inside attendance

    - when someone enters, they get 100
    - when someone is damaged, state of health is updated

= implemented health value in the enter() function of synergizer, but maybe this can be
abstract into a local "first_enter" event.

- how is health deducted?  local event?


- collection system
  - fungible or non-fungible
  - key: number
  like ammo acount
  health count
  armor count

   an object of collected items, always present on attendance
   listen for mesh click or grab when component of collectable is present
   emit upsert component on the collectable, setting state to collectedBy
   - change visiblity and enabled false on the collectable item
   and update attedance collections object with the entity of what was collected
   - announce item collected custom message

- ammo system
   - is a kind of collectable value
   - need to load it into a gun?  or maybe like doom, as long as you have this collectable value then your gun keeps shooting for now

- gun system
   - moniters for discreet trigger sequeezes while holding an entity with a shootable component
   - create a bullet and animate it, 
   - if originator: monitering it on every frame for a contact
   - on contact, announce bullet hit
   - listen to collection system custom message

- monster/enemy system
  - on entity created, places a monster, moved by leader
  - leader emits upsert component position
  - listens for bullet damage and emits upsert component health changes
  
-armor - similar to health

- cause and effect system
  - listen for event
  - check conditions
  - emit event


- biggest problem, is people create spaces, but they are kind of crappy.  the spaces need to be
   very cool.  like the kind in hand drawn worlds... artistically they are paintings and are amazing
   - but maybe this is just a rating system....  but i like that all demos in Quill have a "painted"
   look.
   - flat shaded, low poly, no textures

- but many people are not going to spend the time to create these... artists will, but most people will not
- they can be incentivised with $$

- even if there is not much animation, it's the mood and atmosphere, and lighting



- more control over your face appearance, your out fit
- ability to build and trade items in the world
- ability to add some cause and effect on those items

====
if everyone creates their own world, with varying artistic ability, it's like myspace
  worlds are inconsistent, ugly, textures and models with mixed art style

- can we create worlds that are procedurally generated from some user input.  So user has a say
in what 'seed' to provide, yet the algorithm interprets and creates a complex and rich geometry.




make an interactable object

grab something in 2D inline too

make a face, export it, then wear it

- create cause and effect

- ability to customize your look using parameter sliders, they are all morph targets
  - do what altspace did:
     have a fix set of head geometry, 
     then decals for eyes, eye brows, mouth


ability to edit existing components in VR menu

after edit component, should reflect new component in UI

move select and ability to multi-select into something that can be shared across menus
  so that when menu is locked, can color several items

can also move last selected mesh into context for easier access ?  has more to do with editing 
then transform, so can move it into it's own system (or the menu system) (or a class used by menu system) and keep it there until editing menu is closed

- use an exported mesh as your head

after exporting a mesh,
should give some visual feed back, flash message
and redirect to select page



make a new context to support searching for artifacts (might wanna split up the context)
 - given a search term, return a list of matching meshes, max of 10

integrate menu search for the model and an import button

- places imported mesh into the scene, create entity message referencing asset_mesh component

a similar search for images on the internet

import an image from the internet onto a plane and place it into the scene

provide a way to load an asset mesh into a space, or use it as a head or hands for self
  wearable component?  


- bonus, create VR keyboard on a plane that appears when you focus on a GUI input
  - plane is attached to camera and is disposed when input loses focus

some boolean operations don't take

menu can be smarter and do a partial render of components that change

if player permanently disconnects
what happens to objects they grabbed?

work on text input so we can inspect entities
and edit their components, special components to support 
adding shootable, floor, lift, grabbable, collidable 

don't lift elevator on mesh pick when in 'edit' mode.

better laser rays for determining grabbing




1. ensure we're patching components on upsert: is a component_upsert a patch or a put
on the component?  should always do a patch... values are never removed
but we don't have to pass the whole component value
4. modify synergizer to choose the systems to process an upsert by system name matching the component name
5. though other systems can listen just as well, but they need to register their own listeners....

future:
  - in microphone picking, display microphone testing levels

bug: 
  xr, avatar hand representation need to follow controller for self too


Build it from the ground up,

1. The events - do we have all the events necessary to play doom? To play bridge crew?  Made list.
2. Can we produce the events from real time activity? Moving head, hands, travelings.
   a. picking up objects, throwing them, shooting a gun.
   b. local events, vs outgoing: A entity for a bullet can be local, {m: "entity_created", p: {entity_id: ..., components: {shape: capsule, animate_from_to: ..., disappear_on_contact: true, cause_damage: true}}} but the outgoing equivalent might be higher level like {m: "system_event", p: {system: "bullet", name: "bullet_fired", pos_rot: ....}}
3. Can other players receive these events and make changes in their scene accordingly?
4. The persistence, - do we have the right snapshot built from the events to capture
   a. Can we take the persisted data and reconstruct the scene? deserialize
   e.g. The scene for people entering the game for the 1st time (scene deserialization)
   b. Modified scene for people enter the game late, where doors are already open, objects collected, things moved or destroyed (transient changes, genserver)
   c. Prescence of enemies and other players (genserver)

Make the components into first Class citizens, class names with attributes, can add
more components to entities using graphQL, but more often than not we use the
prefabicated entity builders which have all the components we need

Make entities, have NO type

Entity serializable into entity_id, list of components, that's it

When deserializing entity, systems will register the entity if it has the right components

systems will communicate over the life of the entity through messages, e.g. entity_destroyed

EntityFactory.unmarshal(event) => Entity

Entity.marshal() => CreateEntityEvent
.emit()

A different entity class per type of object is heading toward object hell.
How about An entity is just a subclass of an Abstract Mesh, so we always render it, even if it can be
hidden sometimes. Then it has a list of components, including a primitive component:

{ type: "shape", data: {primitive: "cone", primitive_params: {...} }} // sphere, plane
or
glb: "path"

function:

add component to entity
remove component from entity

teleportable: true | "name of mesh that is teleportable in the glb"

perhaps entities should have event handlers like

- on grab
- on release
- on trigger

-- that makes sense for a gun, spray can, a tool, can have different parenting behaviors
different, sounds, different things that happen when pull trigger

- on collide -> push buttons

That might deserve a subclass just for those kinds of interactables

but what about boxes and primitives, that you might want to add interaction with?

- "smart" entities will reveal the missing design:

  - switches that cause other behavior
  - buttons
  - lights
  - play a sound
  - reusable parts

- first work on:

a spray can that can graphitti on plane's with textures
a spray can that can create 3d blobs

- need health display

- tags are poor way to manage entity abilities, now that we have a class
- the class can manage the abilities and don't really need a way to allow

consolidate hud_msg vs hud_broadcast in incoming

Architecture:

load serialized data of the scene: json definition: entities -> components

For each entity:
We're creating meshes with names, ids, some meta data, some tags .... components lost in translation

For each entity json data:
Create the Sphere < Primitive < Entity
can maintain properties of a sphere - can have a mesh
can retain original components - modify the components (re-render the mesh, material, position, rotation, etc)
can provide accessor methods for updating an object
can easily duplicate - knows the color and all the other components - interactable, - shootable etc.

Algorithm for creating a cavern of rooms:

1. place the start zone, mesh box, with a door at one end
2. place the end zone, which a door on one end and switch on the other. (start and end must not intersect)
3. place N random sized rooms which can be made of different shapes like cylinder
4. once all the rooms are placed, join them with tubes of straight meshes

create a large box mesh from which you will carve out other rooms

What doom editor has we don't have:

- birds eye view of map
-

What doom has that we don't have:

- large map to explore (discover the layout)
- different kind of terrains: multi-level, stairs, overhanging, windows
- elevator mechanics
- switches
- there is a goal to reach
- monsters make sound
- monsters have graphics and look like they are walking
- monsters have a die cycle
- monsters take a few hits to die
- monster can throw things at you
- you can see your ammo levels and health and armor

it has to be much easier to design more sophisticated levels

sculpting tool

animation recording tool

- Lack a property inspector to change value of components on entities

better looking avatars:
to do that we need different looking faces 1. to do that we can either make them in blender and allow people to choose
and/or: 1. allow people to sculpt organic meshes in the space 2. save that mesh to a library 3. allow users to choose that mesh as their head and hands

the doom came had a level "end", create a construct that you need to click on to "finish"
the game. If there is no level-end button then defaults to endless wave of enemies.

Change health, ammo, guns, keys to be spawners.

level-end with collection requirement green-crystal-level-end, purple-crystal-level-end
must collect the crystal in order to end the level

mobile joystick is not smooth

waveNumber will increase with total amound of leader time spent in space without a disconnect
wave increase every 60 seconds.

let a set number of enemies be produced within the first 10 seconds of a wave, and then none until
the next wave.

agent manager can have a state of "spawning time" 10 seconds, "battle time" 30 seconds
"gift delivery" 1 second, "rest time" 30 seconds "reset doors", increment wave

drawing new avatar head

sculpting anything in VR

- freeze teleportation after death and resume teleporation after respawn to prevent moving?
- after death drop all weapons and release ammo? etc.
  allow enemy agent to take a few hits before going down

play a kill animation before disappearing immediately

record head and hand animations into a BABYLON compatible animation format and give enemies head and arms

When in browser inline mode, don't allow picking up things or fire bullets when menu is open?

- door manager should be shut off during mode.edit === true

- handle entity animated offset for rotations

- handle assigning continuously spinning meshes. Assign with graphQL a spinning component

Enhancement: Load up initial ammo quota from session storage?

pick up health, pick up

a released gun does not contain ammo, ammo is picked up by the user. So if you have no ammo, and someone with ammo was shooting a gun
then give you the gun, it should have some ammo in it

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

- fix jest - write some js tests

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

4. event hander to parse events needed to persist the game and load it
   - currently is entities -> components
     maybe want:
     - lights
     - meshes
     - spawn points
     - scenes
5. create db schema to persist the game, and load the game with
6. create the js engine to load the game and be able to emit runtime events to broadcast

7. create a pipeline to test the flow of these events.
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

then we need a genserver to keep track of enemy state - new location, damage, visiblity, potentially also rotation and scale

- client:
  a navigation manager - a baked cache (from db)
  Y -> load the nav mesh from binary data
  N -> create new nav mesh from meshes, and bake -> DB

  - db NavMesh, space 1:1 nav_mesh
    - space_id, data

===

leader
create nav mesh commands, send to server
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
events - building things - movements - communications - logs

    ===> eventbus
       - filter by movement to get
           space/member/movements
       - filter by logs to troubleshoot

edit an experience -> saves image

== we need all the logs to come in so I can see them,
need a logging solution
-> send all events to eventbridge - send to FIFO SQS
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

---

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
  then apply an impulse when you release it. what about a fixed turret, it's a gun
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

the message deepends on context - interactable
-- entity grabbed, tag: "interactable" - gun
-- entity grabbed, tag: "gun" - sword
-ball - bow and arrow (subscribe to grab or trigger on other hand for pulling arrow back) - grenade (subscribe to trigger on other hand for pulling pin) - are we scaling an object? - are we grabbing a monsters face - are we grippig the throttle on a space ship - are we cranking a lever

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
    - if object has "two hand scalable" tag

- the other grip squeezed
  - ## intersection of interest

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
- or you are spawning into the spawn point of the game and must also adhere to the permissions of the space - execute scripts - grab and throw - resume/pause - restart

you change your environment as you play (throw things, create things, destroy things)

- the question is which abilities are allowed in the space
  - there are widgets with power (there is a list of widgets allowed in the space)
  - if you have the widget then you can:
    color something
    delete something
    shoot something

Main uses cases:
play a free game together with friends, accomplish some goal. Platform can support many use cases.

play doom together - environment - doors / keys (perhaps only allow sophisticated menus on Desktop) - in VR you can reposition and scale and draw - but any creation or editing, where you tune parameters is done in a webpage - guns - ammo - inventory - health - monsters, AI

star trek bridge crew - primarily a pre-made game, each ship is a URL
all ships define a shared universe namespace, the ships will be placed in shared universe map, with sections - start as an ensign on someones ship, earn playing experience and level up

squadren/battlestar/wing-commander - individual x-wing fighters - return to base ship

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
