import { IdSchema, IsoDateTimeSchema, nameSchema } from '@onestrand/core';
import { z } from 'zod';
import { command, commandBase, query, queryBase, type ContractFragment } from '../src';

/**
 * A made-up fragment for the tests: the customers of a business, with two commands and two
 * queries. It is not the customer module of the platform; that one comes with its own order.
 */

export const CustomerSchema = z.object({
  id: IdSchema,
  businessId: IdSchema,
  name: nameSchema(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});
export type Customer = z.infer<typeof CustomerSchema>;

export const customersContract = {
  'customers.create': command({
    name: 'customers.create',
    summary: 'Creates a customer of the business.',
    access: { feature: 'customers', level: 'operate' },
    input: z.object({ ...commandBase, name: nameSchema() }),
    output: z.object({ customer: CustomerSchema }),
  }),
  'customers.remove': command({
    name: 'customers.remove',
    summary: 'Removes a customer that no document refers to.',
    access: { feature: 'customers', level: 'manage', rights: ['export_delete'] },
    input: z.object({ ...commandBase, customerId: IdSchema }),
    output: z.object({}),
  }),
  'customers.list': query({
    name: 'customers.list',
    summary: 'Lists the customers of the business by name.',
    access: { feature: 'customers', level: 'view' },
    input: z.object({ ...queryBase, includeRemoved: z.boolean().default(false) }),
    output: z.object({ customers: z.array(CustomerSchema) }),
  }),
  'customers.get': query({
    name: 'customers.get',
    summary: 'Reads one customer of the business.',
    access: { feature: 'customers', level: 'view' },
    input: z.object({ ...queryBase, customerId: IdSchema }),
    output: z.object({ customer: CustomerSchema }),
  }),
} as const satisfies ContractFragment;

export type CustomersContract = typeof customersContract;
