import { z } from 'zod';

export const userRewardValidation = z.object({
    addresses: z.array(z.string()).nonempty(),
});