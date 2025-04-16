import create from 'zustand';
import { useFirestore } from '@/firebase/useFirestore';

const usePrayerStore = create((set) => ({
  prayers: {}, // Cached prayers { [id]: { ...prayerData } }
  loading: false, // Loading state

  // Fetch all prayers
  fetchAllPrayers: async () => {
    set({ loading: true });
    try {
      const { flockDb } = useFirestore();
      const querySnapshot = await flockDb.collection('prayers').get(); // Use react-native-firebase Firestore API
      const prayers = {};
      querySnapshot.forEach((doc) => {
        prayers[doc.id] = { id: doc.id, ...doc.data() };
      });

      set({ prayers, loading: false });
    } catch (error) {
      console.error('Error fetching prayers:', error);
      set({ loading: false });
    }
  },

  // Fetch a single prayer if it's not already cached
  fetchPrayerById: async (id) => {
    set((state) => ({ ...state, loading: true }));

    try {
      const { flockDb } = useFirestore();
      const existingPrayer = usePrayerStore.getState().prayers[id];
      if (existingPrayer) return; // Don't refetch if already in store

      const docRef = flockDb.collection('prayers').doc(id); // Use react-native-firebase Firestore API
      const docSnap = await docRef.get(); // Get the document snapshot

      if (docSnap.exists) {
        set((state) => ({
          prayers: { ...state.prayers, [id]: { id, ...docSnap.data() } },
          loading: false,
        }));
      } else {
        console.warn('No such prayer!');
        set({ loading: false });
      }
    } catch (error) {
      console.error('Error fetching prayer:', error);
      set({ loading: false });
    }
  },
}));

export default usePrayerStore;
