# Sending the league announcement

Sends one personalised email to each person on your list, through your own SMTP mailbox
(Bluehost). Everything runs **on your computer**: your people list and the mailbox password never go
into the repository or onto the internet.

It is safe by default. With no extra options it only checks the list and writes a preview; nothing is sent.

## One-time setup
1. Install Node.js 20 or newer (nodejs.org) and, in the project folder, run `npm ci`.
2. **Recommended: use a separate mailbox for this**, for example `league@connect-talent.org`, created in
   Bluehost (cPanel, Email Accounts). The sign-in emails for the app use `notifications@`. If a big batch hits
   Bluehost's hourly limit, that mailbox can be blocked, and then people's sign-in links would stop arriving.
3. Copy `email/.env.example` to `email/.env` and fill it in (host, port, mailbox, password). Keep the password in
   single quotes. This file is ignored by git: never share it or commit it.
4. Open `email/announcement.config.json` and fill in every value marked `TODO` (reply address, unsubscribe
   address, the video link, a contact). Set `from_email` to the mailbox you chose. Optionally add a `deadline`
   (for example `"Sunday 15 November"`). The tool **refuses to send** while any `TODO` is left.
5. Check email authentication for connect-talent.org (Bluehost cPanel, Email Deliverability: SPF and DKIM should
   both show valid). Without this, many messages will go to spam.

## Your list
A CSV file with a header row, saved as `email/recipients.csv` (see `recipients.example.csv`):

```
email,first_name,type
sam@example.org,Sam,volunteer
```

Only `email` is required. `first_name` makes it personal ("Hi Sam"); without it people get "Hi there".
Only include people your charity is allowed to email. To exclude people (for example anyone who asked to
stop), put their addresses in a one-column file `email/unsubscribed.csv` (header `email`) and add
`--suppress email/unsubscribed.csv` to the commands below.

## Steps
Run these from the project folder.

**1. Check the list and see a preview (sends nothing)**
```
node --env-file=email/.env scripts/send-broadcast.cjs --list email/recipients.csv
```
It reports how many valid people there are, skips bad or duplicate addresses, and writes
`email/preview.html`: open it in a browser and read the email as a recipient would.

**2. Send yourself a test** (to a phone address too, and look in spam)
```
node --env-file=email/.env scripts/send-broadcast.cjs --list email/recipients.csv --test-to you@example.org
```

**3. Send for real**
```
node --env-file=email/.env scripts/send-broadcast.cjs --list email/recipients.csv --send
```
It asks you to type `SEND <number>` before anything goes out. It sends slowly (about 100 an hour by default) to
stay inside Bluehost's limits, so a long list takes a while: leave the window open. Change the pace with
`--per-hour 60`, or cap one run with `--max 50`.

## If it stops
- It **stops straight away** if the mail server says a sending limit was reached, or after 3 failures in a row.
- Every email is written to `email/sent-log.csv`. **Run the same command again later and it carries on where it
  stopped. It never emails the same person twice.**
- Check your Bluehost plan's hourly and daily email limits and set `--per-hour` below them.

## Good practice
- Send a small batch first (`--max 20`), check replies and bounces, then send the rest.
- Reply "unsubscribe" requests: add those addresses to `unsubscribed.csv` and remove them from your own list.
- **Change the mailbox password** if it was ever pasted into a chat or an email, then update `email/.env`
  (and anywhere else that uses it, such as the app's sign-in email settings or your website).
- This tool is only for the announcement. Sign-in emails are sent by the app itself.
