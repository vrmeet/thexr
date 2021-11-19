defmodule Thexr.Participant do
  alias Thexr.Participant
  # state can be: playing, ready to play, not_playing
  defstruct [:id, health: 100, state: :not_playing]

  def new(id) do
    %Participant{id: id}
  end

  def opt_in(participant) do
    %Participant{participant | state: :ready_to_play}
  end

  def start_playing(participant) do
    %Participant{participant | state: :playing}
  end

  def stop_playing(participant) do
    %Participant{participant | state: :not_playing}
  end

  def opted_in?(participant) do
    participant.state == :ready_to_play
  end
end
