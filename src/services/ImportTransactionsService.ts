/* eslint-disable no-await-in-loop */
import { getRepository } from 'typeorm';
import path from 'path';
import fs from 'fs';

import AppError from '../errors/AppError';

import uploadConfig from '../config/upload';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  transactionFilename: string;
}

class ImportTransactionsService {
  async execute({ transactionFilename }: Request): Promise<Transaction[]> {
    const transactionRepository = getRepository(Transaction);

    const transactionFilePath = path.join(
      uploadConfig.directory,
      transactionFilename,
    );

    const text = fs.readFileSync(transactionFilePath, 'utf8');
    const textArray = text.toString().split(/\r?\n/);

    const categoryRepository = getRepository(Category);

    const listTransactions: Transaction[] = [];
    for (let i = 0; i < textArray.length; i += 1) {
      if (i > 0) {
        const lineArray = textArray[i].split(',');
        const titleText = lineArray[0].trim();
        const valueText = lineArray[2].trim();
        const typeText = lineArray[1].trim();

        let modelCategory = await categoryRepository.findOne({
          where: { title: lineArray[3].trim() },
        });
        if (!modelCategory) {
          modelCategory = categoryRepository.create({
            title: lineArray[3].trim(),
          });
          await categoryRepository.save(modelCategory);
        }

        const transaction = transactionRepository.create({
          title: titleText,
          value: valueText,
          type: typeText,
          category_id: modelCategory.id,
        });

        listTransactions.push(transaction);
      }
    }

    if (listTransactions.length === 0) {
      throw new AppError(`No transactions found.`);
    }
    const savedTransactions = await transactionRepository.save(
      listTransactions,
    );

    return savedTransactions;
  }
}

export default ImportTransactionsService;
