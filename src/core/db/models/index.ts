export { default as Product } from './Product';
export { default as InventoryBatch } from './InventoryBatch';
export { default as Transaction } from './Transaction';
export { default as TransactionItem } from './TransactionItem';

import Product from './Product';
import InventoryBatch from './InventoryBatch';
import Transaction from './Transaction';
import TransactionItem from './TransactionItem';

export const modelClasses = [Product, InventoryBatch, Transaction, TransactionItem];
