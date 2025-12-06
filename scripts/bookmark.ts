import { createClient } from '@supabase/supabase-js'

interface MoxfieldDeck {
  id: string
  name: string
  hasPrimer: boolean
  format: string
  visibility: string
  publicUrl: string
  publicId: string
  likeCount: number
  viewCount: number
  commentCount: number
  bookmarkCount: number
  isLegal: boolean
  createdAtUtc: string
  lastUpdatedAtUtc: string
  mainboardCount: number
  sideboardCount: number
  maybeboardCount: number
  colors: string[]
  colorIdentity: string[]
  colorPercentages: Record<string, number>
  colorIdentityPercentages: Record<string, number>
  commanders: Array<{
    id: string
    uniqueCardId: string
    name: string
    imageCardId: string
  }>
  authors: Array<{
    userName: string
    displayName: string
    badges?: string[]
  }>
  createdByUser: {
    userName: string
    displayName: string
    badges?: string[]
  }
  bracket?: number
  autoBracket?: number
  hubNames: string[]
  isShared: boolean
}

interface MoxfieldResponse {
  decks: {
    data: Array<{
      createdAtUtc: string
      deck: MoxfieldDeck
    }>
  }
}

interface FlattenedDeck {
  deck_id: string
  name: string
  format: string
  visibility: string
  moxfield_url: string
  public_id: string
  created_at_utc: string
  last_updated_at_utc: string
  bookmark_created_at_utc: string
  like_count: number
  view_count: number
  comment_count: number
  bookmark_count: number
  mainboard_count: number
  sideboard_count: number
  maybeboard_count: number
  is_legal: boolean
  bracket?: number
  auto_bracket?: number
  colors: string
  color_identity: string
  commander_names: string[]
  created_by_username: string
  created_by_display_name: string
  author_usernames: string[]
  commanders_json: any
  authors_json: any
  color_percentages_json: any
  color_identity_percentages_json: any
  hub_names_json: any
  has_primer: boolean
  is_shared: boolean
}

async function fetchMoxfieldData(): Promise<MoxfieldResponse> {
  const url = 'https://api2.moxfield.com/v1/bookmarks/xpGzQ?decksPageSize=200'
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch Moxfield data: ${response.statusText}`)
  }
  return response.json()
}

function flattenDeck(deckEntry: { createdAtUtc: string; deck: MoxfieldDeck }): FlattenedDeck {
  const { deck, createdAtUtc: bookmarkCreatedAtUtc } = deckEntry

  return {
    deck_id: deck.id,
    name: deck.name,
    format: deck.format,
    visibility: deck.visibility,
    moxfield_url: deck.publicUrl,
    public_id: deck.publicId,
    created_at_utc: deck.createdAtUtc,
    last_updated_at_utc: deck.lastUpdatedAtUtc,
    bookmark_created_at_utc: bookmarkCreatedAtUtc,
    like_count: deck.likeCount,
    view_count: deck.viewCount,
    comment_count: deck.commentCount,
    bookmark_count: deck.bookmarkCount,
    mainboard_count: deck.mainboardCount,
    sideboard_count: deck.sideboardCount,
    maybeboard_count: deck.maybeboardCount,
    is_legal: deck.isLegal,
    bracket: deck.bracket,
    auto_bracket: deck.autoBracket,
    colors: deck.colors.join(','),
    color_identity: deck.colorIdentity.join(','),
    commander_names: deck.commanders.map((c) => c.name),
    created_by_username: deck.createdByUser.userName,
    created_by_display_name: deck.createdByUser.displayName,
    author_usernames: deck.authors.map((a) => a.userName),
    commanders_json: deck.commanders,
    authors_json: deck.authors,
    color_percentages_json: deck.colorPercentages,
    color_identity_percentages_json: deck.colorIdentityPercentages,
    hub_names_json: deck.hubNames,
    has_primer: deck.hasPrimer,
    is_shared: deck.isShared,
  }
}

async function insertToSupabase(
  decks: FlattenedDeck[],
  supabaseUrl: string,
  supabaseKey: string,
  tableName: string
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseKey)

  const batchSize = 100
  for (let i = 0; i < decks.length; i += batchSize) {
    const batch = decks.slice(i, i + batchSize)

    const { data, error } = await supabase.from(tableName).insert(batch)

    if (error) {
      console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error)

      // Try individual inserts for this batch
      for (const deck of batch) {
        const { error: individualError } = await supabase.from(tableName).insert(deck)

        if (individualError) {
          console.error(`Failed to insert deck ${deck.deck_id}:`, individualError)
        }
      }
    } else {
      console.log(`✓ Inserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} decks)`)
    }
  }
}

async function main() {
  // Configuration
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://paerhoqoypdezkqhzimk.supabase.co'
  const SUPABASE_KEY = process.env.SUPABASE_KEY
  const TABLE_NAME = 'mox_meta'

  try {
    // Fetch data from Moxfield API
    console.log('Fetching data from Moxfield API...')
    const data = await fetchMoxfieldData()
    console.log(`✓ Fetched ${data.decks.data.length} decks`)

    // Flatten all decks
    console.log('Flattening deck data...')
    const flattenedDecks = data.decks.data.map(flattenDeck)
    console.log(`✓ Flattened ${flattenedDecks.length} decks`)

    // Insert into Supabase
    console.log('Inserting into Supabase...')
    await insertToSupabase(flattenedDecks, SUPABASE_URL, SUPABASE_KEY!, TABLE_NAME)
    console.log('✓ Complete!')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
