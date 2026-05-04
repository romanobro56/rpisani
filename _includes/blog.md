<h2 id="blog" style="margin: 20px 0px -15px;">Recent Blog Posts</h2>

<div class="blog-posts">
<div class="bibliography">

{% for post in site.data.blog.posts limit:2 %}
<div class="pub-row">
  <div class="col-sm-9" style="position: relative;padding-right: 15px;padding-left: 20px;">
      <div class="title" style="margin-top: 30px;"><a href="{{ post.url }}">{{ post.title }}</a></div>
      <div class="author">{{ post.date }} • {{ post.read_time }}</div>
      <div class="periodical" style="margin-top: 8px;">{{ post.excerpt }}</div>
    <div class="links" style="margin-top: 8px;">
      <a href="{{ post.url }}" class="btn btn-sm z-depth-0" role="button" style="font-size:12px;">Read More</a>
    </div>
  </div>
</div>
<br>
{% endfor %}

<div style="text-align: center; margin-top: 10px;">
  <a href="/blog/" class="btn btn-sm z-depth-0" role="button" style="font-size:12px;">View All Posts</a>
</div>

</div>
</div>
