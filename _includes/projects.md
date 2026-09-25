<h2 id="projects">Featured Projects & Impact</h2>

<div class="projects">
<div class="bibliography">
{% assign project_groups = site.data.projects.main | group_by: "group" %}
{% for group in project_groups %}
<div class="group-label">{{ group.name }}</div>
{% for link in group.items %}
<div class="pub-row">
  <div class="col-sm-3 abbr">
    {% if link.image %}
    <img src="{{ link.image }}" alt="{{ link.image_alt }}" class="teaser"{% if link.fit %} data-fit="{{ link.fit }}"{% endif %}>
    {% endif %}
  </div>
  <div class="col-sm-9">
    <div class="title">{% if link.link %}<a href="{{ link.link }}">{{ link.title }}</a>{% else %}{{ link.title }}{% endif %}</div>
    {% if link.date %}<div class="date">{{ link.date }}</div>{% endif %}
    <div class="periodical">{{ link.subtitle }}</div>
    <div class="links">
      {% if link.code %}
      <a href="{{ link.code }}" class="btn btn-sm z-depth-0" role="button" target="_blank" style="font-size:12px;">GitHub</a>
      {% endif %}
      {% if link.notes %}
      <span class="metric">{{ link.notes }}</span>
      {% endif %}
    </div>
  </div>
</div>
{% endfor %}
{% endfor %}

</div>
</div>
