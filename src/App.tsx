import { useDatabase } from './hooks/useDatabase';
import { useNavigation } from './contexts/NavigationContext';
import { DatabaseSetup } from './components/screens/DatabaseSetup';
import { MainLayout } from './components/organisms/MainLayout';
import { BrowseScreen } from './components/screens/BrowseScreen';
import { PlayerScreen } from './components/screens/PlayerScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';

function App() {
  const { isReady } = useDatabase();
  const { currentScreen } = useNavigation();

  // Show database setup screen if database is empty
  if (!isReady) {
    return <DatabaseSetup />;
  }

  // Render the appropriate screen based on navigation state
  const renderScreen = () => {
    switch (currentScreen) {
      case 'browse':
        return <BrowseScreen />;
      case 'player':
        return <PlayerScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <BrowseScreen />;
    }
  };

  return (
    <MainLayout>
      {renderScreen()}
    </MainLayout>
  );
}

export default App
