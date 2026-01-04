/**
 * Navigation types for screen-based routing
 */

export type Screen = 'browse' | 'player' | 'settings';

export interface NavigationState {
  currentScreen: Screen;
  history: Screen[];
}
