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

## [0.0.6] - 2021-11-03
x ability to unparent an entity in the UI
x created migration and schema for components

- prevent circular references in parenting
- ability to add components to an entity when selected
- add polymorphic embedded schema for different shapes of components

- Components
   color, rotation, position, 
