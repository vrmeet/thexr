defmodule Thexr.Repo do
  use Ecto.Repo,
    otp_app: :thexr,
    adapter: Ecto.Adapters.Postgres
end
