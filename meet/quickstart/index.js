import path from 'node:path';
import process from 'node:process';
import {SpacesServiceClient} from '@google-apps/meet';
import {authenticate} from '@google-cloud/local-auth';

// The scope for creating a new meeting space.
const SCOPES = ['https://www.googleapis.com/auth/meetings.space.created'];
// The path to the credentials file.
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Creates a new meeting space.
 */
async function createSpace() {
  // Authenticate with Google and get an authorized client.
  const authClient = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });

  // Create a new Meet API client.
  const meetClient = new SpacesServiceClient({
    authClient,
  });

  // Construct the request to create a new space. The request body is empty.
  const request = {};

  // Run the request to create the space.
  const response = await meetClient.createSpace(request);
  // Print the URL of the new meeting.
  console.log(`Meet URL: ${response[0].meetingUri}`);
}

await createSpace();