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

  def process_event(slug, event) do
    GenServer.cast(pid(slug), {:event, event})
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

  def ets_refs(slug) do
    safe_call(pid(slug), :get_ets_refs)
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
    member_movements =
      :ets.new(:member_movements, [
        :set,
        :public,
        {:write_concurrency, true},
        {:read_concurrency, true}
      ])

    member_states =
      :ets.new(:member_states, [
        :set,
        :public,
        {:write_concurrency, true},
        {:read_concurrency, true}
      ])

    {:ok,
     %{
       slug: slug,
       member_movements: member_movements,
       member_states: member_states,
       events: []
     }, @timeout}
  end

  # :ets.insert(
  #   socket.assigns.ets_refs,
  #   {socket.assigns.member_id, p0, p1, p2, r0, r1, r2, r3, left, right}
  # )

  def handle_cast({:event, event}, state) do
    IO.inspect(event, label: "got event")
    state = %{state | events: [event | state.events]}
    {:noreply, state}
  end

  def handle_call(:summary, _from, state) do
    {:reply, state, state, @timeout}
  end

  def handle_call(:get_ets_refs, _from, state) do
    {:reply, {state.member_movements, state.member_states}, state, @timeout}
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
