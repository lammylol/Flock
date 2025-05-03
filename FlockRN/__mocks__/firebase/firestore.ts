// __mocks__/firebase/firestore.ts
export const initializeFirestore = jest.fn(() => ({
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({
        exists: true,
        data: () => ({ id: 'test-doc' })
      })),
      set: jest.fn(() => Promise.resolve()),
      update: jest.fn(() => Promise.resolve())
    })),
    where: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({
        docs: [
          { id: 'doc1', data: () => ({ name: 'Test Doc 1' }) },
          { id: 'doc2', data: () => ({ name: 'Test Doc 2' }) }
        ]
      }))
    }))
  }))
}));

export const collection = jest.fn(() => ({
  doc: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve({
      exists: true,
      data: () => ({ id: 'test-doc' })
    })),
    set: jest.fn(() => Promise.resolve()),
    update: jest.fn(() => Promise.resolve())
  })),
  where: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve({
      docs: [
        { id: 'doc1', data: () => ({ name: 'Test Doc 1' }) },
        { id: 'doc2', data: () => ({ name: 'Test Doc 2' }) }
      ]
    }))
  }))
}));

export const doc = jest.fn(() => ({
  get: jest.fn(() => Promise.resolve({
    exists: true,
    data: () => ({ id: 'test-doc' })
  })),
  set: jest.fn(() => Promise.resolve()),
  update: jest.fn(() => Promise.resolve())
}));

export const getDoc = jest.fn(() => 
  Promise.resolve({
    exists: jest.fn(() => true),
    data: jest.fn(() => ({ 
      id: 'test-doc-id',
      name: 'Test Document'
    }))
  })
);

export const getDocs = jest.fn(() => 
  Promise.resolve({
    docs: [
      {
        id: 'doc1',
        data: () => ({ name: 'Doc 1' })
      },
      {
        id: 'doc2',
        data: () => ({ name: 'Doc 2' })
      }
    ]
  })
);

export const setDoc = jest.fn(() => Promise.resolve());
export const updateDoc = jest.fn(() => Promise.resolve());
export const deleteDoc = jest.fn(() => Promise.resolve());
export const addDoc = jest.fn(() => Promise.resolve({ id: 'new-doc-id' }));