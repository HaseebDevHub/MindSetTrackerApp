/* eslint-env jest */

jest.mock('react-native-mmkv', () => {
  const stores = new Map();

  return {
    createMMKV: ({ id = 'mmkv.default' } = {}) => {
      if (!stores.has(id)) stores.set(id, new Map());
      const values = stores.get(id);

      return {
        contains: key => values.has(key),
        getBoolean: key => {
          const value = values.get(key);
          return typeof value === 'boolean' ? value : undefined;
        },
        getNumber: key => {
          const value = values.get(key);
          return typeof value === 'number' ? value : undefined;
        },
        getString: key => {
          const value = values.get(key);
          return typeof value === 'string' ? value : undefined;
        },
        remove: key => values.delete(key),
        set: (key, value) => values.set(key, value),
      };
    },
  };
});
