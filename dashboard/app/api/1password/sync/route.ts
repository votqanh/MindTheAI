import { NextResponse } from 'next/server';
import { createClient } from '@1password/sdk';

export async function POST(req: Request) {
  try {
    const { serviceAccountToken, vaultId, testOnly } = await req.json();

    if (!serviceAccountToken || !vaultId) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    // Authenticate with 1Password
    const client = await createClient({
      auth: serviceAccountToken,
      integrationName: 'MindTheAI',
      integrationVersion: '1.0.0',
    });

    // If just testing connection
    if (testOnly) {
      await client.vaults.get(vaultId, { });
      return NextResponse.json({ ok: true });
    }

    // Fetch all items from the vault
    const items = await client.items.list(vaultId);
    
    // We need to fetch details for each item to get the actual field values
    // Note: The SDK might have a more efficient way, but listAll typically returns summaries.
    // However, for sensitive data detection, we need the actual values.
    
    const credentials: { name: string; value: string }[] = [];
    
    for (const item of items) {
      try {
        const fullItem = await client.items.get(vaultId, item.id);
        if (fullItem.fields) {
          for (const field of fullItem.fields) {
            // Only care about sensitive field types like Password/Concealed lengths >= 6
            // We ignore Text fields if their ID is exactly "username" to reduce false positives
            if (field.value && field.value.length >= 6) {
              if (field.id !== 'username' && field.id !== 'title' && field.id !== 'notesPlain') {
                credentials.push({
                  name: `${fullItem.title || 'Vault item'} (${field.title || field.id})`,
                  value: field.value,
                });
              }
            }
          }
        }
      } catch (err) {
        console.error(`Failed to fetch item ${item.id}:`, err);
      }
    }

    // Return credentials to the extension
    // We include CORS headers to allow the extension to call this from any AI site
    const response = NextResponse.json(credentials);
    response.headers.set('Access-Control-Allow-Origin', '*'); 
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;

  } catch (error: any) {
    console.error('1Password Sync Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
