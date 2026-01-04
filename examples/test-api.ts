import { searchShows, getMetadata, extractAudioFiles } from '../src/services/archiveApi';

async function testAPI() {
  console.log('=== Archive.org API Test ===\n');
  
  // Test 1: Search by date
  console.log('Test 1: Search shows on 1977-05-08');
  const shows = await searchShows({ date: '1977-05-08' });
  console.log(`Found ${shows.length} shows`);
  console.log('First show:', shows[0].identifier);
  console.log('');
  
  // Test 2: Get metadata
  console.log('Test 2: Fetch metadata for Cornell 77');
  const metadata = await getMetadata(shows[0].identifier);
  console.log('Title:', metadata.metadata.title);
  console.log('Venue:', metadata.metadata.venue);
  console.log('Files:', metadata.files.length);
  console.log('');
  
  // Test 3: Extract audio
  console.log('Test 3: Extract audio tracks');
  const tracks = extractAudioFiles(metadata);
  console.log(`Found ${tracks.length} audio tracks`);
  console.log('First track:', tracks[0].title);
  console.log('Stream URL:', tracks[0].url);
  console.log('');
  
  console.log('[SUCCESS] All tests passed!');
}

testAPI().catch(err => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});