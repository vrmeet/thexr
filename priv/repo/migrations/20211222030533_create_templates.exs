defmodule Thexr.Repo.Migrations.CreateTemplates do
  use Ecto.Migration

  def change do
    create table(:templates, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :description, :string, null: false
      add :data, :text, default: ""
      timestamps()
    end

    create unique_index(:templates, [:name])
  end
end
