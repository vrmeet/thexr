defmodule Thexr.Repo.Migrations.CreateAssetMeshes do
  use Ecto.Migration

  def change do
    create table(:asset_meshes, primary_key: false) do
      add :id, :string, primary_key: true
      add :name, :string, default: ""
      add :data, :map, default: %{}, null: false
      timestamps()
    end
  end
end
