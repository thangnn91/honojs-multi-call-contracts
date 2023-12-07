import { z } from 'zod';

export const listAddressValidation = z.object({
    addresses: z.array(z.string()).nonempty(),
});