defmodule Thexr.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      # Start the Ecto repository
      Thexr.Repo,
      # Start the Telemetry supervisor
      ThexrWeb.Telemetry,
      # Start the PubSub system
      {Phoenix.PubSub, name: Thexr.PubSub},
      # Start Presence
      ThexrWeb.Presence,
      # Start the Endpoint (http/https)
      ThexrWeb.Endpoint,
      {Registry, keys: :unique, name: Thexr.SpaceRegistry},
      {Registry, keys: :unique, name: Thexr.SpacePlaybackRegistry},
      Thexr.SpaceSupervisor,
      Thexr.QueueBroadcaster,
      Thexr.EventWriter,
      Thexr.PlaybackSupervisor
      # Start a worker by calling: Thexr.Worker.start_link(arg)
      # {Thexr.Worker, arg}
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Thexr.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    ThexrWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
