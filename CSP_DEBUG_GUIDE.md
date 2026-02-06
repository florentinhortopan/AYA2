# CSP Error Debugging Guide

## Problem
Content Security Policy (CSP) error blocking script from Vercel:
```
Loading the script 'https://aya-2-etguo06tn-florentin-hortopans-projects.vercel.app/content/segue-pills?onload=__iframefcb202666' 
violates the following Content Security Policy directive: "script-src 'self' 'wasm-unsafe-eval' 'inline-speculation-rules' chrome-extension://..."
```

## Root Cause
This is a **Vercel infrastructure issue**, not a code issue. The error is from:
- Vercel Analytics widget
- Vercel Feedback widget
- Or Vercel's default CSP headers conflicting with their own widgets

## Debugging Steps

### 1. Check Browser Console
- Open DevTools (F12)
- Go to Console tab
- Look for CSP errors
- Check Network tab for failed script loads

### 2. Check Vercel Dashboard
1. Go to your Vercel project dashboard
2. Navigate to **Settings → Security**
3. Check **Headers** section for CSP configuration
4. Navigate to **Settings → Analytics** to see if Analytics/Feedback are enabled

### 3. Identify the Script
The error shows it's trying to load:
- URL: `https://aya-2-etguo06tn-florentin-hortopans-projects.vercel.app/content/segue-pills?onload=__iframefcb202666`
- The `?onload=__iframefcb...` parameter indicates it's an iframe/widget script

### 4. Check Network Tab
1. Open DevTools → Network tab
2. Filter by "Failed" or "Blocked"
3. Look for requests to `/content/segue-pills?onload=...`
4. Check the response headers for CSP directives

## Solutions

### Option 1: Disable Vercel Analytics/Feedback (Recommended)
1. Go to Vercel Dashboard → Project Settings → Analytics
2. Disable **Web Analytics** and **Feedback** if not needed
3. Redeploy

### Option 2: Update CSP Headers in Vercel
1. Go to Vercel Dashboard → Project Settings → Security → Headers
2. Add/modify CSP header to allow Vercel scripts:
   ```
   script-src 'self' 'wasm-unsafe-eval' 'inline-speculation-rules' https://*.vercel.app https://vercel.live;
   ```

### Option 3: Configure CSP in Next.js (if needed)
Add to `next.config.js`:
```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'wasm-unsafe-eval' 'inline-speculation-rules' https://*.vercel.app https://vercel.live;"
          }
        ]
      }
    ]
  }
}
```

### Option 4: Ignore the Error (If not affecting functionality)
- This is just a warning
- It doesn't break the pills feature
- You can filter it out in console

## Impact on Pills Feature
✅ **This error does NOT affect the pills feature**
- It's a Vercel infrastructure warning
- The pills functionality works independently
- The error is cosmetic/console noise

## Quick Test
1. Open `/content/segue-pills` page
2. Open chatbot widget
3. Try enabling pills checkbox
4. Check if pills load and display correctly
5. If pills work, the CSP error is harmless

## Next Steps
1. Check Vercel Dashboard for Analytics/Feedback settings
2. Disable if not needed
3. Or update CSP headers to allow Vercel scripts
4. Monitor console for other errors
