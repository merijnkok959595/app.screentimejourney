import {renderMediaOnLambda, getRenderProgress} from '@remotion/lambda/client';

/**
 * Node.js Bridge Lambda to call Remotion Lambda properly
 * This bridges Python Lambda → Node.js Bridge → Remotion Render Lambda
 */
export const handler = async (event) => {
  console.log('🎬 Remotion Bridge Lambda called with:', JSON.stringify(event, null, 2));
  
  try {
    // Parse input (can come from direct invoke or API Gateway)
    let body;
    if (typeof event.body === 'string') {
      body = JSON.parse(event.body);
    } else {
      body = event;
    }
    
    console.log('📦 Parsed body:', JSON.stringify(body, null, 2));
    
    // Extract parameters
    const {
      firstname = 'Champion',
      currentTitle = 'Ground Zero',
      currentEmoji = '🪨',
      days = 0,
      rank = 100,
      nextTitle = 'Fighter',
      nextEmoji = '🥊',
      colorCode = '2e2e2e',
      nextColorCode = '5b1b1b',
      gender = 'male',
      customer_id = 'guest',
      daysToNext = 7,
      description = 'Your journey to transformation begins now.',
      kingColorCode = 'ffd700'
    } = body;
    
    // Remotion Lambda configuration
    const REMOTION_FUNCTION = process.env.REMOTION_LAMBDA_FUNCTION || 'remotion-render-4-0-373-mem2048mb-disk2048mb-120sec';
    const REMOTION_SITE_URL = process.env.REMOTION_SITE_URL || 'https://remotionlambda-eunorth1-04wuwe9kfm.s3.eu-north-1.amazonaws.com/sites/milestone-reels-stj/index.html';
    const REMOTION_REGION = process.env.REMOTION_REGION || 'eu-north-1';
    
    console.log(`🚀 Rendering video with Remotion Lambda: ${REMOTION_FUNCTION}`);
    console.log(`📍 Region: ${REMOTION_REGION}`);
    console.log(`🌐 Site URL: ${REMOTION_SITE_URL}`);
    
    // Generate filename
    const videoFileName = `milestone_${customer_id}_${Date.now()}.mp4`;
    
    // Call Remotion Lambda using official SDK
    const result = await renderMediaOnLambda({
      region: REMOTION_REGION,
      functionName: REMOTION_FUNCTION,
      serveUrl: REMOTION_SITE_URL,
      composition: 'SocialShareReel',
      inputProps: {
        firstname,
        rank,
        currentTitle,
        currentEmoji,
        days,
        currentColorCode: colorCode,
        nextTitle,
        nextEmoji,
        daysToNext,
        nextColorCode,
        description,
        gender,
        kingColorCode
      },
      codec: 'h264',
      imageFormat: 'jpeg',
      maxRetries: 1,
      privacy: 'public',
      outName: videoFileName,
      timeoutInMilliseconds: 120000, // 2 minutes
      downloadBehavior: {
        type: 'download',
        fileName: `milestone_video_${firstname}.mp4`
      }
    });
    
    console.log('✅ Remotion render started:', JSON.stringify(result, null, 2));
    console.log(`⏳ Waiting for render to complete...`);
    
    // Wait for render to complete by polling progress
    let renderProgress;
    let attempts = 0;
    const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      renderProgress = await getRenderProgress({
        renderId: result.renderId,
        bucketName: result.bucketName,
        functionName: REMOTION_FUNCTION,
        region: REMOTION_REGION
      });
      
      console.log(`📊 Render progress: ${renderProgress.overallProgress * 100}% (${renderProgress.done ? 'DONE' : 'RENDERING'})`);
      
      if (renderProgress.done) {
        break;
      }
      
      attempts++;
    }
    
    if (!renderProgress || !renderProgress.done) {
      throw new Error('Render timeout: Video did not complete in time');
    }
    
    if (renderProgress.fatalErrorEncountered) {
      throw new Error(`Render failed: ${renderProgress.errors?.join(', ') || 'Unknown error'}`);
    }
    
    // Get the actual output file URL from the completed render
    const videoUrl = renderProgress.outputFile;
    
    console.log(`✅ Render complete! Video URL: ${videoUrl}`);
    
    // Return video URL
    const response = {
      success: true,
      video_url: videoUrl,
      renderId: result.renderId,
      bucketName: result.bucketName,
      message: 'Video generated successfully'
    };
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('❌ Error rendering video:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      })
    };
  }
};

