defmodule Thexr.Repo.Migrations.CreateStateMeshes do
  use Ecto.Migration

  def change do
    create table(:state_meshes, primary_key: false) do
      add :state_id, :string, primary_key: true
      add :id, :string, primary_key: true
      add :data, :map, default: %{}, null: false
      timestamps()
    end
  end
end
