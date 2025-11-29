/**
 * Test script to fetch social share data and generate video
 * 
 * Usage:
 *   node test-social-share.js <customer_id>
 * 
 * Example:
 *   node test-social-share.js 8885250982135
 */

const https = require('https');

const API_URL = 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws';

/**
 * Fetch customer social share data from API
 */
async function fetchSocialShareData(customerId) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      customer_id: customerId
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = https.request(`${API_URL}/get_social_share_data`, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Fetch milestone data to get King/Queen color code
 */
async function fetchMilestones(gender) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      gender: gender
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = https.request(`${API_URL}/get_milestones`, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Main function
 */
async function main() {
  const customerId = process.argv[2];

  if (!customerId) {
    console.error('❌ Error: Please provide a customer_id');
    console.log('Usage: node test-social-share.js <customer_id>');
    console.log('Example: node test-social-share.js 8885250982135');
    process.exit(1);
  }

  console.log(`\n🔍 Fetching social share data for customer: ${customerId}\n`);

  try {
    // Fetch social share data
    const socialData = await fetchSocialShareData(customerId);

    if (!socialData.success) {
      console.error('❌ Error:', socialData.error || 'Failed to fetch data');
      process.exit(1);
    }

    console.log('✅ Social share data fetched successfully!\n');
    console.log('📊 Customer Data:');
    console.log(`   Name: ${socialData.firstname}`);
    console.log(`   Level: ${socialData.level} - ${socialData.current_title} ${socialData.current_emoji}`);
    console.log(`   Days in focus: ${socialData.days}`);
    console.log(`   Rank: Top ${socialData.rank}%`);
    console.log(`   Next level: ${socialData.next_title} ${socialData.next_emoji} (in ${socialData.days_to_next} days)`);
    console.log(`   Gender: ${socialData.gender}`);
    console.log(`   Current color: #${socialData.color_code}`);
    console.log(`   Next color: #${socialData.next_color_code}`);

    // Fetch milestones to get King/Queen color
    console.log('\n🎯 Fetching milestones data...\n');
    const milestonesData = await fetchMilestones(socialData.gender);
    
    let kingColorCode = 'ffd700'; // Default gold
    if (milestonesData.success && milestonesData.milestones) {
      const kingMilestone = milestonesData.milestones.find(m => m.level === 10);
      if (kingMilestone && kingMilestone.color_code) {
        kingColorCode = kingMilestone.color_code;
      }
    }
    console.log(`   King/Queen color: #${kingColorCode}`);

    // Build Remotion props
    const remotionProps = {
      firstname: socialData.firstname,
      rank: socialData.rank,
      currentTitle: socialData.current_title,
      currentEmoji: socialData.current_emoji,
      days: socialData.days,
      currentColorCode: socialData.color_code,
      nextTitle: socialData.next_title,
      nextEmoji: socialData.next_emoji,
      daysToNext: socialData.days_to_next,
      nextColorCode: socialData.next_color_code,
      description: socialData.description || 'Your journey to transformation begins now.',
      gender: socialData.gender,
      kingColorCode: kingColorCode,
    };

    console.log('\n🎬 Remotion Props (for video generation):\n');
    console.log(JSON.stringify(remotionProps, null, 2));

    console.log('\n📝 To test the video locally, run:');
    console.log(`   npm run dev\n`);
    console.log('Then select "SocialShareReel" composition and paste the props above.\n');

    console.log('🎥 To render the video, run:');
    console.log(`   npx remotion render SocialShareReel output.mp4 --props='${JSON.stringify(remotionProps)}'\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();








