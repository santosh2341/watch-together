# Watch Together — Netflix sync

Keeps two Netflix players in step. **No video is sent between you.** You each play
the film on your own Netflix account; the extension only passes play, pause and
seek between the two of you.

## Installing (both people must do this)

1. Download this `extension` folder to your computer.
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and choose this `extension` folder.

Edge works too — the same steps at `edge://extensions`.

Chrome and Edge only. Extensions do not run on phones or tablets, so Netflix sync
is desktop only. Everything else in Watch Together still works on your phone.

## Using it

1. Open **watch-together-rust.vercel.app** in one tab and sign in.
2. Tap your friend to open the chat. You should see **Netflix sync ready** in the
   chat header — that means the extension is talking to the app.
3. Start a video or audio call from that same chat if you want to talk.
4. Open **netflix.com** in a second tab and both play the same title.

Press play, pause or drag the scrubber and your friend's player follows. A small
badge in the corner of Netflix says what just happened and who did it.

Keep the Watch Together tab open. It is the piece that carries the messages
between you — closing it stops the sync.

## Why it needs a browser extension

A web page cannot reach into another site's video player, and Netflix cannot be
embedded in a frame. Only an extension can run code alongside Netflix's own page.

## If it stops working

Netflix changes its player from time to time. If sync stops, the likely cause is
that `netflix-page.js` can no longer find the player API. Reloading both tabs
fixes most transient problems.

## What it can see

The extension only runs on `netflix.com/watch/*` and on the Watch Together app.
It reads the playback position and paused state of the Netflix player, and
nothing else. It does not read your Netflix account, viewing history, or any
other site.
