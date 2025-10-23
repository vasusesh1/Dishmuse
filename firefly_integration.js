// firefly-integration.js
// Adobe Firefly API Integration for DishMuse Plating Suggestions

import fetch from 'node-fetch';

/**
 * Adobe Firefly API Configuration
 * Get your credentials from: https://developer.adobe.com/firefly-services/
 */
const FIREFLY_CLIENT_ID = process.env.FIREFLY_CLIENT_ID;
const FIREFLY_CLIENT_SECRET = process.env.FIREFLY_CLIENT_SECRET;

// Cache the access token
let cachedAccessToken = null;
let tokenExpiresAt = 0;

/**
 * Get or refresh Adobe access token
 */
async function getAccessToken() {
  // Return cached token if still valid
  if (cachedAccessToken && Date.now() < tokenExpiresAt) {
    return cachedAccessToken;
  }

  try {
    console.log("🔑 Getting new Adobe access token...");
    
    const response = await fetch('https://ims-na1.adobelogin.com/ims/token/v3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: FIREFLY_CLIENT_ID,
        client_secret: FIREFLY_CLIENT_SECRET,
        scope: 'openid,AdobeID,firefly_api,ff_apis'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Token error:", error);
      throw new Error(`Failed to get access token: ${response.status}`);
    }

    const data = await response.json();
    cachedAccessToken = data.access_token;
    
    // Set expiration (tokens usually last 24 hours, we refresh 5 min early)
    tokenExpiresAt = Date.now() + ((data.expires_in - 300) * 1000);
    
    console.log("✅ Access token obtained");
    return cachedAccessToken;
  } catch (error) {
    console.error("❌ Failed to get access token:", error);
    throw error;
  }
}

/**
 * Generate plating suggestion images using Adobe Firefly
 * @param {string} platingText - The text description of plating ideas
 * @param {string} dishName - Name of the dish for context
 * @returns {Promise<Array>} Array of image URLs
 */
export async function generatePlatingImages(platingText, dishName = "") {
  if (!FIREFLY_CLIENT_ID || !FIREFLY_CLIENT_SECRET) {
    console.error("⚠️ Adobe Firefly credentials not configured");
    console.error("Please set FIREFLY_CLIENT_ID and FIREFLY_CLIENT_SECRET in .env");
    return [];
  }

  try {
    // Get access token first
    const accessToken = await getAccessToken();
    
    // Parse the plating text to extract individual ideas
    const ideas = parsePlatingIdeas(platingText);
    
    // Generate 3-4 images (one per major plating idea)
    const imagePromises = ideas.slice(0, 4).map((idea, index) => 
      generateSingleImage(idea, dishName, index, accessToken)
    );

    const results = await Promise.all(imagePromises);
    
    // Filter out any failed generations
    return results.filter(img => img && img.url);
  } catch (error) {
    console.error("❌ Firefly image generation error:", error);
    return [];
  }
}

/**
 * Parse plating text into individual visual ideas
 */
function parsePlatingIdeas(platingText) {
  const ideas = [];
  
  // Look for section headers like "**For the Pav Bhaji:**" or "**Table Setting:**"
  const sections = platingText.split(/\*\*([^*]+):\*\*/g);
  
  for (let i = 1; i < sections.length; i += 2) {
    const sectionName = sections[i].trim();
    const sectionContent = sections[i + 1];
    
    if (sectionContent) {
      // Extract bullet points
      const bullets = sectionContent
        .split(/\n/)
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(Boolean);
      
      if (bullets.length > 0) {
        ideas.push({
          section: sectionName,
          description: bullets.join('. '),
          bullets: bullets
        });
      }
    }
  }
  
  // If no structured sections found, treat entire text as one idea
  if (ideas.length === 0) {
    ideas.push({
      section: "Plating",
      description: platingText.replace(/[*\n]/g, ' ').trim(),
      bullets: []
    });
  }
  
  return ideas;
}

/**
 * Generate a single image using Adobe Firefly API
 */
async function generateSingleImage(idea, dishName, index, accessToken) {
  try {
    // Construct a detailed prompt for Firefly
    const prompt = buildFireflyPrompt(idea, dishName);
    
    console.log(`🎨 Generating image ${index + 1}: ${idea.section}`);
    
    // Adobe Firefly Text-to-Image API v3
    const response = await fetch('https://firefly-api.adobe.io/v3/images/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': FIREFLY_CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        prompt: prompt,
        contentClass: "photo", // Options: photo, art, graphic
        style: {
          presets: ["food_photography", "vibrant", "warm"],
        },
        size: {
          width: 1024,
          height: 1024
        },
        n: 1, // Number of variations
        seed: Math.floor(Math.random() * 1000000) // Random seed for variety
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Firefly API error (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json();
    
    if (data.outputs && data.outputs.length > 0) {
      return {
        url: data.outputs[0].image.url,
        section: idea.section,
        description: idea.description,
        index: index
      };
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error generating image ${index}:`, error.message);
    return null;
  }
}

/**
 * Build a detailed Firefly-optimized prompt from plating idea
 */
function buildFireflyPrompt(idea, dishName) {
  const basePrompt = [
    "Professional food photography,",
    "elegant restaurant plating,",
    dishName ? `${dishName},` : "",
    "top-down view,",
    "natural lighting,"
  ].filter(Boolean).join(" ");
  
  // Add specific plating details
  const details = idea.description
    .replace(/\s+/g, ' ')
    .substring(0, 200); // Limit prompt length
  
  return `${basePrompt} ${details}. High-quality, appetizing, commercial food photography style, warm tones, shallow depth of field, garnished beautifully`;
}

/**
 * Alternative: Generate images using Firefly's simpler endpoint
 * Use this if the v3 endpoint doesn't work
 */
export async function generatePlatingImagesSimple(platingText, dishName = "") {
  if (!FIREFLY_CLIENT_ID || !FIREFLY_CLIENT_SECRET) {
    console.error("⚠️ Adobe Firefly credentials not configured");
    return [];
  }

  try {
    // Get access token
    const accessToken = await getAccessToken();
    
    // Create 3-4 simple prompts
    const prompts = [
      `Professional food photography of ${dishName} plating, elegant presentation, warm lighting`,
      `Top-down view of ${dishName} on elegant plate, restaurant quality, garnished`,
      `${dishName} served on decorative platter, sophisticated table setting, soft lighting`,
      `Close-up of ${dishName} presentation, artistic plating, food styling`
    ];

    const imagePromises = prompts.map(async (prompt, index) => {
      try {
        const response = await fetch('https://firefly-api.adobe.io/v2/images/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': FIREFLY_CLIENT_ID,
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            prompt: prompt,
            n: 1,
            size: "1024x1024"
          })
        });

        if (response.ok) {
          const data = await response.json();
          return {
            url: data.outputs?.[0]?.image?.url || null,
            index: index
          };
        }
      } catch (err) {
        console.error(`Image ${index} failed:`, err.message);
      }
      return null;
    });

    const results = await Promise.all(imagePromises);
    return results.filter(img => img && img.url);
  } catch (error) {
    console.error("❌ Firefly simple generation error:", error);
    return [];
  }
}

export default { generatePlatingImages, generatePlatingImagesSimple };