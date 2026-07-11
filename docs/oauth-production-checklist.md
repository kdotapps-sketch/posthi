# OAuth Production Checklist

Before users can safely connect their social media accounts on the production domain (`posthi.app`), you must update the settings in the respective developer portals.

## X (Twitter) Developer Portal

1. Go to the [X Developer Portal](https://developer.twitter.com/).
2. Select your Project & App.
3. Edit the **User authentication settings**.
4. **App URL**: `https://posthi.app`
5. **Callback URIs / Redirect URLs**:
   - `https://posthi.app/api/oauth/x/callback`
   - `http://localhost:5001/api/oauth/x/callback` (Optional, keep if you want to test locally on the same X App)
6. **Website URL**: `https://posthi.app`
7. **Terms of Service**: `https://posthi.app/terms`
8. **Privacy Policy**: `https://posthi.app/privacy`
9. Save the configuration.

## Meta (Instagram) Developer Dashboard

1. Go to the [Meta Developer Dashboard](https://developers.facebook.com/).
2. Select your App.
3. Under **Products**, go to **Instagram Settings**.
4. **Valid OAuth Redirect URIs**:
   - `https://posthi.app/api/oauth/instagram/callback`
   - `http://localhost:5001/api/oauth/instagram/callback` (Optional, keep for local testing)
5. Under **App Settings -> Basic**:
   - **App Domains**: `posthi.app`
   - **Privacy Policy URL**: `https://posthi.app/privacy`
   - **Terms of Service URL**: `https://posthi.app/terms`
   - **User Data Deletion**: `https://posthi.app/data-deletion`
6. Save the configuration.

*Note: For Meta, if you intend to allow users other than yourself (or app testers) to connect Instagram accounts, you will need to submit your app for **App Review** for the `instagram_basic` and `instagram_content_publish` permissions.*
