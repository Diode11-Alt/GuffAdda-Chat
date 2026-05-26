import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// --- Types ---
export type CommandItem = {
  id: string;
  title: string;
  icon?: ReactNode;
  shortcut?: string[];
  action: () => void;
};

export type CommandGroup = {
  id: string;
  heading: string;
  items: CommandItem[];
};

export type CommandPaletteState = {
  isOpen: boolean;
  query: string;
  commands: CommandGroup[];
};

export type CommandPaletteContextType = {
  state: CommandPaletteState;
  openPalette: () => void;
  closePalette: () => void;
  setQuery: (query: string) => void;
  registerCommands: (group: CommandGroup) => void;
  unregisterCommands: (groupId: string) => void;
  executeCommand: (commandId: string) => void;
};

// --- Context ---
const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(undefined);

// --- Provider ---
export const CommandPaletteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [commands, setCommands] = useState<CommandGroup[]>([]);

  const openPalette = useCallback(() => setIsOpen(true), []);
  const closePalette = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  const registerCommands = useCallback((group: CommandGroup) => {
    setCommands((prev) => {
      const existing = prev.find((g) => g.id === group.id);
      if (existing) return prev.map((g) => (g.id === group.id ? group : g));
      return [...prev, group];
    });
  }, []);

  const unregisterCommands = useCallback((groupId: string) => {
    setCommands((prev) => prev.filter((g) => g.id !== groupId));
  }, []);

  const executeCommand = useCallback(
    (commandId: string) => {
      for (const group of commands) {
        const item = group.items.find((i) => i.id === commandId);
        if (item) {
          item.action();
          closePalette();
          return;
        }
      }
    },
    [commands, closePalette]
  );

  return (
    <CommandPaletteContext.Provider
      value={{
        state: { isOpen, query, commands },
        openPalette,
        closePalette,
        setQuery,
        registerCommands,
        unregisterCommands,
        executeCommand,
      }}
    >
      {children}
    </CommandPaletteContext.Provider>
  );
};

// --- Hook ---
export const useCommandPalette = () => {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
  }
  return context;
};

// --- Mock Component ---
export const MockCommandPalette: React.FC = () => {
  const { state, closePalette, setQuery, executeCommand } = useCommandPalette();

  if (!state.isOpen) return null;

  const filteredGroups = state.commands
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.title.toLowerCase().includes(state.query.toLowerCase())
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        zIndex: 9999,
      }}
      onClick={closePalette}
    >
      <div
        style={{
          background: '#1e1e2e',
          color: '#cdd6f4',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '600px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #313244',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={state.query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command or search..."
          style={{
            padding: '20px',
            fontSize: '18px',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid #313244',
            color: '#cdd6f4',
            outline: 'none',
          }}
        />
        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '10px' }}>
          {filteredGroups.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6c7086' }}>
              No results found.
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.id} style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    color: '#a6adc8',
                    padding: '8px 16px',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                  }}
                >
                  {group.heading}
                </div>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => executeCommand(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: 'transparent',
                      border: 'none',
                      color: '#cdd6f4',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      textAlign: 'left',
                      fontSize: '14px',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#313244')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span>{item.title}</span>
                    {item.shortcut && (
                      <span style={{ display: 'flex', gap: '4px' }}>
                        {item.shortcut.map((key, i) => (
                          <kbd
                            key={i}
                            style={{
                              background: '#45475a',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              color: '#a6adc8',
                              fontFamily: 'monospace',
                            }}
                          >
                            {key}
                          </kbd>
                        ))}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
