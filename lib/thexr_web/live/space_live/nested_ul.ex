defmodule ThexrWeb.SpaceLive.NestedUl do
  import Phoenix.HTML.Tag, only: [content_tag: 3]

  def nested_ul(entities, opts) when is_list(entities) do
    content_tag(:ul, class: "entities") do
      Enum.map(entities, fn entity ->
        li(entity, opts)
      end)
    end
  end

  def li_class(entity, opts) do
    cond do
      opts.selected_entity && opts.selected_entity.id == entity.id ->
        "selected"

      opts.selected_previous_entity && opts.selected_previous_entity.id == entity.id ->
        "previously_selected"

      true ->
        ""
    end
  end

  def li(entity, opts) do
    class = li_class(entity, opts)

    content_tag(:li,
      id: entity.id,
      class: class,
      phx_click:
        Phoenix.LiveView.JS.push("select_entity",
          value: %{id: entity.id, parent_id: entity.parent_id}
        )
    ) do
      li_content(entity, opts)
    end
  end

  def li_content(entity, opts) do
    case entity.children do
      [_ | _] ->
        expanded_node(entity, opts)

      _ ->
        cond do
          entity.child_count > 0 -> unexpanded_node(entity, opts)
          true -> entity.name
        end
    end
  end

  def unexpanded_node(entity, _opts) do
    plus =
      content_tag(:span,
        phx_click: Phoenix.LiveView.JS.push("expand_entity", value: %{id: entity.id})
      ) do
        "+ "
      end

    [plus, entity.name]
  end

  def expanded_node(entity, opts) do
    minus =
      content_tag(:span,
        phx_click: Phoenix.LiveView.JS.push("collapse_entity", value: %{id: entity.id})
      ) do
        "- "
      end

    [
      minus,
      entity.name,
      nested_ul(entity.children, opts)
    ]
  end
end
