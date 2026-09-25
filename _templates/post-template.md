---
layout: post
title: "Post Title"
permalink: /posts/post-title/
---
{% comment %}
  HOW TO USE THIS TEMPLATE
  1. Copy this file to _posts/YYYY-MM-DD-post-title.md
  2. Set `title` and `permalink` above, and the ## heading below to the same title.
  3. Add the post to the top of _data/blog.yml so it shows on the homepage and /blog/:
       - title: "Post Title"
         date: Month D, YYYY
         read_time: X min read
         excerpt: "One or two sentences for the post card."
         url: /posts/post-title/
  These comment blocks are left out of the built page, so they can stay or go.
{% endcomment %}

[← Back to Home](/)

## Post Title

Opening paragraph. Put a note marker right after the punctuation it belongs to.<sup class="note-ref"><a href="#note-1" id="ref-1" aria-label="Note 1">&#42;</a></sup> The sentence keeps going after the marker.

Keep paragraphs to one idea each. Start a new one when the topic shifts.

{% comment %}
  SECTION HEADING
  Use ### for sections inside the post. The ## title above stays the largest heading.
{% endcomment %}
### Section Heading

A paragraph that introduces a list:

- First item
- Second item
- Third item

Another paragraph with a second note.<sup class="note-ref"><a href="#note-2" id="ref-2" aria-label="Note 2">&dagger;</a></sup> Use **bold** for emphasis.

{% comment %}
  GRAPHIC CAPTION
  Put this right under any AI-generated graphic. Delete it if the post has none.
{% endcomment %}
AI-generated graphic for readability
{: .side-note}

Closing paragraph.

{% comment %}
  NOTES
  Markers go in order of appearance: * † ‡ § ‖ ¶
    &#42;   &dagger;   &Dagger;   &sect;   &#8214;   &para;
  Each marker in the text links to #note-N and has id="ref-N".
  Each note links back to #ref-N and ends with {: .side-note #note-N}.
  Clicking a marker scrolls to its note; clicking the note's symbol scrolls back.
{% endcomment %}
<hr class="notes-rule">

<sup class="note-ref"><a href="#ref-1" aria-label="Back to text">&#42;</a></sup> First note.
{: .side-note #note-1}

<sup class="note-ref"><a href="#ref-2" aria-label="Back to text">&dagger;</a></sup> Second note.
{: .side-note #note-2}

AI used in the writing of this article: small typographic corrections only
{: .side-note}
