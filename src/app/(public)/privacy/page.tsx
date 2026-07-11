export default function PrivacyPolicy() {
  return (
    <div className="prose prose-slate max-w-none bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Privacy Policy</h1>
      <p className="text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
      
      <h2>1. Introduction</h2>
      <p>
        Welcome to Posthi. We respect your privacy and are committed to protecting your personal data. 
        This privacy policy explains how we handle the information you provide us when you use our service.
      </p>

      <h2>2. Social Media Accounts & OAuth</h2>
      <p>
        Posthi allows you to schedule posts to various social media platforms (such as X/Twitter and Instagram) 
        using official OAuth authorization flows.
      </p>
      <ul>
        <li><strong>No Passwords:</strong> We do not ask for, collect, or store your social media passwords.</li>
        <li><strong>Encrypted Tokens:</strong> The access tokens granted to us by these platforms are stored in an encrypted format using industry-standard encryption at rest.</li>
        <li><strong>Revocation:</strong> You can revoke our access to your accounts at any time through the respective platform&apos;s account settings, or by deleting your account data within Posthi.</li>
      </ul>

      <h2>3. Data Collection and Storage</h2>
      <p>We store the following information to provide our service:</p>
      <ul>
        <li><strong>Media Files:</strong> Images and videos you upload are stored securely in our cloud storage buckets solely for the purpose of publishing them on your behalf.</li>
        <li><strong>Post Content:</strong> The text, scheduling times, and target platforms for your posts are stored in our database.</li>
        <li><strong>Account Information:</strong> Basic profile information provided by the authentication provider (such as your email address).</li>
      </ul>

      <h2>4. Data Sharing</h2>
      <p>
        We do not sell, rent, or trade your personal information. We only share the necessary data (such as your media and captions) with the third-party social media APIs you have explicitly connected, in order to fulfill your scheduled posts.
      </p>

      <h2>5. Contact Us</h2>
      <p>If you have any questions about this Privacy Policy, please contact us at support@posthi.app.</p>
    </div>
  )
}
