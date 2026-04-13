import { supabase } from './supabase';
import { Product, Sale, Client, User, Purchase, JournalEntry, CreditNote, CashSession, CashMovement, ActivityLog, CostCenter } from '../types';

// Helper to map camelCase to snake_case
const toSnakeCase = (obj: any) => {
  const newObj: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    newObj[snakeKey] = obj[key];
  }
  return newObj;
};

// Helper to map snake_case to camelCase
const fromSnakeCase = (obj: any) => {
  if (!obj) return obj;
  const newObj: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/(_\w)/g, m => m[1].toUpperCase());
    newObj[camelKey] = obj[key];
  }
  return newObj;
};

export const dataService = {
  // Users
  async getUsers(): Promise<User[]> {
    let result;
    try {
      result = await supabase.from('users').select('*');
    } catch (e) {
      result = { data: null, error: { code: 'PGRST204' } };
    }
    
    const { data, error } = result as any;
    
    if (error || !data) {
      const { data: minData, error: minError } = await supabase.from('users').select('id, name, email, role');
      if (minError) throw minError;
      return minData.map((u: any) => ({
        ...u,
        employeeName: u.name,
        avatarUrl: undefined
      })) as User[];
    }
    
    return data.map((u: any) => fromSnakeCase(u)) as User[];
  },
  async saveUser(user: User) {
    const userData = toSnakeCase(user);
    
    // Tenta salvar com todos os campos
    const { error } = await supabase.from('users').upsert(userData);

    if (error) {
      console.error('Erro ao salvar usuário no Supabase:', error);
      throw error;
    }
  },
  async checkEmailExists(email: string): Promise<boolean> {
    const { data, error } = await supabase.from('users').select('id').eq('email', email.toLowerCase()).maybeSingle();
    if (error) return false;
    return !!data;
  },
  async deleteUser(id: string) {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw error;
    return data.map(p => fromSnakeCase(p)) as Product[];
  },
  async saveProduct(product: Product) {
    const productData = toSnakeCase(product);
    console.log('Enviando produto para Supabase:', productData);
    const { error } = await supabase.from('products').upsert(productData);
    if (error) {
      console.error('Erro ao salvar produto no Supabase:', error);
      throw error;
    }
  },
  async deleteProduct(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  // Sales
  async getSales(): Promise<Sale[]> {
    const { data, error } = await supabase.from('sales').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data.map(s => fromSnakeCase(s)) as Sale[];
  },
  async saveSale(sale: Sale) {
    const saleData = toSnakeCase(sale);
    const { error } = await supabase.from('sales').upsert(saleData);
    if (error) {
      console.error('Erro ao salvar venda no Supabase:', error);
      throw error;
    }
  },
  async deleteSale(id: string) {
    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) throw error;
  },

  // Clients
  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase.from('clients').select('*');
    if (error) throw error;
    return data.map(c => fromSnakeCase(c)) as Client[];
  },
  async saveClient(client: Client) {
    const clientData = toSnakeCase(client);
    const { error } = await supabase.from('clients').upsert(clientData);
    if (error) throw error;
  },
  async deleteClient(id: string) {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  },

  // Purchases
  async getPurchases(): Promise<Purchase[]> {
    const { data, error } = await supabase.from('purchases').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data.map(p => fromSnakeCase(p)) as Purchase[];
  },
  async savePurchase(purchase: Purchase) {
    const purchaseData = toSnakeCase(purchase);
    const { error } = await supabase.from('purchases').upsert(purchaseData);
    if (error) throw error;
  },
  async deletePurchase(id: string) {
    const { error } = await supabase.from('purchases').delete().eq('id', id);
    if (error) throw error;
  },

  // Journal Entries
  async getJournalEntries(): Promise<JournalEntry[]> {
    const { data, error } = await supabase.from('journal_entries').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data.map(j => fromSnakeCase(j)) as JournalEntry[];
  },
  async saveJournalEntry(entry: JournalEntry) {
    const entryData = toSnakeCase(entry);
    const { error } = await supabase.from('journal_entries').upsert(entryData);
    if (error) throw error;
  },
  async deleteJournalEntry(id: string) {
    const { error } = await supabase.from('journal_entries').delete().eq('id', id);
    if (error) throw error;
  },

  // Credit Notes
  async getCreditNotes(): Promise<CreditNote[]> {
    const { data, error } = await supabase.from('credit_notes').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data.map(c => fromSnakeCase(c)) as CreditNote[];
  },
  async saveCreditNote(note: CreditNote) {
    const noteData = toSnakeCase(note);
    const { error } = await supabase.from('credit_notes').upsert(noteData);
    if (error) throw error;
  },

  // Cash Sessions
  async getCashSessions(): Promise<CashSession[]> {
    const { data, error } = await supabase.from('cash_sessions').select('*').order('opening_date', { ascending: false });
    if (error) throw error;
    return data.map(c => fromSnakeCase(c)) as CashSession[];
  },
  async saveCashSession(session: CashSession) {
    const sessionData = toSnakeCase(session);
    const { error } = await supabase.from('cash_sessions').upsert(sessionData);
    if (error) throw error;
  },

  // Cash Movements
  async getCashMovements(): Promise<CashMovement[]> {
    const { data, error } = await supabase.from('cash_movements').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data.map(c => fromSnakeCase(c)) as CashMovement[];
  },
  async saveCashMovement(movement: CashMovement) {
    const movementData = toSnakeCase(movement);
    const { error } = await supabase.from('cash_movements').upsert(movementData);
    if (error) throw error;
  },
  async clearPurchases() {
    const { error } = await supabase.from('purchases').delete().neq('id', '0');
    if (error) throw error;
  },

  async clearCashMovements() {
    const { error } = await supabase.from('cash_movements').delete().neq('id', '0');
    if (error) throw error;
  },
  async clearCashSessions() {
    const { error } = await supabase.from('cash_sessions').delete().neq('id', '0');
    if (error) throw error;
  },

  async clearJournalEntries() {
    const { error } = await supabase.from('journal_entries').delete().neq('id', '0');
    if (error) throw error;
  },
  // Cost Centers
  async getCostCenters(): Promise<CostCenter[]> {
    const { data, error } = await supabase.from('cost_centers').select('*');
    if (error) throw error;
    return data.map(c => fromSnakeCase(c)) as CostCenter[];
  },
  async saveCostCenter(cc: CostCenter) {
    const ccData = toSnakeCase(cc);
    const { error } = await supabase.from('cost_centers').upsert(ccData);
    if (error) throw error;
  },
  async deleteCostCenter(id: string) {
    const { error } = await supabase.from('cost_centers').delete().eq('id', id);
    if (error) throw error;
  },
  async clearCostCenters() {
    const { error } = await supabase.from('cost_centers').delete().neq('id', '0');
    if (error) throw error;
  },
  // Activity Logs
  async getActivityLogs(): Promise<ActivityLog[]> {
    const { data, error } = await supabase.from('activity_logs').select('*').order('timestamp', { ascending: false });
    if (error) throw error;
    return data.map(a => fromSnakeCase(a)) as ActivityLog[];
  },
  async saveActivityLog(log: ActivityLog) {
    const logData = toSnakeCase(log);
    const { error } = await supabase.from('activity_logs').upsert(logData);
    if (error) throw error;
  },
  async clearOldLogs(thresholdDate: string) {
    const { error } = await supabase.from('activity_logs').delete().lt('timestamp', thresholdDate);
    if (error) throw error;
  }
};
