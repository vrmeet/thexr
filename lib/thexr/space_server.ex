defmodule Thexr.SpaceServer do
  @moduledoc """
  A space server process that holds some data common for a space.
  """
  # alias BabylonPhoenix.Util
  use GenServer, restart: :transient
  require Logger

  @timeout :timer.minutes(25)

  # Client (Public) Interface

  @doc """
  Spawns a new space server process registered under the given `space_slug`.
  options are passed to initialize the space state
  """
  def start_link(slug) do
    GenServer.start_link(
      __MODULE__,
      {:ok, slug},
      name: via_tuple(slug)
    )
  end

  @doc """
  Returns a tuple used to register and lookup a game server process by name.
  """
  def via_tuple(slug) do
    {:via, Registry, {Thexr.SpaceRegistry, slug}}
  end

  @doc """
  Returns the `pid` of the game server process registered under the
  given `game_name`, or `nil` if no process is registered.
  """
  def pid(slug) do
    slug
    |> via_tuple()
    |> GenServer.whereis()
  end

  def ets_ref(slug) do
    safe_call(pid(slug), :get_ets_ref)
  end

  def safe_call(pid, payload) when is_pid(pid) do
    GenServer.call(pid, payload)
  end

  def safe_call(nil, _) do
    {:error, :no_pid}
  end

  #################################################################
  # Server Callbacks
  #################################################################

  def init({:ok, slug}) do
    ets_ref =
      :ets.new(:member_movements, [
        :set,
        :public,
        {:write_concurrency, true},
        {:read_concurrency, true}
      ])

    {:ok,
     %{
       slug: slug,
       ets_ref: ets_ref
     }, @timeout}
  end

  # :ets.insert(
  #   socket.assigns.ets_ref,
  #   {socket.assigns.member_id, p0, p1, p2, r0, r1, r2, r3, left, right}
  # )

  def handle_call(:summary, _from, state) do
    {:reply, state, state, @timeout}
  end

  def handle_call(:get_ets_ref, _from, state) do
    {:reply, state.ets_ref, state, @timeout}
  end

  def handle_info(:timeout, state) do
    {:noreply, state}
  end

  def terminate({:shutdown, :timeout}, _game) do
    :ok
  end

  def terminate(_reason, _game) do
    :ok
  end
end
