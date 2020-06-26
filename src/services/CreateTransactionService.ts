import { getRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: string;
  category: string;
}
class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getRepository(Transaction);

    // Verifica o tipo
    if (type !== 'income' && type !== 'outcome') {
      throw new AppError(`O tipo '${type}' é invalido!`);
    }

    // ................
    if (type === 'outcome') {
      const transactionValues = await transactionRepository
        .createQueryBuilder('transaction')
        .select('type, Sum(value)')
        .groupBy('type')
        .getRawMany();

      let income = 0;
      let outcome = 0;
      for (let i = 0; i < transactionValues.length; i += 1) {
        if (transactionValues[i].type === 'income')
          income = transactionValues[i].sum;
        if (transactionValues[i].type === 'outcome')
          outcome = transactionValues[i].sum;
      }
      if (value > income - outcome) {
        throw new AppError(`O valor informado é maior que o balanço atual.`);
      }
    }

    // Verifica se a categoria existe, caso não exista, cria uma nova categoria.
    const categoryRepository = getRepository(Category);
    let modelCategory = await categoryRepository.findOne({
      where: { title: category },
    });
    if (!modelCategory) {
      modelCategory = categoryRepository.create({ title: category });
      await categoryRepository.save(modelCategory);
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id: modelCategory.id,
    });
    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
