defmodule Thexr.SpaceCommand do
  def create_box(slug, id, name, position, rotation, scaling) do
    event = %Thexr.Events.BoxCreated{
      id: id,
      name: name,
      position: position,
      rotation: rotation,
      scaling: scaling
    }

    Thexr.SpaceServer.process_event(slug, event)
  end
end
