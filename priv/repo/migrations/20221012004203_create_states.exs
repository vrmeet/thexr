defmodule Thexr.Repo.Migrations.CreateStates do
  use Ecto.Migration

  def change do
    create table(:states, primary_key: false) do
      add :state_id, :string, primary_key: true
      add :entity_id, :string, primary_key: true
      add :components, :map, default: %{}, null: false
      timestamps()
    end
  end
end
