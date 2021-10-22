defmodule Thexr.Repo.Migrations.CreateEntities do
  use Ecto.Migration

  def change do
    create table(:entities, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :type, :string, null: false
      add :space_id, references(:spaces, on_delete: :delete_all, type: :binary_id), null: false
      add :parent_id, references(:entities, on_delete: :delete_all, type: :binary_id)
      # left
      # right
      # group_id
      timestamps()
    end

    create index(:entities, [:space_id])
    create index(:entities, [:parent_id])
    # create unique_index(:entities, [:space_id, :name])
  end
end
