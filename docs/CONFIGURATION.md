# Configuration Guide

Overview of DefCat DeckVault configuration options managed through the Admin Panel.

---

## Site Settings

**Access:** [Admin Panel > Site Settings](/admin/settings)

The Site Settings tab allows you to manage site-wide configuration values organized into three categories.

### Videos Configuration

Configure YouTube video links that appear across the site (featured videos, tutorials, etc.).

**Adding a Video:**
1. Go to [Site Settings](/admin/settings)
2. Click the **Videos** tab
3. Click **Add Video Link**
4. Enter:
   - **Key:** Identifier like `youtube_featured_1` or `tutorial_deck_building`
   - **Value:** The full YouTube URL or video ID
   - **Description:** What this video is for
5. Click **Create**
6. Click **Save Configuration**

**Tip:** You can use either the full YouTube URL or just the video ID (the part after `?v=`).

### Social Links Configuration

Configure social media profile URLs displayed in site footer and navigation.

**Common Social Keys:**
- `twitter_url` - Twitter/X profile link
- `discord_url` - Discord server invite link
- `patreon_url` - Patreon page link
- `youtube_url` - YouTube channel link
- `moxfield_url` - Moxfield profile link

**Adding a Social Link:**
1. Go to [Site Settings](/admin/settings)
2. Click the **Social** tab
3. Click **Add Social Link**
4. Enter the key, full URL, and description
5. Click **Save Configuration**

### General Configuration

Miscellaneous site settings and metadata.

**Common General Keys:**
- `site_title` - Site name displayed in browser tabs
- `site_description` - Meta description for SEO
- `maintenance_mode` - Set to `true` to enable maintenance mode
- `announcement_banner` - Text for site-wide announcement banner

---

## Credit System

**Access:** [Admin Panel > Site Settings > Credits Tab](/admin/settings) (Admin+ only)

The credit system controls user access to deck submissions and other premium features.

### Credit Types

View and manage the different types of credits available in the system.

**Default Credit Types:**
- **Deck Credits** - Used for deck submission requests
- **Roast Credits** - Used for deck roast/critique requests

**Adding a Credit Type:**
1. Go to [Site Settings > Credits](/admin/settings)
2. Click **Add Credit Type**
3. Enter:
   - **Display Name:** Human-readable name (e.g., "Review Credits")
   - **ID:** Auto-generated from display name
   - **Description:** What this credit is used for
4. Click **Add Credit Type**

### Tier Benefits Matrix

Configure how many credits each Patreon tier receives during monthly distribution.

**How It Works:**
- Rows = Patreon tiers (Citizen, Knight, Emissary, Duke, Wizard, ArchMage)
- Columns = Credit types (Deck Credits, Roast Credits, etc.)
- Values = Number of credits granted per month

**Editing Benefits:**
1. Go to [Site Settings > Credits](/admin/settings)
2. Find the **Tier Benefits Matrix** section
3. Enter the credit amount in each tier/type cell
4. Changes auto-save when you modify a value

**Example Configuration:**

| Tier | Deck Credits | Roast Credits |
|------|-------------|---------------|
| Citizen | 0 | 0 |
| Knight | 0 | 1 |
| Emissary | 1 | 1 |
| Duke | 1 | 2 |
| Wizard | 2 | 2 |
| ArchMage | 3 | 3 |

### Distribution Manager

View credit distribution history and trigger manual distributions.

**Distribution History:**
- Shows past distributions with dates and status
- Displays which tiers received credits
- Tracks automatic monthly distributions

**Manual Distribution:**
Use this if automatic distribution fails or needs to be triggered early.

---

## Patreon Tier Configuration

Tiers are determined by the user's monthly pledge amount on Patreon:

| Tier | Monthly Pledge | Typical Benefits |
|------|---------------|------------------|
| Citizen | $2+ | Basic site access |
| Knight | $10+ | Basic access + minor credits |
| Emissary | $30+ | Access to premium decks |
| Duke | $50+ | Full deck access + credits |
| Wizard | $165+ | Enhanced credits |
| ArchMage | $250+ | Maximum credits |

**Note:** Actual credit amounts per tier are configured in the [Benefits Matrix](/admin/settings) and can be adjusted at any time.

---

## Route Access Control

Different parts of the site have different access requirements:

| Route | Required Access |
|-------|----------------|
| `/` (Home) | Public |
| `/decks` | Public (list and details) |
| `/profile` | Any authenticated user |
| `/submit` | User with available deck credits |
| `/admin` | Moderator role or higher |
| `/admin/settings` | Moderator+ (Credits tab requires Admin+) |
| `/admin/users` | Admin role or higher |
| `/admin/decks` | Moderator role or higher |

---

## User Roles

The system uses a hierarchical role structure. Higher roles inherit all permissions from lower roles.

| Role | Access Level |
|------|-------------|
| User | Basic site access (anonymous visitors) |
| Member | Authenticated user access (all Patreon patrons) |
| Moderator | Admin panel access, site settings, deck management |
| Admin | Full admin access including user management and credits |

**Changing User Roles:**
1. Go to [User Management](/admin/users)
2. Search for the user by email
3. Click the role dropdown on their card
4. Select the new role

---

## Troubleshooting

### Login Issues
- Ensure your Patreon account is linked correctly
- Try logging out and back in to refresh your tier
- Clear browser cookies and try again
- Contact an admin if your tier isn't updating

### Access Denied
- Verify your Patreon subscription is active
- Check that you meet the tier requirement for the content
- Try refreshing the page after a recent tier upgrade
- Your tier syncs automatically - wait a few minutes after upgrading

### Credit Issues
- Credits are distributed monthly based on your tier at distribution time
- If credits are missing, contact an admin to check distribution history
- Admins can manually adjust user credits in [User Management](/admin/users)

### Configuration Not Saving
- Ensure you click **Save Configuration** after making changes
- Check for validation errors on individual fields
- Try refreshing the page and re-entering the value

---

**Last Updated:** 2025-12-29

**Version:** 2.0.0
