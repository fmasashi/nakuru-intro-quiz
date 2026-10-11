// Fetch real YouTube titles for all playlist video IDs using oEmbed API
const https = require('https');
const P = require('../_paths');

// Original 97 playlist video IDs from PLR-TVlABNl3M
const PLAYLIST_IDS = [
  'Nymzuz3u7RE', 'fz_hqEdn87M', 'cAGuLsSlO3Q', '2yy9uajYF7E', 'BFV-3m_XqFM',
  'y_y154nynLQ', 'olWljQJxe_k', 'WaPNkjY3gNk', 'fgXnq8I2HWk', 'WFgqAGx6330',
  '3KYwAkMAiw0', 'K5tz4AGdBE0', '1nxZietohec', 'tayIKdDnOw8', 'eRylytyGelM',
  '9ihgjLuL1rg', 'L2eh4l0Z3qU', '6PXwuFRXGs8', 'm3lUO6Lw85k', '53-b8JvP990',
  'YhmKNyPwJ4s', '15PzGHhrlVo', 'XiEWp1NNt0U', 'g-cfAT6HuaQ', 'VJc7hCoT_Zw',
  'pdY4eLvUbnc', 'vxX7Cs21wgQ', 'LFqhjgRlDQA', 'sLHBK8pf90o', '_Xe70bzLPh4',
  'sx5mfcw_BCQ', 'lBMpjQsHnfQ', '6wLqyUPtTIM', 'SM7qCdawIfY', 'aPtVQ2Hdczg',
  'Vz10PdNRto0', 'TJVPcRcW3Z8', 'vSPgbN_QoYM', 'cDfUxfV514g', 'U5YMCw0kD2E',
  'tV-e7E3OuH8', '0OKo4iie8kU', 'Pmkp2-Fe1j8', '6Jfd0Ar3luQ', 'JFqKLwmDX1Y',
  'WlfX_d_0BiM', 'DSTs43vxfvY', 'Sg5EK3koalc', 'O9x8thg8ZHE', 'ptPU_yz3yfQ',
  'zPr2QiSwVFI', 'Cb5v-I5BLFo', 'IrQbmLbbjpw', 'lRUugzV0w9A', 'i8YIp3AUMiM',
  '3KZOQJ_1xgw', 'Xjfm-ylgq9E', '7wOgIwM4mgM', 'ZgH3RN-dg5A', 'Q5BvmJHybBY',
  'UHkfyQkhnQA', 'LcK_WTNC1DA', 'cSueFHyhyVE', 'W-Jm3-IYXO8', '74hLJEHF-AE',
  'XZPDODSgdoo', 'oNBXsTA7qXc', 'hrWRWdDdZdw', 'tioxzasntss', 'xNfXmtDOoGU',
  'FPL1Z_w7k4g', '4P1OdtYncNY', '63gXH5Rylf4', '7XeWXV_9mOY', 'vO5DYcS72Xk',
  '7-i1DQVm5Ew', 'OuJRu0g61QM', 'j45s9xvJ4Mk', 'T3lI7lh_3UA', 'sadX5FgzxyY',
  'PeZzdoP-gKk', '6SwJlZyMHqQ', 'E8eVpmmdMeY', 'KF0kZrffZBo', 'ypSeH9kz2Oo',
  'DowXn2fHDWU', '1iYy09QIJqw', 'wHThc6MPuPc', 'iynq12bYTHk', 'ikwQHfccAqg',
  '7s3eA2XeH78', 'O9XuzOv6Y3A', 'AVM65BGXWKo', 'Gcx5pL2Wydw', 'V9-HBgFbhqg',
  'Wh88hMIsm1k', '_4n1xG4YnA4'
];

// Additional verified songs (La priere, itsukinkuru, endorfin, collab)
const EXTRA_IDS = [
  'F3P_R1bZ8qU', 'bEuwswhL8Rk', '-F3NV1ls41c',
  'vxX7Cs21wgQ', 'mD0e7T7954g', 'Ff6D_67zK0A',
  'S8MJvhgjXBY', 'wX-y0NnOq1M', 'Ft1oytmXg3Y', 'OIXr7nJDHwQ',
  '5Gl7HppdYh0', 'Ol1N6shDJ94', 'fuDMqXHk5Pc', '_xyaWcdPlZI',
  'YGJScjjp5Lc', 'cWvUa-_Zayw', 'xCVBxGOCGm0', 'PVHnsNkVrcc',
  'KzT3O5-PaTw', 'ziFnkvYnkxU', 'kYvVjJ_W9jQ', 'kYQG29W5a3Y',
  'wH-9E1n_lYk', '48mx0ODWwEY',
  'efNl6gpXyJY', 'U6q9Y5PWfkI',
  'k_n7R75s5Cg'
];

// Deduplicate
const allIds = [...new Set([...PLAYLIST_IDS, ...EXTRA_IDS])];

function fetchTitle(videoId) {
  return new Promise((resolve) => {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            resolve({ id: videoId, title: json.title, status: 'ok' });
          } catch (e) {
            resolve({ id: videoId, title: null, status: 'parse_error' });
          }
        } else {
          resolve({ id: videoId, title: null, status: `http_${res.statusCode}` });
        }
      });
    }).on('error', (e) => {
      resolve({ id: videoId, title: null, status: 'network_error' });
    });
  });
}

async function main() {
  console.log(`Fetching titles for ${allIds.length} videos...`);
  const results = [];
  
  // Process in batches of 5 to avoid rate limiting
  for (let i = 0; i < allIds.length; i += 5) {
    const batch = allIds.slice(i, i + 5);
    const batchResults = await Promise.all(batch.map(fetchTitle));
    results.push(...batchResults);
    console.log(`Progress: ${results.length}/${allIds.length}`);
    // Small delay between batches
    await new Promise(r => setTimeout(r, 300));
  }
  
  const ok = results.filter(r => r.status === 'ok');
  const failed = results.filter(r => r.status !== 'ok');
  
  console.log(`\nSuccess: ${ok.length}, Failed: ${failed.length}`);
  if (failed.length > 0) {
    console.log('Failed IDs:', failed.map(f => `${f.id} (${f.status})`).join(', '));
  }
  
  // Write results
  const fs = require('fs');
  fs.writeFileSync(P.data('oembed_results.json'), JSON.stringify(results, null, 2), 'utf-8');
  console.log('Results saved to oembed_results.json');
  
  // Print all titles
  ok.forEach(r => console.log(`${r.id}: ${r.title}`));
}

main();
