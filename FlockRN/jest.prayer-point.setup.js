// jest.prayer-point.setup.js
// First make sure Object functions work properly
if (global.Object && (!global.Object.defineProperty || typeof global.Object.defineProperty !== 'function')) {
    global.Object.defineProperty = function(obj, prop, descriptor) {
      if (obj && typeof obj === 'object') {
        obj[prop] = descriptor.value;
      }
      return obj;
    };
  }
  
  // Define global variables
  global.EntityType = {
    Prayer: 'prayer',
    PrayerPoint: 'prayerPoint',
    PrayerTopic: 'prayerTopic'
  };
  
  global.PrayerType = {
    Request: 'request',
    Praise: 'praise',
    Repentance: 'repentance'
  };
  
  global.EditMode = {
    VIEW: 'view',
    EDIT: 'edit',
    CREATE: 'create'
  };
  
  // Mock AsyncStorage
  jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  }));
  
  // Mock Firebase
  jest.mock('@/firebase/firebaseConfig', () => ({
    db: {
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          docs: [],
          empty: true,
        }),
      }),
    },
    auth: {
      currentUser: {
        uid: 'test-user-id',
        displayName: 'Test User',
        email: 'test@example.com',
      },
      onAuthStateChanged: jest.fn((callback) => {
        callback({
          uid: 'test-user-id',
          displayName: 'Test User',
          email: 'test@example.com',
        });
        return jest.fn();
      }),
    },
  }));
  
  // Global fetch mock
  global.fetch = jest.fn();