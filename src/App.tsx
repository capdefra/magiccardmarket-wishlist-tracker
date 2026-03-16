import { useState } from 'react';
import { useCardData } from './hooks/useCardData';
import { PasteImport } from './components/PasteImport';
import { CardList } from './components/CardList';
import { CardDetail } from './components/CardDetail';
import { SummaryChart } from './components/SummaryChart';
import { DataSync } from './components/DataSync';
import { Winners } from './components/Winners';
import { GetStarted } from './components/GetStarted';
import './App.css';

type View = 'dashboard' | 'detail' | 'import' | 'sync' | 'guide';

export default function App() {
  const { data, addPrices, replaceData, deleteCard, clearAll, syncStatus, forceSync } = useCardData();
  const [view, setView] = useState<View>('dashboard');
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const isEmpty = Object.keys(data.cards).length === 0;
  const showGuide = view === 'guide' || (view === 'dashboard' && isEmpty);

  const handleSelectCard = (name: string) => {
    setSelectedCard(name);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedCard(null);
    setView('dashboard');
  };

  return (
    <div className="app">
      <header>
        <h1 onClick={() => { setView('dashboard'); setSelectedCard(null); }}>
          Cardmarket Wishlist Tracker
        </h1>
        <nav>
          <button
            className={view === 'dashboard' && !isEmpty ? 'active' : ''}
            onClick={() => { setView('dashboard'); setSelectedCard(null); }}
          >
            Dashboard
          </button>
          <button
            className={view === 'import' ? 'active' : ''}
            onClick={() => setView('import')}
          >
            Import
          </button>
          <button
            className={view === 'sync' ? 'active' : ''}
            onClick={() => setView('sync')}
          >
            Data
          </button>
          <button
            className={showGuide ? 'active' : ''}
            onClick={() => setView('guide')}
          >
            Guide
          </button>
        </nav>
      </header>
      <main>
        {showGuide && (
          <GetStarted
            onGoToImport={() => setView('import')}
            onGoToData={() => setView('sync')}
          />
        )}
        {view === 'dashboard' && !isEmpty && (
          <>
            <SummaryChart data={data} />
            <Winners data={data} onSelectCard={handleSelectCard} />
            <CardList
              data={data}
              onSelectCard={handleSelectCard}
              onDeleteCard={deleteCard}
            />
          </>
        )}
        {view === 'detail' && selectedCard && data.cards[selectedCard] && (
          <CardDetail
            name={selectedCard}
            card={data.cards[selectedCard]}
            onBack={handleBack}
          />
        )}
        {view === 'import' && (
          <PasteImport onImport={(prices) => { addPrices(prices); setView('dashboard'); }} />
        )}
        {view === 'sync' && (
          <DataSync data={data} onReplace={replaceData} onClear={clearAll} syncStatus={syncStatus} onForceSync={forceSync} />
        )}
      </main>
    </div>
  );
}
