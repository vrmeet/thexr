defmodule Thexr.Repo.Migrations.CreateNavMeshes do
  use Ecto.Migration

  def change do
    create table(:nav_meshes, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :data, :binary
      add :space_id, references(:spaces, on_delete: :delete_all, type: :binary_id)
      timestamps()
    end

    create unique_index(:nav_meshes, [:space_id])
  end
end
