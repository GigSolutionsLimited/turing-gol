import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ChallengeService } from './services/challengeService'

// Expose cache clearing utilities for debugging in console
if (typeof window !== 'undefined') {
  window.clearChallengeCache = (exerciseNumber) => {
    if (exerciseNumber) {
      ChallengeService.clearChallengeFromStorage(exerciseNumber);
      console.log(`✅ Cleared cache for challenge ${exerciseNumber}. Reload the page to load fresh data.`);
    } else {
      const count = ChallengeService.clearAllChallengeCaches();
      console.log(`✅ Cleared ${count} challenge caches. Reload the page to load fresh data.`);
    }
  };

  console.log('🔧 Debug helper available: clearChallengeCache(exerciseNumber) or clearChallengeCache() to clear all');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
