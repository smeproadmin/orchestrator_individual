'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type {
  Session,
  Message,
  Project,
  VaultItem,
  GasState,
  TabType,
  CategoryType,
  OrchestrationMode,
  CostPerfProfile,
} from '@/lib/orchestrator/types';

interface OrchestratorState {
  activeTab: TabType;
  activeCategory: CategoryType;
  activeSessionId: string | null;
  sessions: Session[];
  projects: Project[];
  vaultItems: VaultItem[];
  gas: GasState;
  orchestrationMode: OrchestrationMode;
  costPerfProfile: CostPerfProfile;
  sidebarOpen: boolean;
  isOrchestrating: boolean;
}

type Action =
  | { type: 'SET_TAB'; payload: TabType }
  | { type: 'SET_CATEGORY'; payload: CategoryType }
  | { type: 'SET_SESSION'; payload: string | null }
  | { type: 'ADD_SESSION'; payload: Session }
  | { type: 'ADD_MESSAGE'; payload: { sessionId: string; message: Message } }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'ADD_VAULT_ITEM'; payload: VaultItem }
  | { type: 'UPDATE_GAS'; payload: Partial<GasState> }
  | { type: 'SET_MODE'; payload: OrchestrationMode }
  | { type: 'SET_COST_PERF'; payload: CostPerfProfile }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_ORCHESTRATING'; payload: boolean };

const initialState: OrchestratorState = {
  activeTab: 'builder',
  activeCategory: 'for_you',
  activeSessionId: null,
  sessions: [],
  projects: [],
  vaultItems: [
    {
      id: 'snippet-1',
      name: 'As an Intelligent Orchestrator...',
      type: 'snippet',
      content: 'As an Intelligent Orchestrator, your role is to coordinate multiple AI capabilities to deliver comprehensive, compliance-aware solutions. Always verify outputs against the Universal Decoding Matrix before delivery.',
      tags: ['system', 'prompt'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  gas: {
    total: 100,
    used: 66.2,
    remaining: 33.8,
    plan: 'free',
    lowThreshold: 20,
  },
  orchestrationMode: 'auto',
  costPerfProfile: 'balanced',
  sidebarOpen: true,
  isOrchestrating: false,
};

function reducer(state: OrchestratorState, action: Action): OrchestratorState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_CATEGORY':
      return { ...state, activeCategory: action.payload };
    case 'SET_SESSION':
      return { ...state, activeSessionId: action.payload };
    case 'ADD_SESSION':
      return {
        ...state,
        sessions: [...state.sessions, action.payload],
        activeSessionId: action.payload.id,
      };
    case 'ADD_MESSAGE': {
      const sessions = state.sessions.map(s =>
        s.id === action.payload.sessionId
          ? { ...s, messages: [...s.messages, action.payload.message], updatedAt: new Date().toISOString() }
          : s
      );
      return { ...state, sessions };
    }
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'ADD_VAULT_ITEM':
      return { ...state, vaultItems: [...state.vaultItems, action.payload] };
    case 'UPDATE_GAS':
      return { ...state, gas: { ...state.gas, ...action.payload } };
    case 'SET_MODE':
      return { ...state, orchestrationMode: action.payload };
    case 'SET_COST_PERF':
      return { ...state, costPerfProfile: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_ORCHESTRATING':
      return { ...state, isOrchestrating: action.payload };
    default:
      return state;
  }
}

const OrchestratorContext = createContext<{
  state: OrchestratorState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function OrchestratorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <OrchestratorContext.Provider value={{ state, dispatch }}>
      {children}
    </OrchestratorContext.Provider>
  );
}

export function useOrchestrator() {
  const context = useContext(OrchestratorContext);
  if (!context) {
    throw new Error('useOrchestrator must be used within OrchestratorProvider');
  }
  return context;
}

export function useOrchestratorActions() {
  const { dispatch } = useOrchestrator();

  return {
    setTab: useCallback((tab: TabType) => dispatch({ type: 'SET_TAB', payload: tab }), [dispatch]),
    setCategory: useCallback((cat: CategoryType) => dispatch({ type: 'SET_CATEGORY', payload: cat }), [dispatch]),
    setSession: useCallback((id: string | null) => dispatch({ type: 'SET_SESSION', payload: id }), [dispatch]),
    addSession: useCallback((session: Session) => dispatch({ type: 'ADD_SESSION', payload: session }), [dispatch]),
    addMessage: useCallback((sessionId: string, message: Message) => dispatch({ type: 'ADD_MESSAGE', payload: { sessionId, message } }), [dispatch]),
    addProject: useCallback((project: Project) => dispatch({ type: 'ADD_PROJECT', payload: project }), [dispatch]),
    addVaultItem: useCallback((item: VaultItem) => dispatch({ type: 'ADD_VAULT_ITEM', payload: item }), [dispatch]),
    updateGas: useCallback((gas: Partial<GasState>) => dispatch({ type: 'UPDATE_GAS', payload: gas }), [dispatch]),
    setMode: useCallback((mode: OrchestrationMode) => dispatch({ type: 'SET_MODE', payload: mode }), [dispatch]),
    setCostPerf: useCallback((profile: CostPerfProfile) => dispatch({ type: 'SET_COST_PERF', payload: profile }), [dispatch]),
    toggleSidebar: useCallback(() => dispatch({ type: 'TOGGLE_SIDEBAR' }), [dispatch]),
    setOrchestrating: useCallback((v: boolean) => dispatch({ type: 'SET_ORCHESTRATING', payload: v }), [dispatch]),
  };
}
