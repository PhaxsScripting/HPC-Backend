# HPC-Backend

HPC Blacklist API - Vercel Serverless Function for checking and blocking blacklisted user IDs.

## Overview

This Vercel serverless function checks if a user ID is blacklisted and returns appropriate responses to kick or allow users. Designed for game servers or applications that need to block specific users.

## Features

- ✅ Checks user IDs against a blacklist
- ✅ Returns styled messages for UI display
- ✅ Provides clear action instructions (KICK_USER/ALLOW_ENTRY)
- ✅ Easy to configure blacklist
- ✅ Vercel serverless deployment ready
- ✅ Local development support

## API Endpoint

```
GET /api/check/[userId]
```

### Parameters
- `userId` (required): The user ID to check

### Response Format

#### Blacklisted User:
```json
{
  "blacklisted": true,
  "message": "YOU'RE BLACKLISTED, IDK WHY YOU THOUGHT YOU COULD COME IN HERE",
  "styledMessage": "<span style='color: white; background-color: red; padding: 4px 8px; border-radius: 4px; font-weight: bold;'>YOU'RE BLACKLISTED, IDK WHY YOU THOUGHT YOU COULD COME IN HERE</span>",
  "action": "KICK_USER",
  "kickReason": "User ID is blacklisted"
}
```

#### Non-Blacklisted User:
```json
{
  "blacklisted": false,
  "message": "Access granted",
  "styledMessage": "<span style='color: black; background-color: #00ff00; padding: 2px 6px; border-radius: 3px;'>Access granted</span>",
  "action": "ALLOW_ENTRY"
}
```

#### Error Responses:
```json
{
  "error": "Missing UserId parameter",
  "styledMessage": "<span style='color: white; background-color: red; padding: 2px 6px; border-radius: 3px;'>ERROR: Missing UserID</span>"
}
```

## File Structure

```
HPC-Backend-main/
├── api/
│   └── check/
│       └── [userId].js     # Main API handler
├── vercel.json             # Vercel configuration
├── package.json            # Dependencies & scripts
└── README.md               # This file
```

## Setup & Installation

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
4. Test the API:
   ```bash
   curl http://localhost:3000/api/check/12345678
   ```

### Vercel Deployment

1. Push this repository to GitHub
2. Import project in Vercel dashboard
3. Vercel will automatically detect and deploy the serverless function
4. Your API will be available at `https://your-project.vercel.app/api/check/[userId]`

## Configuration

### Managing the Blacklist

Edit `api/check/[userId].js` to modify the blacklist:

```javascript
const BLACKLIST = [
  "12345678",   // Add/remove user IDs as needed
  "87654321",
  "11111111"
];
```

### Environment Variables (Recommended for Production)

For better security, move the blacklist to environment variables:

1. In Vercel dashboard, go to Settings → Environment Variables
2. Add variable: `BLACKLIST_IDS` with value `12345678,87654321,11111111`
3. Update the code to use:
   ```javascript
   const BLACKLIST = process.env.BLACKLIST_IDS ? 
     process.env.BLACKLIST_IDS.split(',').map(id => id.trim()) : 
     [];
   ```

## Usage Examples

### Game Integration (Pseudocode):
```lua
-- Roblox/Lua example
local function checkUserId(userId)
    local response = game:GetService("HttpService"):GetAsync(
        "https://your-app.vercel.app/api/check/" .. userId
    )
    local data = game:GetService("HttpService"):JSONDecode(response)
    
    -- Display message to user
    game.StarterGui:SetCore("ChatMakeSystemMessage", {
        Text = data.message,
        Color = Color3.fromRGB(255, 0, 0) -- Red for blocked
    })
    
    -- Take action
    if data.blacklisted then
        game.Players.LocalPlayer:Kick(data.kickReason or "Blacklisted user")
    end
end
```

### Web Integration (JavaScript):
```javascript
async function handleUserJoin(userId) {
    try {
        const response = await fetch(`/api/check/${userId}`);
        const data = await response.json();
        
        // Show styled message in UI
        const statusDiv = document.getElementById('join-status');
        statusDiv.innerHTML = data.styledMessage;
        statusDiv.style.padding = '8px';
        statusDiv.style.borderRadius = '4px';
        statusDef.style.marginTop = '10px';
        
        // Handle blacklisted users
        if (data.blacklisted) {
            // Redirect, show modal, or prevent entry
            showAccessDeniedModal(data.kickReason);
            return false;
        }
        
        // Allow entry
        return true;
    } catch (error) {
        console.error('Error checking user ID:', error);
        // Fail safe - allow entry on error (or deny based on your policy)
        return true;
    }
}
```

## Testing

### Test with cURL:
```bash
# Test blacklisted user
curl http://localhost:3000/api/check/12345678

# Test non-blacklisted user  
curl http://localhost:3000/api/check/99999999

# Test missing user ID
curl http://localhost:3000/api/check/

# Test invalid user ID
curl http://localhost:3000/api/check/abc
```

## Vercel Configuration (`vercel.json`)

```json
{
  "functions": {
    "api/check/[userId].js": {
      "runtime": "nodejs18.x"
    }
  }
}
```

## Environment Variables

For production deployment, consider setting:
- `BLACKLIST_IDS`: Comma-separated list of blacklisted user IDs
- `NODE_ENV`: Set to `production` for Vercel deployments

## Security Considerations

1. **Rate Limiting**: Consider implementing rate limiting to prevent abuse
2. **Input Validation**: The API validates that userId is provided and is numeric
3. **Environment Secrets**: Store blacklist in environment variables rather than code
4. **CORS**: Configure Vercel CORS settings if calling from different domains

## Customization

### Changing Response Messages
Edit the response messages in `api/check/[userId].js`:
```javascript
return res.status(200).json({
  blacklisted: isBlacklisted,
  message: isBlacklisted
    ? "YOU'RE BLACKLISTED, IDK WHY YOU THOUGHT YOU COULD COME IN HERE"
    : "Access granted",
  // ... rest of response
});
```

### Styling
Modify the `styledMessage` HTML to match your application's CSS theme:
```javascript
styledMessage: isBlacklisted
  ? "<span style='color: #ffffff; background-color: #ff0000; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-family: Arial, sans-serif;'>YOU'RE BLACKLISTED, IDK WHY YOU THOUGHT YOU COULD COME IN HERE</span>"
  : "<span style='color: #000000; background-color: #00ff00; padding: 2px 6px; border-radius: 3px; font-family: Arial, sans-serif;'>Access granted</span>"
```

## Troubleshooting

### Common Issues

1. **"Cannot read property 'query' of undefined"**
   - Ensure you're accessing `req.query` correctly (Vercel provides this)
   - Check that the route is properly defined as `[userId].js`

2. **404 Not Found**
   - Verify your Vercel deployment completed successfully
   - Check that the file is in `api/check/[userId].js`
   - Ensure `vercel.json` is correctly configured

3. **Empty Blacklist**
   - Confirm the `BLACKLIST` array contains values
   - Check environment variable configuration if used

4. **CORS Issues**
   - Configure Vercel project settings for appropriate CORS headers
   - Or add CORS headers directly in the API response

## License

This project is open source and available for modification and use.

## Support

For issues or questions, please open an issue in the repository or contact the maintainer.# test
