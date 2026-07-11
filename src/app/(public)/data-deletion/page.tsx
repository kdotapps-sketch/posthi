export default function DataDeletion() {
  return (
    <div className="prose prose-slate max-w-none bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Data Deletion Instructions</h1>
      
      <p>
        If you wish to remove your account and all associated data from Posthi, you can submit a data deletion request.
      </p>

      <h2>What Data is Deleted?</h2>
      <p>When your deletion request is processed, the following data is permanently removed from our systems:</p>
      <ul>
        <li>Your account profile.</li>
        <li>All connected social accounts and their encrypted OAuth tokens.</li>
        <li>All your scheduled and drafted posts.</li>
        <li>All media assets you have uploaded to our storage.</li>
        <li>Your publishing logs (where legally and technically permissible).</li>
      </ul>

      <h2>How to Request Deletion</h2>
      <p>To request the deletion of your data, please follow these steps:</p>
      <ol>
        <li>Send an email to <strong>support@posthi.app</strong> from the email address associated with your Posthi account.</li>
        <li>Use the subject line: <strong>&quot;Data Deletion Request&quot;</strong>.</li>
        <li>Include a brief statement confirming you want your account and all data deleted.</li>
      </ol>
      <p>
        Our support team will process your request and confirm the deletion within 30 days.
      </p>

      <h2>Revoking Platform Access</h2>
      <p>
        In addition to requesting deletion from our platform, you can revoke Posthi&apos;s access directly from the social media platforms:
      </p>
      <ul>
        <li><strong>X (Twitter):</strong> Go to Settings and privacy &gt; Security and account access &gt; Apps and sessions &gt; Connected apps, and revoke access for Posthi.</li>
        <li><strong>Meta (Instagram):</strong> Go to your Facebook/Instagram Settings &gt; Apps and Websites, and remove Posthi.</li>
      </ul>
    </div>
  )
}
