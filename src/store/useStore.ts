
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Note {
  id: string;
  title: string;
  synopsis: string;
  content: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  isDeleted?: boolean;
}

interface AppState {
  notes: Note[];
  currentNote: Note | null;
  isLoading: boolean;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  permanentlyDeleteNote: (id: string) => void;
  restoreNote: (id: string) => void;
  setCurrentNote: (note: Note | null) => void;
  setLoading: (loading: boolean) => void;
  getNoteById: (id: string) => Note | undefined;
  getActiveNotes: () => Note[];
  getDeletedNotes: () => Note[];
  getPublicNotes: () => Note[];
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      notes: [],
      currentNote: null,
      isLoading: false,
      
      addNote: (noteData) => set((state) => {
        const newNote: Note = {
          ...noteData,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
        };
        return { notes: [...state.notes, newNote] };
      }),
      
      updateNote: (id, updates) => set((state) => ({
        notes: state.notes.map(note => 
          note.id === id 
            ? { ...note, ...updates, updatedAt: new Date() }
            : note
        ),
      })),
      
      deleteNote: (id) => set((state) => ({
        notes: state.notes.map(note => 
          note.id === id 
            ? { ...note, isDeleted: true, updatedAt: new Date() }
            : note
        ),
      })),
      
      permanentlyDeleteNote: (id) => set((state) => ({
        notes: state.notes.filter(note => note.id !== id),
      })),
      
      restoreNote: (id) => set((state) => ({
        notes: state.notes.map(note => 
          note.id === id 
            ? { ...note, isDeleted: false, updatedAt: new Date() }
            : note
        ),
      })),
      
      setCurrentNote: (note) => set({ currentNote: note }),
      setLoading: (loading) => set({ isLoading: loading }),
      
      getNoteById: (id) => {
        return get().notes.find(note => note.id === id);
      },
      
      getActiveNotes: () => {
        return get().notes.filter(note => !note.isDeleted);
      },
      
      getDeletedNotes: () => {
        return get().notes.filter(note => note.isDeleted);
      },
      
      getPublicNotes: () => {
        return get().notes.filter(note => note.isPublic && !note.isDeleted);
      },
    }),
    {
      name: 'notely-storage',
      partialize: (state) => ({ notes: state.notes }),
    }
  )
);
