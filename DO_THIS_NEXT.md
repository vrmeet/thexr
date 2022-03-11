TODO:

- remove browse texture until menu is open
- make primitives a scrollable list
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
