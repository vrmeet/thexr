defmodule Thexr.Repo.Migrations.CreateComponents do
  use Ecto.Migration

  def change do
    create table(:components, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :type, :string
      add :data, :map
      add :entity_id, references(:entities, on_delete: :delete_all, type: :binary_id), null: false
      # timestamps()
    end

    create unique_index(:components, [:entity_id, :type])
  end
end
