defmodule ThexrWeb.Router do
  use ThexrWeb, :router
  use Honeybadger.Plug

  import ThexrWeb.Plugs.Identity, only: [maybe_assign_unique_id: 2]

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, {ThexrWeb.LayoutView, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug :maybe_assign_unique_id
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  # Other scopes may use custom stacks.
  # scope "/", ThexrWeb do
  #   pipe_through :api
  #   forward "/api", Absinthe.Plug, schema: Thexr.Schema

  #   forward "/graphiql", Absinthe.Plug.GraphiQL,
  #     schema: Thexr.Schema,
  #     interface: :simple,
  #     context: %{pubsub: ThexrWeb.Endpoint}
  # end

  scope "/" do
    pipe_through :api

    forward "/api", Absinthe.Plug, schema: ThexrWeb.Schema.Schema

    forward "/graphiql", Absinthe.Plug.GraphiQL,
      schema: ThexrWeb.Schema.Schema,
      interface: :simple
  end

  scope "/", ThexrWeb do
    pipe_through :browser

    get "/", PageController, :index
    get "/:slug", SpaceController, :show
  end

  scope "/admin", ThexrWeb do
    pipe_through :browser

    # live "/templates", TemplateLive.Index, :index
    # live "/templates/new", TemplateLive.Index, :new
    # live "/templates/:id/edit", TemplateLive.Index, :edit

    # live "/templates/:id", TemplateLive.Show, :show
    # live "/templates/:id/show/edit", TemplateLive.Show, :edit
  end

  scope "/m", ThexrWeb do
    pipe_through :browser

    # basic starting point for seeing a space
    live "/spaces", SpaceLive.Index, :index
    live "/spaces/new", SpaceLive.Index, :new
    live "/spaces/:id/edit", SpaceLive.Index, :edit

    live "/edit_space/:slug", SpaceEditLive.Index, :index
    live "/edit_space/:slug/edit", SpaceEditLive.Index, :edit

    # live "/spaces/:id/show/edit", SpaceLive.Show, :edit

    # spaces have entities
    # live "/entities", EntityLive.Index, :index
    # live "/entities/new", EntityLive.Index, :new
    # live "/entities/:id/edit", EntityLive.Index, :edit

    # live "/entities/:id", EntityLive.Show, :show
    # live "/entities/:id/show/edit", EntityLive.Show, :edit

    # entities have components
    # live "/components", ComponentLive.Index, :index
    # live "/components/new", ComponentLive.Index, :new
    # live "/components/:id/edit", ComponentLive.Index, :edit

    # live "/components/:id", ComponentLive.Show, :show
    # live "/components/:id/show/edit", ComponentLive.Show, :edit
  end

  # Enables LiveDashboard only for development
  #
  # If you want to use the LiveDashboard in production, you should put
  # it behind authentication and allow only admins to access it.
  # If your application does not have an admins-only section yet,
  # you can use Plug.BasicAuth to set up some basic authentication
  # as long as you are also using SSL (which you should anyway).
  if Mix.env() in [:dev, :test] do
    import Phoenix.LiveDashboard.Router

    scope "/admin" do
      pipe_through :browser
      live_dashboard "/dashboard", metrics: ThexrWeb.Telemetry
    end
  end

  # Enables the Swoosh mailbox preview in development.
  #
  # Note that preview only shows emails that were sent by the same
  # node running the Phoenix server.
  if Mix.env() == :dev do
    scope "/dev" do
      pipe_through :browser

      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end
end
