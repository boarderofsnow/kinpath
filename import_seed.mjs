import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://mxxkvtavdwujfbucnrnf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14eGt2dGF2ZHd1amZidWNucm5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDg1OTAyMCwiZXhwIjoyMDg2NDM1MDIwfQ.HmEKZ6SBjAlVm2PnUjP7v3bx5iTGOmEgTBrFI3eLZA4';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Parse the SQL file to extract resource data
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlContent = readFileSync(join(__dirname, 'packages/supabase/seed/002_resources.sql'), 'utf8');

// Extract resource INSERT statements and parse them
function parseResources(sql) {
  const resources = [];
  // Match each individual INSERT INTO public.resources ... VALUES (...);
  const insertRegex = /INSERT INTO public\.resources\s*\(title,\s*slug,\s*summary,\s*body,\s*resource_type,\s*source_url,\s*age_start_weeks,\s*age_end_weeks,\s*status,\s*is_premium\)\s*VALUES\s*\(\s*'([^']*(?:''[^']*)*)',\s*'([^']*(?:''[^']*)*)',\s*'([^']*(?:''[^']*)*)',\s*E'([^']*(?:''[^']*)*)',\s*'([^']*)',\s*'([^']*)',\s*(-?\d+),\s*(-?\d+),\s*'([^']*)',\s*(true|false)\s*\)/gs;

  let match;
  while ((match = insertRegex.exec(sql)) !== null) {
    resources.push({
      title: match[1].replace(/''/g, "'"),
      slug: match[2].replace(/''/g, "'"),
      summary: match[3].replace(/''/g, "'"),
      body: match[4].replace(/''/g, "'").replace(/\\n/g, '\n'),
      resource_type: match[5],
      source_url: match[6],
      age_start_weeks: parseInt(match[7]),
      age_end_weeks: parseInt(match[8]),
      status: match[9],
      is_premium: match[10] === 'true'
    });
  }
  return resources;
}

// Extract topic mappings
function parseTopicMappings(sql) {
  const mappings = [];
  const mappingRegex = /INSERT INTO public\.resource_topics.*?slug = '([^']+)'.*?'([^']+)' FROM/g;

  // Better regex for our specific format:
  // INSERT INTO public.resource_topics (resource_id, topic_id) SELECT r.id, 'topic_id' FROM public.resources r WHERE r.slug = 'slug'
  const lines = sql.split('\n');
  for (const line of lines) {
    const match = line.match(/INSERT INTO public\.resource_topics.*?SELECT r\.id,\s*'([^']+)'\s*FROM public\.resources r WHERE r\.slug = '([^']+)'/);
    if (match) {
      mappings.push({ topic_id: match[1], slug: match[2] });
    }
  }
  return mappings;
}

async function importData() {
  console.log('Parsing SQL file...');

  const resources = parseResources(sqlContent);
  console.log(`Found ${resources.length} resources to import`);

  const topicMappings = parseTopicMappings(sqlContent);
  console.log(`Found ${topicMappings.length} topic mappings`);

  if (resources.length === 0) {
    console.log('No resources parsed. Trying alternate parsing...');
    // The SQL file might use separate INSERT statements per row
    // Let's check what the file looks like
    const firstInsert = sqlContent.indexOf('INSERT INTO public.resources');
    console.log('First INSERT at position:', firstInsert);
    console.log('Sample:', sqlContent.substring(firstInsert, firstInsert + 200));
    return;
  }

  // Check if resources table exists and has data
  const { data: existingCount, error: countErr } = await supabase
    .from('resources')
    .select('id', { count: 'exact', head: true });

  if (countErr) {
    console.error('Error checking resources table:', countErr.message);
    return;
  }

  console.log(`Existing resources in database: ${existingCount?.length || 0}`);

  // Insert resources in batches of 10
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < resources.length; i += 10) {
    const batch = resources.slice(i, i + 10);
    const { data, error } = await supabase
      .from('resources')
      .upsert(batch, { onConflict: 'slug' })
      .select('id, slug');

    if (error) {
      console.error(`Batch ${Math.floor(i/10) + 1} error:`, error.message);
      // Try one by one
      for (const resource of batch) {
        const { data: single, error: singleErr } = await supabase
          .from('resources')
          .upsert(resource, { onConflict: 'slug' })
          .select('id, slug');
        if (singleErr) {
          console.error(`  Error inserting "${resource.slug}":`, singleErr.message);
          errors++;
        } else {
          inserted++;
        }
      }
    } else {
      inserted += batch.length;
      process.stdout.write(`\rInserted ${inserted}/${resources.length} resources...`);
    }
  }

  console.log(`\nResources: ${inserted} inserted, ${errors} errors`);

  // Now insert topic mappings
  console.log('\nInserting topic mappings...');
  let mappingsInserted = 0;
  let mappingErrors = 0;

  for (const mapping of topicMappings) {
    // First get the resource ID by slug
    const { data: resource, error: lookupErr } = await supabase
      .from('resources')
      .select('id')
      .eq('slug', mapping.slug)
      .single();

    if (lookupErr || !resource) {
      console.error(`  Could not find resource "${mapping.slug}":`, lookupErr?.message);
      mappingErrors++;
      continue;
    }

    const { error: insertErr } = await supabase
      .from('resource_topics')
      .upsert({ resource_id: resource.id, topic_id: mapping.topic_id },
              { onConflict: 'resource_id,topic_id' });

    if (insertErr) {
      console.error(`  Error mapping "${mapping.slug}" -> "${mapping.topic_id}":`, insertErr.message);
      mappingErrors++;
    } else {
      mappingsInserted++;
    }
  }

  console.log(`Topic mappings: ${mappingsInserted} inserted, ${mappingErrors} errors`);

  // Final count
  const { count } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true });

  console.log(`\nTotal resources now in database: ${count}`);
  console.log('Import complete!');
}

importData().catch(console.error);
