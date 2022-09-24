defmodule Thexr.SpaceSupervisor do
  use DynamicSupervisor

  alias Thexr.SpaceServer

  @spec start_link(any) :: :ignore | {:error, any} | {:ok, pid}
  def start_link(_arg) do
    DynamicSupervisor.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  def init(:ok) do
    DynamicSupervisor.init(strategy: :one_for_one)
  end

  @doc """
  Starts a `GameServer` process and supervises it.
  """

  def start_space(space_id) do
    DynamicSupervisor.start_child(__MODULE__, {SpaceServer, space_id})
  end


  @doc """
  Terminates the `GameServer` process normally. It won't be restarted.
  """
  def stop_space(space_id) do
    child_pid = Thexr.SpaceServer.pid(space_id)
    DynamicSupervisor.terminate_child(__MODULE__, child_pid)
  end
end
