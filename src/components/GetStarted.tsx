const BASE = import.meta.env.BASE_URL;

interface Props {
  onGoToImport: () => void;
  onGoToData: () => void;
}

export function GetStarted({ onGoToImport, onGoToData }: Props) {
  return (
    <div className="get-started">
      <h2>Get Started</h2>
      <p className="get-started-intro">
        Track your Cardmarket wishlist prices over time and find the best moment to buy.
        Follow these steps to set everything up.
      </p>

      <div className="steps">
        <div className="step">
          <span className="step-number">1</span>
          <div className="step-content">
            <h3>Download the Chrome Extension</h3>
            <p>
              The extension extracts price data from Cardmarket's Shopping Wizard
              so you can track it here.
            </p>
            <a
              href={`${BASE}cardmarket-wishlist-tracker.zip`}
              download
              className="btn-primary step-btn"
            >
              Download Extension (.zip)
            </a>
          </div>
        </div>

        <div className="step">
          <span className="step-number">2</span>
          <div className="step-content">
            <h3>Install the Extension</h3>
            <ol className="step-list">
              <li>Unzip the downloaded file</li>
              <li>Open Chrome and go to <code>chrome://extensions</code></li>
              <li>Enable <strong>Developer mode</strong> (toggle in the top-right corner)</li>
              <li>Click <strong>Load unpacked</strong> and select the unzipped folder</li>
              <li>The extension icon should appear in your toolbar</li>
            </ol>
          </div>
        </div>

        <div className="step">
          <span className="step-number">3</span>
          <div className="step-content">
            <h3>Export from Cardmarket</h3>
            <ol className="step-list">
              <li>Go to your Cardmarket wishlist</li>
              <li>Open the <strong>Shopping Wizard</strong> and run it</li>
              <li>Click the extension icon — it will copy the results as CSV to your clipboard</li>
            </ol>
          </div>
        </div>

        <div className="step">
          <span className="step-number">4</span>
          <div className="step-content">
            <h3>Import into Tracker</h3>
            <p>
              Go to the <strong>Import</strong> tab, paste the CSV data, click <strong>Parse</strong> to
              preview, then <strong>Save</strong>. Repeat this regularly to build up price history and
              spot the best time to buy.
            </p>
            <button onClick={onGoToImport} className="btn-primary step-btn">
              Go to Import
            </button>
          </div>
        </div>

        <div className="step">
          <span className="step-number">5</span>
          <div className="step-content">
            <h3>Sync Across Devices (Optional)</h3>
            <p>
              To access your data from multiple devices, you can set up GitHub Gist sync.
              You'll need a GitHub <strong>Personal Access Token</strong> with the <code>gist</code> scope.
            </p>
            <ol className="step-list">
              <li>Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)</li>
              <li>Generate a new token with the <strong>gist</strong> scope</li>
              <li>Go to the <strong>Data</strong> tab in this app and paste your token under GitHub Sync</li>
              <li>Your data will auto-sync to a private Gist whenever you import new prices</li>
            </ol>
            <button onClick={onGoToData} className="step-btn">
              Go to Data Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
