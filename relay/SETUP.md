# Set up Postiz scheduling (about 10 minutes)

The app schedules posts through a small **relay** on Cloudflare. The relay holds your Postiz API key, so the key never sits in the app or on GitHub.

This is easier on a computer, but a phone works too.

## 1. Get your Postiz API key
1. Open Postiz → **Settings** → **Public API**.
2. Copy the API key. Keep it private, and don't paste it anywhere except Cloudflare in step 3.

## 2. Create the relay
1. Log in at **dash.cloudflare.com**.
2. Go to **Workers & Pages** → **Create** → **Create Worker** (the "Hello World" starter).
3. Name it `studio-relay` and tap **Deploy**.
4. Tap **Edit code**. Delete everything in the editor.
5. Open this link, then select all the text and copy it:
   https://raw.githubusercontent.com/zewalrus/pipeline/main/relay/worker.js
6. Paste it into the Cloudflare editor and tap **Deploy**.

## 3. Add the settings
In the worker, go to **Settings** → **Variables and Secrets** → **Add**, and add these three:

| Type   | Name             | Value |
|--------|------------------|-------|
| Secret | `POSTIZ_API_KEY` | the key from step 1 |
| Secret | `APP_PASSCODE`   | make up a long passphrase, e.g. four random words |
| Text   | `ALLOWED_ORIGIN` | `https://zewalrus.github.io` |

Tap **Deploy** (or **Save**) when you're done.

## 4. Connect the app
1. Copy the worker's address from its overview page. It looks like `https://studio-relay.<your-name>.workers.dev`.
2. In the app, open **Kit** → **Postiz scheduling**.
3. Paste the address, type the same passcode as `APP_PASSCODE`, and tap **Connect**.
4. Check that the right Instagram account and Facebook page are selected.

Repeat step 4 on each phone or computer you use. The address and passcode are saved only on that device.

## Using it
1. Build a post, set its date and time, and add the media: one video for a reel, 2–20 items for a carousel, or one image.
2. Tap **Schedule with Postiz**.
3. The app checks Postiz when you open it and marks posts as posted once they go live. You can also tap **Check Postiz** on the Today tab.

The first time, open Postiz afterwards and confirm the post looks right there.

## If something goes wrong
- **Wrong passcode**: the passcode in the app doesn't match `APP_PASSCODE`.
- **Invalid API key**: copy the key from Postiz again and update `POSTIZ_API_KEY`.
- **This relay only works from…**: `ALLOWED_ORIGIN` must be exactly `https://zewalrus.github.io`, with no slash at the end.
- **Too many requests**: Postiz limits API calls per hour. Wait a bit and try again.
