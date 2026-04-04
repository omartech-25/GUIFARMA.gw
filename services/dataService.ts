import { supabase } from './supabase';
import { Product, Sale, Client, User, Purchase, JournalEntry, CreditNote, CashSession, CashMovement, ActivityLog } from '../types';

export const dataService = {
  // Users
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return data as User[];
  },
  async saveUser(user: User) {
    const { error } = await supabase.from('users').upsert(user);
    if (error) throw error;
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
