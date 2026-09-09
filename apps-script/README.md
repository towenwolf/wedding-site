# Apps Script backend

`Code.gs` is the RSVP backend, bound to the wedding Google Sheet. `appsscript.json`
is its manifest. `guest-list.csv` is a reference copy of the sheet's GuestList tab
(the sheet itself is the source of truth).

## Auto deploy

`.github/workflows/deploy-apps-script.yml` pushes this folder to the Apps Script
project and updates the live web app deployment whenever `apps-script/**` changes
on `main`. The `/exec` URL in `rsvp.html` stays the same because it redeploys the
existing deployment rather than creating a new one.

### One-time setup

1. Enable the Apps Script API for the Google account that owns the script:
   https://script.google.com/home/usersettings

2. Locally, with the owning account:

   ```sh
   npm install -g @google/clasp@2.4.2
   clasp login                 # writes ~/.clasprc.json
   cd apps-script
   clasp clone <SCRIPT_ID>     # SCRIPT_ID is in the Apps Script editor URL
   clasp deployments           # note the deployment ID of the web app
   ```

   Discard the `.clasp.json` and `appsscript.json` that `clasp clone` drops in if
   they differ from what's committed here (or commit the real manifest).

3. Add three repo secrets (Settings > Secrets and variables > Actions):

   | Secret | Value |
   | --- | --- |
   | `CLASPRC_JSON` | full contents of `~/.clasprc.json` |
   | `APPS_SCRIPT_ID` | the script ID |
   | `APPS_SCRIPT_DEPLOYMENT_ID` | the web app deployment ID from `clasp deployments` |

After that, edits to `Code.gs` on `main` deploy automatically. Trigger a manual
run from the Actions tab (`workflow_dispatch`) to test.
