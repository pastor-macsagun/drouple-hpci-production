/**
 * Mock Expo SQLite
 */

interface MockDatabase {
  transaction: (callback: (tx: MockTransaction) => void) => Promise<void>;
  exec: (
    queries: { sql: string; args?: any[] }[],
    readOnly?: boolean
  ) => Promise<any>;
  close: () => void;
}

interface MockTransaction {
  executeSql: (
    sql: string,
    args?: any[],
    success?: (tx: MockTransaction, result: any) => void,
    error?: (tx: MockTransaction, error: any) => void
  ) => void;
}

// In-memory mock database
const mockTables: { [tableName: string]: any[] } = {};

const createMockTransaction = (): MockTransaction => ({
  executeSql: jest.fn((sql, args = [], success, error) => {
    try {
      // Simple SQL parser for common operations
      const result = {
        rows: { _array: [], length: 0 },
        insertId: 1,
        rowsAffected: 0,
      };

      if (sql.toLowerCase().includes('create table')) {
        const match = sql.match(/create table (\w+)/i);
        if (match) {
          mockTables[match[1]] = [];
        }
      } else if (sql.toLowerCase().includes('insert into')) {
        const match = sql.match(/insert into (\w+)/i);
        if (match) {
          const tableName = match[1];
          if (!mockTables[tableName]) mockTables[tableName] = [];
          const newRow = { id: mockTables[tableName].length + 1, ...args };
          mockTables[tableName].push(newRow);
          result.insertId = newRow.id;
          result.rowsAffected = 1;
        }
      } else if (sql.toLowerCase().includes('select')) {
        const match = sql.match(/from (\w+)/i);
        if (match && mockTables[match[1]]) {
          result.rows._array = mockTables[match[1]];
          result.rows.length = result.rows._array.length;
        }
      }

      if (success) success(createMockTransaction(), result);
    } catch (err) {
      if (error) error(createMockTransaction(), err);
    }
  }),
});

const createMockDatabase = (): MockDatabase => ({
  transaction: jest.fn(callback => {
    return new Promise(resolve => {
      callback(createMockTransaction());
      resolve();
    });
  }),
  exec: jest.fn(() => Promise.resolve([])),
  close: jest.fn(),
});

export const openDatabase = jest.fn(() => createMockDatabase());

export const openDatabaseAsync = jest.fn(() =>
  Promise.resolve(createMockDatabase())
);

// For testing purposes
export const clearMockTables = () => {
  Object.keys(mockTables).forEach(key => delete mockTables[key]);
};

export const getMockTables = () => ({ ...mockTables });
