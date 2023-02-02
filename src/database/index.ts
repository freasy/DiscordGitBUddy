import { DataSource } from 'typeorm';
import 'reflect-metadata';
import { Repository } from './entities/repository.entity';

export default new DataSource({
    type: 'sqlite',
    database: 'database.sqlite',
    synchronize: true,
    entities: [Repository]
});