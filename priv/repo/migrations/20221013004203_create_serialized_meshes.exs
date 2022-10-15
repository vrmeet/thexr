defmodule Thexr.Repo.Migrations.CreateSerializedMeshes do
  use Ecto.Migration

  def change do
    create table(:serialized_meshes, primary_key: false) do
      add :state_id, :string, primary_key: true
      add :entity_id, :string, primary_key: true
      add :data, :map, default: %{}, null: false
      timestamps()
    end
  end
end
