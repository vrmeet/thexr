defmodule Thexr.Repo.Migrations.CreateEntityMeshes do
  use Ecto.Migration

  def change do
    create table(:entity_meshes, primary_key: false) do
      add :state_id, :string, primary_key: true
      # add :entity_id, :string, primary_key: true
      # add :mesh_id, :string, primary_key: true
      add :entity_id,
          references(:entities, on_delete: :delete_all, type: :string, with: [state_id: :state_id]),
          primary_key: true

      add :mesh_id,
          references(:state_meshes,
            on_delete: :delete_all,
            type: :string,
            with: [state_id: :state_id]
          ),
          primary_key: true
    end

    # see if any entities are using a mesh
    create index(:entity_meshes, [:state_id, :mesh_id])
  end
end
