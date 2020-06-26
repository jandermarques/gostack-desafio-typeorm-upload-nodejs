import { getConnection } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const deletedTransaction = await getConnection()
      .createQueryBuilder()
      .delete()
      .from(Transaction)
      .where('id = :id', { id })
      .execute();

    if (deletedTransaction.affected === 0) {
      throw new AppError(
        `A transação '${id}' não foi localizada para deleção.`,
      );
    }
  }
}

export default DeleteTransactionService;
