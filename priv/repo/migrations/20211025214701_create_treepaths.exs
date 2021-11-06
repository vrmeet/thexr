defmodule Thexr.Repo.Migrations.CreateTreepaths do
  use Ecto.Migration

  def change do
    create table(:treepaths, primary_key: false) do
      add :ancestor_id, references(:entities, on_delete: :delete_all, type: :binary_id), null: false, primary_key: true
      add :descendant_id, references(:entities, on_delete: :delete_all, type: :binary_id), null: false, primary_key: true
      add :depth, :integer, default: 0, null: false
    end

    create index(:treepaths, [:ancestor_id])
    create index(:treepaths, [:descendant_id])
  end
end
