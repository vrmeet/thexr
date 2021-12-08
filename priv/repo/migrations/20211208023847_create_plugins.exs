defmodule Thexr.Repo.Migrations.CreatePlugins do
  use Ecto.Migration

  def change do
    create table(:plugins, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :ts, :text
      add :js, :text

      timestamps()
    end
  end
end
