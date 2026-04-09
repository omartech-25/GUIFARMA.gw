import { supabase } from './supabase';
import { Product, Sale, Client, User, Purchase, JournalEntry, CreditNote, CashSession, CashMovement, ActivityLog } from '../types';

export const dataService = {
  // Users
  async getUsers(): Promise<User[]> {
    let result;
    try {
      result = await supabase.from('users').select('id, name, email, role, employee_name, avatar_url');
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
    
    return data.map((u: any) => ({
      ...u,
      employeeName: u.employee_name || u.name,
      avatarUrl: u.avatar_url
    })) as User[];
  },
  async saveUser(user: User) {
    const userData: any = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      status: user.status || 'Ativo',
      permissions: user.permissions,
      employee_name: user.employeeName,
      avatar_url: user.avatarUrl
    };

    if (user.password) userData.password = user.password;
    
    // Tenta salvar com todos os campos
    const { error } = await supabase.from('users').upsert(userData);

    if (error) {
      // Se o erro for de coluna inexistente (PGRST204), tenta remover os campos problemáticos um a um
      if (error.code === 'PGRST204') {
        const fallbackData = { ...userData };
        
        // Se o erro mencionar especificamente uma coluna, poderíamos ser mais precisos, 
        // mas aqui tentamos o conjunto mínimo garantido
        delete fallbackData.permissions;
        delete fallbackData.status;
        delete fallbackData.employee_name;
        delete fallbackData.avatar_url;
        
        const { error: retryError } = await supabase.from('users').upsert(fallbackData);
        if (retryError) throw retryError;
      } else {
        console.error('Erro ao salvar usuário no Supabase:', error);
        throw error;
      }
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
    return data as Product[];
  },
  async saveProduct(product: Product) {
    const { error } = await supabase.from('products').upsert(product);
    if (error) throw error;
  },
  async deleteProduct(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  // Sales
  async getSales(): Promise<Sale[]> {
    const { data, error } = await supabase.from('sales').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data as Sale[];
  },
  async saveSale(sale: Sale) {
    const { error } = await supabase.from('sales').upsert(sale);
    if (error) throw error;
  },
  async deleteSale(id: string) {
    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) throw error;
  },

  // Clients
  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase.from('clients').select('*');
    if (error) throw error;
    return data as Client[];
  },
  async saveClient(client: Client) {
    const { error } = await supabase.from('clients').upsert(client);
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
    return data as Purchase[];
  },
  async savePurchase(purchase: Purchase) {
    const { error } = await supabase.from('purchases').upsert(purchase);
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
    return data as JournalEntry[];
  },
  async saveJournalEntry(entry: JournalEntry) {
    const { error } = await supabase.from('journal_entries').upsert(entry);
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
    return data as CreditNote[];
  },
  async saveCreditNote(note: CreditNote) {
    const { error } = await supabase.from('credit_notes').upsert(note);
    if (error) throw error;
  },

  // Cash Sessions
  async getCashSessions(): Promise<CashSession[]> {
    const { data, error } = await supabase.from('cash_sessions').select('*').order('openingDate', { ascending: false });
    if (error) throw error;
    return data as CashSession[];
  },
  async saveCashSession(session: CashSession) {
    const { error } = await supabase.from('cash_sessions').upsert(session);
    if (error) throw error;
  },

  // Cash Movements
  async getCashMovements(): Promise<CashMovement[]> {
    const { data, error } = await supabase.from('cash_movements').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data as CashMovement[];
  },
  async saveCashMovement(movement: CashMovement) {
    const { error } = await supabase.from('cash_movements').upsert(movement);
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

  // Activity Logs
  async getActivityLogs(): Promise<ActivityLog[]> {
    const { data, error } = await supabase.from('activity_logs').select('*').order('timestamp', { ascending: false });
    if (error) throw error;
    return data as ActivityLog[];
  },
  async saveActivityLog(log: ActivityLog) {
    const { error } = await supabase.from('activity_logs').upsert(log);
    if (error) throw error;
  },
  async clearOldLogs(thresholdDate: string) {
    const { error } = await supabase.from('activity_logs').delete().lt('timestamp', thresholdDate);
    if (error) throw error;
  }
};
