defmodule Thexr.Repo.Migrations.CreateEvents do
  use Ecto.Migration

  def change do
    create table(:events, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :type, :string, null: false
      add :sequence, :integer, default: 0, null: false
      add :payload, :map, default: %{}, null: false
      add :space_id, references(:spaces, on_delete: :delete_all, type: :binary_id)

      timestamps()
    end

    create index(:events, [:space_id])
  end
end
