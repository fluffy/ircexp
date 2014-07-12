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


## Model

Consists of Elem (Elements) such as:  Frag, Para, Marker

Operations:
* newPara
* newFrag. 
* changeStyle. Changes style & styleModTime
* killElement. Change dead & deadModTime
* moveElements. Changes prev & prevModTime

Element Attributes:
* rid (random ID) 
* type (para, frag)
* creation time
* modification type
* formatting style
* style modification time 
* text (for fragments)
* creator
* dead flag 


## Database

Keeps a cache of all Elements in each Channel

Keeps track of track time per user per channel.

Keeps track of users and meta data about them.


## Message Bus

Any new Elements created are distributed to all other user subscribed to that
Channel via the message bus. The message bus flow uses HTTP POST from the
sending client to server. It then uses RabbitMQ to distribute it to other
servers which use WebSockets to send it to each receiving client.


## URLs

HTML 
* /login
* /logout
* /doc/:docName - get HTML to render that channel 

JSON API 

* GET/POST/PUT /v1/element/:rid -creates, changes, or fetch an Element

* GET /v1/doc/:docId/meta - get meta information about document 

* GET /v1/doc/:docId/elements?since=time - fetches current cache of Elements 

* GET /v1/user/:userID/meta - get meta information about user 

* PUT/GET /v1/user/:userId/doc/:docName/trackTime - get/set track time 


## Identity

User need to login with OAuth2  provider that can provide an email, user name,

and avatar URL. 

## Security

SElem - Secure Element is an Elem that is encryped with EKey. Contains rid of
unencrypted element, salt, and rid of EKey. Keys come from a KeyServer 


## Notes

All times are ms since unix epoch




