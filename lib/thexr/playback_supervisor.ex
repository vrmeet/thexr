defmodule Thexr.PlaybackSupervisor do
  use DynamicSupervisor

  alias Thexr.PlaybackServer

  def start_link(_arg) do
    DynamicSupervisor.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  def init(:ok) do
    DynamicSupervisor.init(strategy: :one_for_one)
  end

  @doc """
  Starts a `GameServer` process and supervises it.
  """

  def start_playback(source_space_id, target_space_id, start_seq, end_seq) do
    DynamicSupervisor.start_child(
      __MODULE__,
      {PlaybackServer, {source_space_id, target_space_id, start_seq, end_seq}}
    )
  end

  @doc """
  Terminates the `GameServer` process normally. It won't be restarted.
  """
  def stop_playback(target_space_id) do
    child_pid = Thexr.PlaybackServer.pid(target_space_id)
    DynamicSupervisor.terminate_child(__MODULE__, child_pid)
  end
end
