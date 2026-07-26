<h2 id="blog">Recent Blog Posts</h2>

<div class="blog-posts">
<div class="bibliography">

{% for post in site.data.blog.posts limit:2 %}
<div class="pub-row">
  <div class="col-sm-9">
      <div class="title"><a href="{{ post.url }}">{{ post.title }}</a></div>
      <div class="author">{{ post.date }} • {{ post.read_time }}</div>
      <div class="periodical">{{ post.excerpt }}</div>
    <div class="links">
      <a href="{{ post.url }}" class="btn btn-sm z-depth-0" role="button" style="font-size:12px;">Read More</a>
    </div>
  </div>
</div>
<br>
{% endfor %}

<div class="blog-posts__all">
  <a href="/blog/" class="btn btn-sm z-depth-0" role="button" style="font-size:12px;">View All Posts</a>
</div>

</div>
</div>
