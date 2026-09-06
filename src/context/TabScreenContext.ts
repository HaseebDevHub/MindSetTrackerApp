import { createContext, useContext } from 'react';

const TabScreenContext = createContext(false);

export const TabScreenProvider = TabScreenContext.Provider;

export function useIsInsideTabNavigator() {
  return useContext(TabScreenContext);
}
