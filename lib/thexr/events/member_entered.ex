defmodule Thexr.Events.MemberEntered do
  # name, position, rotation, scaling
  defstruct [:space_id, :id, :name, :position, :rotation, :scaling]
end
