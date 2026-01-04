import { useNavigation } from '../../contexts/NavigationContext';
import { Button } from '../atoms/Button';
import type { Screen } from '../../types/navigation';

interface NavButtonProps {
  screen: Screen;
  label: string;
  currentScreen: Screen;
  onClick: () => void;
}

function NavButton({ screen, label, currentScreen, onClick }: NavButtonProps) {
  const isActive = screen === currentScreen;

  return (
    <Button
      variant={isActive ? 'primary' : 'secondary'}
      onClick={onClick}
      className="min-w-touch"
    >
      {label}
    </Button>
  );
}

/**
 * Header component with navigation between main screens
 */
export function Header() {
  const { currentScreen, navigateTo } = useNavigation();

  return (
    <header className="bg-gray-800 text-white px-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-touch-lg font-bold">DeadStream</h1>

        <nav className="flex gap-2">
          <NavButton
            screen="browse"
            label="Browse"
            currentScreen={currentScreen}
            onClick={() => navigateTo('browse')}
          />
          <NavButton
            screen="player"
            label="Player"
            currentScreen={currentScreen}
            onClick={() => navigateTo('player')}
          />
          <NavButton
            screen="settings"
            label="Settings"
            currentScreen={currentScreen}
            onClick={() => navigateTo('settings')}
          />
        </nav>
      </div>
    </header>
  );
}
