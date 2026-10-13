# Chloe's portfolio: setup guide (about 30 minutes, one time)

You'll do three things: (1) put the site files on GitHub, (2) have Netlify turn them into a live website, (3) switch on the login for your edit dashboard. After that you never touch any of this again. You just visit your-site/admin/ to add pictures and text.

Never share a password with anyone, including Claude.

## Part 1: Put the files on GitHub
1. Unzip the folder `portfolio-site` on your computer. Open it so you see: admin, content, src, build.mjs, netlify.toml, SETUP.md.
2. Make sure your GitHub email is verified (check your inbox/spam for the GitHub email; on github.com you can click your picture, Settings, Emails, "Resend verification").
3. On github.com click the + at the top right, then "New repository".
4. Repository name: `portfolio`. Choose Public. Do NOT tick "Add a README". Click "Create repository".
5. On the next page click the "uploading an existing file" link.
6. Open your unzipped folder, select EVERYTHING inside it (admin, content, src, build.mjs, netlify.toml), and drag it all into the GitHub page. Wait for the uploads to finish.
7. Scroll down and click "Commit changes".
   Check: the repo should list the folders admin, content, src plus build.mjs and netlify.toml.

## Part 2: Make it a live website with Netlify
1. Go to netlify.com, click "Sign up", and choose "Sign up with GitHub". Approve it.
2. Click "Add new project", then "Import an existing project", then GitHub. Allow access and pick the `portfolio` repo.
3. Leave the settings as they are (they come from the file netlify.toml). Click "Deploy".
4. After about a minute you get a free address like `something.netlify.app`. Open it. That's your site. (Site configuration > "Change site name" lets you pick a nicer one.)

## Part 3: Turn on the edit dashboard login
This lets GitHub confirm it's really you when you open /admin.
1. Go to github.com/settings/developers, click "OAuth Apps", then "New OAuth App".
2. Application name: Portfolio editor. Homepage URL: your netlify.app address. Authorization callback URL: exactly `https://api.netlify.com/auth/done`. Click Register.
3. Copy the Client ID. Click "Generate a new client secret" and copy the secret right away (you can't see it again). Keep both somewhere private.
4. In Netlify open your site, then Project configuration > Security (or "Access & security") > OAuth > "Install provider". Choose GitHub, paste the Client ID and Client secret, and Save.
5. Check that the repo name in the file admin/config.yml matches yours (it says `chloeschlesinger/portfolio`). If your GitHub username or repo name differs, click that file on GitHub, click the pencil, fix the `repo:` line, and commit.
6. Visit `your-site.netlify.app/admin/`, click "Login with GitHub", and approve.

## Using the dashboard
- "Pages" > Home / About me + Contact: change text, add your photo, portrait, 4 About photos, email, LinkedIn, and résumé PDF.
- "Campaigns": open Godox C100 or Strip Jerky. Add each poster image on its row, and use the grey arrows to reorder. Add or remove posters with the list buttons.
- "New Campaign" creates another tab automatically. Pick a layout, an accent color, and an Order number.
- Click Publish. The site updates in about a minute.
- Leaving a picture empty keeps the labeled placeholder box, so nothing looks broken while you work.

## Later: your own domain
Buy one anywhere, then in Netlify go to Domain management > Add a domain and follow the prompts.

## If something goes wrong
- Login says "not found / no access": the `repo:` line in admin/config.yml doesn't match your repo.
- Site didn't update: Netlify > Deploys shows the latest build and any error message. Send me a screenshot.
