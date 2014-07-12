# Design

The basic idea is there are a bunch of channels that a user can be listening too
(think of something like an IRC channel). Each channel is a flow of elements
that are rendered to create the document for that channel.

Elements can be a "para" which represents a new paragraph or a "frag" which
represents a fragment of text. Each Element has a creation time, a random
identifier (rid) which is just a random number that uniquely identifies the
element, and a pointer called "prev" to the Element that precedes this one.

The prev pointers to not form a linked list but instead a tree. More than one
Element can have the same previos Element. In this case the subtrees are ordered
when redering by the time of creation of the two Elements with the save value
for the previous Element.

Elements are never deleted but instead are simply marked "dead". This allows for
conflict free merges when two different people are changing a document at the
same time.

Elements also keep track of the last time they were modified so that the systems
can easily display what has changed in a Document since some prior time. Each
user has a "track time" for each document and renders the document in a way
where they can see the changes since their "track time".

Paragraphs and Fragments have styles which defined the formatting and can be
changed. When merging formatting changes, whichever one happen last wins.

