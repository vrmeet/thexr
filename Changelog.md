# Changelog

## [0.0.0] - 2021-10-20
### Added
- Spaces, Entities
## [0.0.1] - 2021-10-21
<!-- - Space has one or more 'scene' entities. -->
- Have a list of entities that can be added to a space
- Box, Sphere, Cone
## [0.0.2] - 2021-10-22
- Entity
   - deleting an entity from a space
   - parenting, unparenting an entity
## [0.0.3] - 2021-10-25
- write some tests:
  x parenting entity, will set child count on parent
  x add has_many directive on entity schema 
    has_many :children, Entity, foreign_key: :parent_id
    should allow preloading of children
## [0.0.4] - 2021-10-28
    x one failing test re: child_count
    x show root level entities in the UI
    x some UI to allow parenting
    
## [0.0.5] - 2021-10-31
  x Query top level nodes and any 'expanded' nodes
  x take a flat list -> parent_map
  x parent_map -> recursive data structure for UI
  x content_tag function to render UI
## 
## [0.0.6] ??
- take a parent_map and create a nested struct
ui - present nodes that can be expanded
unparenting

  - write a recursive content_tag to display nested entities
  https://elixirforum.com/t/recursion-templates-and-views/8997/3

- Display some nesting of parent children in the ui for entities
- allow parenting and unparenting of entities in the UI
- Components
   color, rotation, position, 
